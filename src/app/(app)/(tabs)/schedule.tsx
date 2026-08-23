import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppHeader from "../../../components/navigation/AppHeader";
import GlassCard from "../../../components/ui/GlassCard";
import {
  formatRecurrence,
  isScheduleOnDate,
  type Schedule,
} from "../../../features/schedule";
import { supabase } from "../../../lib/supabase/client";

function parseDateTime(date: string, time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const result = new Date(`${date}T00:00:00`);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(time: string | null) {
  if (!time) return "--.--";
  return time.slice(0, 5).replace(":", ".");
}

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User belum login.");

      const { data: memberships, error: membershipsError } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      if (membershipsError) throw membershipsError;

      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id);

      if (ownedError) throw ownedError;

      const workspaceIds = Array.from(
        new Set([
          ...(memberships ?? []).map((item) => item.workspace_id),
          ...(ownedWorkspaces ?? []).map((item) => item.id),
        ]),
      );

      if (workspaceIds.length === 0) {
        setSchedules([]);
        return;
      }

      const { data, error: schedulesError } = await supabase
        .from("subject_schedules")
        .select(
          `
          id,
          subject_id,
          workspace_id,
          start_date,
          start_time,
          end_time,
          recurrence_enabled,
          recurrence_interval,
          recurrence_unit,
          recurrence_end_date,
          reminder_enabled,
          reminder_minutes,
          created_at,
          updated_at,
          subject:subjects!inner (
            id,
            name,
            lecturer,
            room
          )
        `,
        )
        .in("workspace_id", workspaceIds)
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (schedulesError) throw schedulesError;

      const normalized: Schedule[] = (data ?? []).map((item: any) => ({
        id: item.id,
        subjectId: item.subject_id,
        workspaceId: item.workspace_id,
        occurrenceDate: item.start_date,
        startDate: item.start_date,
        startTime: item.start_time,
        endTime: item.end_time,
        recurrenceEnabled: item.recurrence_enabled,
        recurrenceInterval: item.recurrence_interval,
        recurrenceUnit: item.recurrence_unit,
        recurrenceEndDate: item.recurrence_end_date,
        reminderEnabled: item.reminder_enabled,
        reminderMinutes: item.reminder_minutes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        subject: item.subject
          ? {
              id: item.subject.id,
              name: item.subject.name,
              lecturer: item.subject.lecturer,
              room: item.subject.room,
            }
          : undefined,
      }));

      setSchedules(normalized);
    } catch (err) {
      console.error("[Schedule] Failed to load:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat jadwal.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules]),
  );

  const upcomingSchedules = useMemo(() => {
    const today = new Date();
    const result: {
      schedule: Schedule;
      date: Date;
    }[] = [];

    for (let offset = 0; offset < 30; offset++) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + offset);

      schedules.forEach((schedule) => {
        if (isScheduleOnDate(schedule, date)) {
          result.push({
            schedule,
            date,
          });
        }
      });
    }

    result.sort((a, b) => {
      const first = parseDateTime(
        a.date.toISOString().slice(0, 10),
        a.schedule.startTime,
      );

      const second = parseDateTime(
        b.date.toISOString().slice(0, 10),
        b.schedule.startTime,
      );

      return first.getTime() - second.getTime();
    });

    return result.slice(0, 50);
  }, [schedules]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules();
  }, [loadSchedules]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8D8A8" />
          <Text style={styles.loadingText}>Memuat jadwal...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#A8D8A8"
            />
          }
        >
          <View style={styles.headerSection}>
            <Text style={styles.eyebrow}>SCHEDULE</Text>
            <Text style={styles.title}>Jadwal</Text>
            <Text style={styles.subtitle}>
              Semua jadwal akademik dan kegiatan kamu.
            </Text>
          </View>

          {error && (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Ionicons
                  name="alert-circle-outline"
                  size={21}
                  color="#FF8A8A"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </GlassCard>
          )}

          {upcomingSchedules.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="calendar-outline" size={30} color="#A8D8A8" />
                </View>

                <Text style={styles.emptyTitle}>Belum ada jadwal</Text>

                <Text style={styles.emptySubtitle}>
                  Buat schedule dari halaman subject untuk melihatnya di sini.
                </Text>
              </View>
            </GlassCard>
          ) : (
            upcomingSchedules.map(({ schedule, date }, index) => {
              const dateKey = date.toISOString().slice(0, 10);

              return (
                <View key={`${schedule.id}-${dateKey}-${index}`}>
                  {index === 0 ||
                  upcomingSchedules[index - 1].date.toDateString() !==
                    date.toDateString() ? (
                    <Text style={styles.dateTitle}>{formatDate(date)}</Text>
                  ) : null}

                  <GlassCard style={styles.scheduleCard}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/workspace/subject/[subjectId]",
                          params: {
                            subjectId: schedule.subjectId,
                          },
                        })
                      }
                    >
                      <View style={styles.scheduleTop}>
                        <View style={styles.timeContainer}>
                          <Text style={styles.startTime}>
                            {formatTime(schedule.startTime)}
                          </Text>

                          <View style={styles.timeLine} />

                          <Text style={styles.endTime}>
                            {formatTime(schedule.endTime)}
                          </Text>
                        </View>

                        <View style={styles.scheduleMain}>
                          <Text style={styles.subjectName} numberOfLines={2}>
                            {schedule.subject?.name ?? "Subject"}
                          </Text>

                          {schedule.subject?.lecturer && (
                            <View style={styles.metaRow}>
                              <Ionicons
                                name="person-outline"
                                size={13}
                                color="#8E998F"
                              />
                              <Text style={styles.metaText}>
                                {schedule.subject.lecturer}
                              </Text>
                            </View>
                          )}

                          {schedule.subject?.room && (
                            <View style={styles.metaRow}>
                              <Ionicons
                                name="location-outline"
                                size={13}
                                color="#8E998F"
                              />
                              <Text style={styles.metaText}>
                                {schedule.subject.room}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#667166"
                        />
                      </View>

                      <View style={styles.scheduleFooter}>
                        <View style={styles.recurrenceBadge}>
                          <Ionicons
                            name={
                              schedule.recurrenceEnabled
                                ? "repeat-outline"
                                : "calendar-outline"
                            }
                            size={13}
                            color="#A8D8A8"
                          />
                          <Text style={styles.recurrenceText}>
                            {formatRecurrence(schedule)}
                          </Text>
                        </View>

                        {schedule.reminderEnabled && (
                          <View style={styles.reminderBadge}>
                            <Ionicons
                              name="notifications-outline"
                              size={13}
                              color="#B7C3B7"
                            />
                            <Text style={styles.reminderText}>
                              {schedule.reminderMinutes}m
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </GlassCard>
                </View>
              );
            })
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#8DB88D",
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "rgba(245, 247, 243, 0.55)",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#8E998F",
  },
  errorCard: {
    marginBottom: 18,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#FF8A8A",
  },
  dateTitle: {
    marginTop: 12,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#DCE4DB",
  },
  scheduleCard: {
    marginBottom: 12,
    padding: 17,
  },
  scheduleTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeContainer: {
    width: 62,
    alignItems: "center",
  },
  startTime: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  endTime: {
    marginTop: 4,
    fontSize: 11,
    color: "#899589",
  },
  timeLine: {
    width: 1,
    height: 12,
    marginTop: 4,
    backgroundColor: "rgba(168, 216, 168, 0.35)",
  },
  scheduleMain: {
    flex: 1,
    marginLeft: 14,
    gap: 5,
  },
  subjectName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    color: "#8E998F",
  },
  scheduleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  recurrenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  recurrenceText: {
    fontSize: 11,
    color: "#A8D8A8",
  },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reminderText: {
    fontSize: 11,
    color: "#9AA69A",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,216,168,0.08)",
  },
  emptyTitle: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  emptySubtitle: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    color: "#8E998F",
  },
  bottomSpacer: {
    height: 40,
  },
});
