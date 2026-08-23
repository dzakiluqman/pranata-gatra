import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import GlassCard from "../../../../components/ui/GlassCard";
import {
  formatRecurrence,
  useSubjectSchedules,
  type Schedule,
} from "../../../../features/schedule";

import type { Subject } from "../../../../features/schedule";
import { supabase } from "../../../../lib/supabase/client";

function formatTime(time: string | null) {
  if (!time) return "--.--";
  return time.slice(0, 5).replace(":", ".");
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SubjectDetailScreen() {
  const params = useLocalSearchParams<{
    subjectId: string;
  }>();

  const subjectId = Array.isArray(params.subjectId)
    ? params.subjectId[0]
    : params.subjectId;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: schedules = [] } = useSubjectSchedules(subjectId);

  const loadSubject = useCallback(async () => {
    if (!subjectId) return;

    try {
      setLoading(true);

      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .select(
          `
            id,
            workspace_id,
            name,
            description,
            lecturer,
            room,
            reminder_enabled,
            reminder_minutes,
            created_at,
            updated_at
          `,
        )
        .eq("id", subjectId)
        .single();

      if (subjectError) throw subjectError;

      setSubject(subjectData as Subject);
    } catch (error) {
      console.error("[SubjectDetail] Failed:", error);

      Alert.alert(
        "Gagal memuat subject",
        error instanceof Error
          ? error.message
          : "Data subject tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      loadSubject();
    }, [loadSubject]),
  );

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      "Hapus schedule?",
      "Schedule ini akan dihapus secara permanen.",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(schedule.id);

              const { error } = await supabase
                .from("subject_schedules")
                .delete()
                .eq("id", schedule.id);

              if (error) throw error;

              Alert.alert("Berhasil", "Schedule berhasil dihapus.");
            } catch (error) {
              Alert.alert(
                "Gagal menghapus",
                error instanceof Error
                  ? error.message
                  : "Schedule tidak dapat dihapus.",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8D8A8" />
          <Text style={styles.loadingText}>Memuat subject...</Text>
        </View>
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF8A8A" />
          <Text style={styles.emptyTitle}>Subject tidak ditemukan</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.navigation}>
          <Pressable style={styles.backIcon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={21} color="#F5F7F3" />
          </Pressable>

          <Text style={styles.navigationTitle}>Subject</Text>

          <View style={styles.navigationSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SUBJECT</Text>
          <Text style={styles.title}>{subject.name}</Text>

          {subject.description && (
            <Text style={styles.description}>{subject.description}</Text>
          )}
        </View>

        {(subject.lecturer || subject.room) && (
          <GlassCard style={styles.infoCard}>
            {subject.lecturer && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={17} color="#A8D8A8" />
                </View>

                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Dosen</Text>
                  <Text style={styles.infoValue}>{subject.lecturer}</Text>
                </View>
              </View>
            )}

            {subject.room && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={17} color="#A8D8A8" />
                </View>

                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ruangan</Text>
                  <Text style={styles.infoValue}>{subject.room}</Text>
                </View>
              </View>
            )}
          </GlassCard>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <Text style={styles.sectionSubtitle}>
              Atur jadwal untuk subject ini.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => {
              if (!subject) return;
              router.push({
                pathname: "/workspace/subject/[subjectId]/schedule",
                params: {
                  subjectId: subject.id,
                  workspaceId: subject.workspace_id,
                },
              });
            }}
          >
            <Ionicons name="add" size={20} color="#0A0E0A" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </Pressable>
        </View>

        {schedules.length === 0 ? (
          <GlassCard>
            <View style={styles.emptySchedule}>
              <View style={styles.emptyScheduleIcon}>
                <Ionicons name="calendar-outline" size={28} color="#A8D8A8" />
              </View>

              <Text style={styles.emptyScheduleTitle}>Belum ada schedule</Text>

              <Text style={styles.emptyScheduleText}>
                Subject ini belum memiliki jadwal. Kamu bisa menambahkan jadwal
                sekali atau mengaktifkan recurrence.
              </Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  if (!subject) return;
                  router.push({
                    pathname: "/workspace/subject/[subjectId]/schedule",
                    params: {
                      subjectId: subject.id,
                      workspaceId: subject.workspace_id,
                    },
                  });
                }}
              >
                <Ionicons name="calendar-outline" size={17} color="#0A0E0A" />
                <Text style={styles.primaryButtonText}>Buat Schedule</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.scheduleList}>
            {schedules.map((schedule) => (
              <GlassCard key={schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateText}>
                      {formatDate(schedule.startDate)}
                    </Text>

                    <Text style={styles.timeText}>
                      {formatTime(schedule.startTime)}
                      {" - "}
                      {formatTime(schedule.endTime)}
                    </Text>
                  </View>

                  <View style={styles.scheduleActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => {
                        if (!subject) return;
                        router.push({
                          pathname: "/workspace/subject/[subjectId]/schedule",
                          params: {
                            subjectId: subject.id,
                            workspaceId: subject.workspace_id,
                            scheduleId: schedule.id,
                          },
                        });
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color="#B8C5B8"
                      />
                    </Pressable>

                    <Pressable
                      style={styles.actionButton}
                      disabled={deletingId === schedule.id}
                      onPress={() => handleDeleteSchedule(schedule)}
                    >
                      {deletingId === schedule.id ? (
                        <ActivityIndicator size="small" color="#FF8A8A" />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color="#FF8A8A"
                        />
                      )}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.scheduleMeta}>
                  <View style={styles.metaBadge}>
                    <Ionicons
                      name={
                        schedule.recurrenceEnabled
                          ? "repeat-outline"
                          : "calendar-outline"
                      }
                      size={14}
                      color="#A8D8A8"
                    />

                    <Text style={styles.metaBadgeText}>
                      {formatRecurrence(schedule)}
                    </Text>
                  </View>

                  {schedule.reminderEnabled && (
                    <View style={styles.metaBadge}>
                      <Ionicons
                        name="notifications-outline"
                        size={14}
                        color="#A8B5A8"
                      />

                      <Text style={styles.metaBadgeText}>
                        {schedule.reminderMinutes} menit
                      </Text>
                    </View>
                  )}
                </View>

                {schedule.recurrenceEnabled && schedule.recurrenceEndDate && (
                  <Text style={styles.endDate}>
                    Sampai {formatDate(schedule.recurrenceEndDate)}
                  </Text>
                )}
              </GlassCard>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
  },
  navigation: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  navigationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  navigationSpacer: {
    width: 40,
  },
  hero: {
    marginTop: 22,
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#8DB88D",
  },
  title: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#8E998F",
  },
  infoCard: {
    gap: 16,
    marginBottom: 28,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,216,168,0.08)",
  },
  infoContent: {
    flex: 1,
    marginLeft: 11,
  },
  infoLabel: {
    fontSize: 10,
    color: "#778277",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E7ECE6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F5F7F3",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "#7F8B80",
  },
  addButton: {
    height: 40,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    backgroundColor: "#A8D8A8",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0A0E0A",
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dateBlock: {
    flex: 1,
    paddingRight: 12,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E7ECE6",
  },
  timeText: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "800",
    color: "#A8D8A8",
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 7,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  scheduleMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(168,216,168,0.07)",
  },
  metaBadgeText: {
    fontSize: 10,
    color: "#A8B5A8",
  },
  endDate: {
    marginTop: 10,
    fontSize: 10,
    color: "#717D72",
  },
  emptySchedule: {
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  emptyScheduleIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,216,168,0.08)",
  },
  emptyScheduleTitle: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  emptyScheduleText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    color: "#818C82",
  },
  primaryButton: {
    marginTop: 18,
    height: 44,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "#A8D8A8",
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0A0E0A",
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  backButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#A8D8A8",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A0E0A",
  },
  bottomSpacer: {
    height: 30,
  },
});
