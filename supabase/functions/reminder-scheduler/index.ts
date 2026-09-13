// Supabase Edge Function: reminder-scheduler
// Cron / Scheduled job for Task Reminders and Subject/Class Schedule Reminders.
// Prevents duplicate alerts via `notification_logs` table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface TaskReminderRow {
  task_id: string;
  task_title: string;
  task_deadline: string;
  recipient_user_id: string;
  workspace_id: string;
  workspace_name: string;
}

interface ScheduleReminderRow {
  schedule_id: string;
  subject_name: string;
  start_time: string;
  room: string | null;
  lecturer: string | null;
  workspace_id: string;
  recipient_user_id: string;
  reference_key: string;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase server credentials." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const messagesToSend: Array<{
      to: string;
      sound: string;
      title: string;
      body: string;
      data: Record<string, unknown>;
      channelId: string;
      priority: string;
    }> = [];

    const logsToRecord: Array<{
      user_id: string;
      notification_type: string;
      reference_id: string;
      metadata: Record<string, unknown>;
    }> = [];

    // =========================================================================
    // 1. TASK REMINDERS
    // =========================================================================
    const { data: taskReminders, error: taskError } = await supabase.rpc(
      "get_upcoming_task_reminders"
    );

    if (taskError) {
      console.error("Error fetching task reminders:", taskError);
    } else if (Array.isArray(taskReminders) && taskReminders.length > 0) {
      for (const row of taskReminders as TaskReminderRow[]) {
        // Fetch user push tokens
        const { data: tokens } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", row.recipient_user_id);

        if (tokens && tokens.length > 0) {
          const deadlineDate = new Date(row.task_deadline);
          const timeStr = deadlineDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const title = "Task Deadline Approaching";
          const body = `Task "${row.task_title}" in ${row.workspace_name} is due at ${timeStr}.`;
          const data = {
            type: "task_reminder",
            reference_id: row.task_id,
            task_id: row.task_id,
            workspace_id: row.workspace_id,
          };

          for (const t of tokens) {
            messagesToSend.push({
              to: t.token,
              sound: "default",
              title,
              body,
              data,
              channelId: "default",
              priority: "high",
            });
          }

          logsToRecord.push({
            user_id: row.recipient_user_id,
            notification_type: "task_reminder",
            reference_id: row.task_id,
            metadata: { title, body, deadline: row.task_deadline },
          });
        }
      }
    }

    // =========================================================================
    // 2. SCHEDULE / CLASS REMINDERS
    // =========================================================================
    const { data: scheduleReminders, error: scheduleError } =
      await supabase.rpc("get_upcoming_schedule_reminders");

    if (scheduleError) {
      console.error("Error fetching schedule reminders:", scheduleError);
    } else if (
      Array.isArray(scheduleReminders) &&
      scheduleReminders.length > 0
    ) {
      for (const row of scheduleReminders as ScheduleReminderRow[]) {
        const { data: tokens } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", row.recipient_user_id);

        if (tokens && tokens.length > 0) {
          const title = "Class Schedule Reminder";
          const body = `${row.subject_name} starts at ${row.start_time}${
            row.room ? ` in ${row.room}` : ""
          }.`;
          const data = {
            type: "schedule_reminder",
            reference_id: row.reference_key,
            schedule_id: row.schedule_id,
            workspace_id: row.workspace_id,
          };

          for (const t of tokens) {
            messagesToSend.push({
              to: t.token,
              sound: "default",
              title,
              body,
              data,
              channelId: "default",
              priority: "high",
            });
          }

          logsToRecord.push({
            user_id: row.recipient_user_id,
            notification_type: "schedule_reminder",
            reference_id: row.reference_key,
            metadata: { title, body, schedule_id: row.schedule_id },
          });
        }
      }
    }

    // =========================================================================
    // 3. DISPATCH EXPO PUSH NOTIFICATIONS
    // =========================================================================
    let sentCount = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < messagesToSend.length; i += 100) {
      const batch = messagesToSend.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(batch),
      });

      if (res.ok) {
        const result = await res.json();
        const tickets = result?.data ?? [];
        tickets.forEach(
          (
            ticket: {
              status: string;
              details?: { error?: string };
            },
            idx: number
          ) => {
            if (ticket.status === "ok") {
              sentCount++;
            } else if (
              ticket.details?.error === "DeviceNotRegistered" ||
              ticket.details?.error === "InvalidCredentials"
            ) {
              invalidTokens.push(batch[idx].to);
            }
          }
        );
      }
    }

    // Delete stale tokens
    if (invalidTokens.length > 0) {
      await supabase.from("push_tokens").delete().in("token", invalidTokens);
    }

    // Insert notification logs to ensure idempotency
    if (logsToRecord.length > 0) {
      await supabase.from("notification_logs").upsert(logsToRecord, {
        onConflict: "user_id,notification_type,reference_id",
        ignoreDuplicates: true,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_messages: sentCount,
        task_reminders_count: taskReminders?.length ?? 0,
        schedule_reminders_count: scheduleReminders?.length ?? 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
