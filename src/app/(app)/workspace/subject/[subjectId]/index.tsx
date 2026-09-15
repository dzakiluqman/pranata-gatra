import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/ui";
import { COLORS, FONTS } from "@/constants/theme";
import {
  formatRecurrence,
  useSchedule,
  useSubject,
  useSubjectSchedules,
  type Schedule,
} from "@/features/schedule";

function formatTime(time: string | null) {
  if (!time) return "--.--";
  return time.slice(0, 5).replace(":", ".");
}

function formatDate(date: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export default function SubjectDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    subjectId: string;
  }>();

  const subjectId = Array.isArray(params.subjectId)
    ? params.subjectId[0]
    : params.subjectId;

  const { data: subject, isLoading: loadingSubject } = useSubject(subjectId);
  const { data: schedules = [] } = useSubjectSchedules(subjectId);
  const { deleteSchedule } = useSchedule();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      "Hapus Schedule?",
      "Jadwal ini akan dihapus secara permanen.",
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
              await deleteSchedule(schedule.id);
              Alert.alert("Berhasil", "Jadwal berhasil dihapus.");
            } catch (error) {
              Alert.alert(
                "Gagal menghapus",
                error instanceof Error
                  ? error.message
                  : "Jadwal tidak dapat dihapus.",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleAddSchedule = () => {
    if (!subject) return;
    router.push({
      pathname: "/workspace/subject/[subjectId]/schedule",
      params: {
        subjectId: subject.id,
        workspaceId: subject.workspace_id,
      },
    });
  };

  const handleEditSchedule = (schedule: Schedule) => {
    if (!subject) return;
    router.push({
      pathname: "/workspace/subject/[subjectId]/schedule",
      params: {
        subjectId: subject.id,
        workspaceId: subject.workspace_id,
        scheduleId: schedule.id,
      },
    });
  };

  if (loadingSubject && !subject) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.bgBlack, COLORS.bgDark, COLORS.bgBlack]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
          <Text style={styles.loadingText}>Memuat subject...</Text>
        </View>
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.bgBlack, COLORS.bgDark, COLORS.bgBlack]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={44} color={COLORS.danger} />
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
        colors={[COLORS.bgBlack, '#131316', COLORS.bgBlack]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* Navigation Bar */}
        <View style={styles.navigation}>
          <Pressable
            style={({ pressed }) => [
              styles.backIcon,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.goldText} />
          </Pressable>

          <Text style={styles.navigationTitle}>Detail Subject</Text>

          <View style={styles.navigationSpacer} />
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrow}>SUBJECT</Text>
            </View>
          </View>

          <Text style={styles.title}>{subject.name}</Text>

          {subject.description ? (
            <Text style={styles.description}>{subject.description}</Text>
          ) : null}
        </View>

        {/* Subject Info Card */}
        {(subject.lecturer || subject.room) && (
          <GlassCard style={styles.infoCard}>
            {subject.lecturer && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="person-outline" size={17} color={COLORS.goldText} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Dosen</Text>
                  <Text style={styles.infoValue}>{subject.lecturer}</Text>
                </View>
              </View>
            )}

            {subject.room && (
              <View
                style={[
                  styles.infoRow,
                  subject.lecturer ? { marginTop: 12 } : null,
                ]}
              >
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={17} color={COLORS.goldText} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ruangan</Text>
                  <Text style={styles.infoValue}>{subject.room}</Text>
                </View>
              </View>
            )}
          </GlassCard>
        )}

        {/* Section Header: Schedule */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Jadwal / Schedule</Text>
            <Text style={styles.sectionSubtitle}>
              Atur jadwal pertemuan untuk subject ini.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={handleAddSchedule}
            hitSlop={8}
          >
            <LinearGradient
              colors={COLORS.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={18} color={COLORS.textDark} />
              <Text style={styles.addButtonText}>Tambah</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Schedules List */}
        {schedules.length === 0 ? (
          <GlassCard style={styles.emptyScheduleCard}>
            <View style={styles.emptySchedule}>
              <View style={styles.emptyScheduleIcon}>
                <Ionicons name="calendar-outline" size={28} color={COLORS.primaryGold} />
              </View>

              <Text style={styles.emptyScheduleTitle}>Belum ada jadwal</Text>

              <Text style={styles.emptyScheduleText}>
                Subject ini belum memiliki jadwal. Kamu bisa menambahkan jadwal
                sekali atau mengaktifkan pengulangan mingguan.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleAddSchedule}
              >
                <LinearGradient
                  colors={COLORS.goldGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <Ionicons name="calendar-outline" size={17} color={COLORS.textDark} />
                  <Text style={styles.primaryButtonText}>Buat Jadwal Baru</Text>
                </LinearGradient>
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
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleEditSchedule(schedule)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={COLORS.goldText}
                      />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.pressed,
                      ]}
                      disabled={deletingId === schedule.id}
                      onPress={() => handleDeleteSchedule(schedule)}
                      hitSlop={6}
                    >
                      {deletingId === schedule.id ? (
                        <ActivityIndicator size="small" color={COLORS.danger} />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color={COLORS.danger}
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
                      size={13}
                      color={COLORS.goldText}
                    />

                    <Text style={styles.metaBadgeText}>
                      {formatRecurrence(schedule)}
                    </Text>
                  </View>

                  {schedule.reminderEnabled && (
                    <View style={styles.metaBadge}>
                      <Ionicons
                        name="notifications-outline"
                        size={13}
                        color={COLORS.textMuted}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 60,
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
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  navigationTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textLight,
  },
  navigationSpacer: {
    width: 40,
  },
  hero: {
    marginTop: 20,
    marginBottom: 20,
  },
  eyebrowRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  eyebrowBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },
  eyebrow: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.goldText,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    lineHeight: 32,
    color: COLORS.textLight,
  },
  description: {
    fontFamily: FONTS.regular,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },
  infoContent: {
    marginLeft: 12,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
  },
  sectionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },
  emptyScheduleCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  emptySchedule: {
    alignItems: "center",
  },
  emptyScheduleIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    marginBottom: 14,
  },
  emptyScheduleTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  emptyScheduleText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textDark,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dateBlock: {
    flex: 1,
  },
  dateText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textLight,
  },
  timeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.goldText,
    marginTop: 3,
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  scheduleMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },
  metaBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.goldText,
  },
  endDate: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  backButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textLight,
  },
  pressed: {
    opacity: 0.75,
  },
});
