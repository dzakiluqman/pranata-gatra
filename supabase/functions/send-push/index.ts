// Supabase Edge Function: send-push
// Sends real push notifications via Expo Push API (https://exp.host/--/api/v2/push/send)
// Automatically handles batching, token cleanup (DeviceNotRegistered), and notification logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  // Webhook payload support (from workspace_invitations insert)
  type?: string;
  record?: {
    id: string;
    workspace_id: string;
    inviter_id: string;
    invitee_email: string;
    role: string;
    status: string;
  };
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req: Request) => {
  // CORS Handling
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

    const body: PushPayload = await req.json();

    let targetUserIds: string[] = [];
    let title = body.title || "Pranata Gatra";
    let messageBody = body.body || "";
    let dataPayload: Record<string, unknown> = body.data || {};
    let notificationType =
      typeof dataPayload.type === "string" ? dataPayload.type : "generic";
    let referenceId =
      typeof dataPayload.reference_id === "string"
        ? dataPayload.reference_id
        : "";

    // Case 1: Triggered by Supabase Database Webhook on `workspace_invitations`
    if (body.record && body.record.invitee_email) {
      notificationType = "workspace_invitation";
      referenceId = body.record.id;

      // Find user ID for invitee email
      const { data: userData } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", body.record.invitee_email)
        .maybeSingle();

      if (userData?.id) {
        targetUserIds.push(userData.id);
      } else {
        // Look up in auth.users via admin API
        const { data: authUsers } =
          await supabase.auth.admin.listUsers();
        const found = authUsers?.users?.find(
          (u: { id: string; email?: string }) =>
            u.email?.toLowerCase() ===
            body.record?.invitee_email?.toLowerCase()
        );
        if (found?.id) {
          targetUserIds.push(found.id);
        }
      }

      if (targetUserIds.length === 0) {
        return new Response(
          JSON.stringify({
            message: `Invitee ${body.record.invitee_email} does not have an account yet. Push notification skipped.`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch inviter full name
      let inviterName = "Someone";
      if (body.record.inviter_id) {
        const { data: inviterProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", body.record.inviter_id)
          .maybeSingle();

        inviterName =
          inviterProfile?.full_name ||
          inviterProfile?.email?.split("@")[0] ||
          "Someone";
      }

      // Fetch workspace name
      let workspaceName = "a workspace";
      if (body.record.workspace_id) {
        const { data: wsData } = await supabase
          .from("workspaces")
          .select("name")
          .eq("id", body.record.workspace_id)
          .maybeSingle();

        if (wsData?.name) {
          workspaceName = wsData.name;
        }
      }

      title = "New Workspace Invitation";
      messageBody = `${inviterName} invited you to join ${workspaceName}`;
      dataPayload = {
        type: "workspace_invitation",
        reference_id: body.record.id,
        workspace_id: body.record.workspace_id,
      };
    } else {
      // Case 2: Explicit request with user_id or user_ids
      if (body.user_id) {
        targetUserIds.push(body.user_id);
      }
      if (Array.isArray(body.user_ids)) {
        targetUserIds.push(...body.user_ids);
      }
    }

    targetUserIds = [...new Set(targetUserIds.filter(Boolean))];

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No target user specified." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Query push tokens for the recipient user(s)
    const { data: tokensData, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, user_id, device_type")
      .in("user_id", targetUserIds);

    if (tokensError) {
      return new Response(JSON.stringify({ error: tokensError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!tokensData || tokensData.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No registered push tokens found for target user(s).",
          user_ids: targetUserIds,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Prepare Expo Push Messages
    const messages = tokensData.map(
      (item: { token: string; user_id: string; device_type: string }) => ({
        to: item.token,
        sound: 'default',
        title,
        body: messageBody,
        data: dataPayload,
        channelId: 'default',
        priority: 'high',
        badge: 1,
      })
    );

    // 4. Send messages to Expo Push API in batches of 100
    const invalidTokensToDelete: string[] = [];
    let sentCount = 0;

    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const expoRes = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(batch),
      });

      if (!expoRes.ok) {
        console.error("Expo push server returned error:", await expoRes.text());
        continue;
      }

      const expoData = await expoRes.json();
      const tickets: ExpoPushTicket[] = expoData?.data ?? [];

      tickets.forEach((ticket, idx) => {
        if (ticket.status === "ok") {
          sentCount++;
        } else if (ticket.status === "error") {
          console.warn("Push error for token:", batch[idx].to, ticket.details);
          // Token is no longer valid; remove it from database
          if (
            ticket.details?.error === "DeviceNotRegistered" ||
            ticket.details?.error === "InvalidCredentials"
          ) {
            invalidTokensToDelete.push(batch[idx].to);
          }
        }
      });
    }

    // 5. Cleanup invalid tokens if any
    if (invalidTokensToDelete.length > 0) {
      await supabase
        .from("push_tokens")
        .delete()
        .in("token", invalidTokensToDelete);
      console.log(
        `Cleaned up ${invalidTokensToDelete.length} unregistered device token(s).`
      );
    }

    // 6. Record in notification_logs for idempotency
    if (referenceId && notificationType) {
      const logRows = targetUserIds.map((uid) => ({
        user_id: uid,
        notification_type: notificationType,
        reference_id: referenceId,
        metadata: {
          title,
          body: messageBody,
          sent_tokens_count: sentCount,
        },
      }));

      await supabase
        .from("notification_logs")
        .upsert(logRows, {
          onConflict: "user_id,notification_type,reference_id",
          ignoreDuplicates: true,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: sentCount,
        recipients_count: targetUserIds.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in send-push:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
