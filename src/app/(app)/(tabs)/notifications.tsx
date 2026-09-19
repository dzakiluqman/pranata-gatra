import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { COLORS, FONTS } from "@/constants/theme";
import type { Schedule } from "@/features/schedule";
import { formatRecurrence, useTodaySchedules } from "@/features/schedule";
import { workspaceMemberService } from "@/features/workspace/services/workspaceMemberService";
import { supabase } from "@/lib/supabase";

type WorkspaceInvitation = {
  id: string;
  workspace_id: string;
  inviter_id: string;
  invitee_email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  workspace: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  inviter: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
};

function formatScheduleTime(value: string) {
  return value.slice(0, 5).replace(":", ".");
}

function formatScheduleRange(start: string, end: string) {
  return `${formatScheduleTime(start)} - ${formatScheduleTime(end)}`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: todaySchedules = [], refetch: refetchTodaySchedules } =
    useTodaySchedules();

  const loadNotifications = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user?.email) {
        setInvitations([]);
        return;
      }

      const cleanEmail = user.email.trim().toLowerCase();

      // Load invitations
      const { data: invitationData, error: invitationError } = await supabase
        .from("workspace_invitations")
        .select(
          `
              id,
              workspace_id,
              inviter_id,
              invitee_email,
              role,
              token,
              status,
              expires_at,
              accepted_at,
              created_at,
              workspace:workspaces (
                id,
                name,
                description
              ),
              inviter:profiles!workspace_invitations_inviter_id_fkey (
                id,
                full_name,
                email,
                avatar_url
              )
            `,
        )
        .ilike("invitee_email", cleanEmail)
        .eq("status", "pending")
        .order("created_at", {
          ascending: false,
        });

      if (invitationError) {
        throw invitationError;
      }

      type RawInvitation = {
        id: string;
        workspace_id: string;
        inviter_id: string;
        invitee_email: string;
        role: string;
        token: string;
        status: string;
        expires_at: string;
        accepted_at: string | null;
        created_at: string;
        workspace:
          | { id: string; name: string; description: string | null }
          | { id: string; name: string; description: string | null }[]
          | null;
        inviter:
          | { id: string; full_name: string | null; email: string; avatar_url: string | null }
          | { id: string; full_name: string | null; email: string; avatar_url: string | null }[]
          | null;
      };

      const rawData = (invitationData ?? []) as unknown as RawInvitation[];
      const normalizedInvitations: WorkspaceInvitation[] = rawData.map((item) => ({
        ...item,
        workspace: Array.isArray(item.workspace)
          ? (item.workspace[0] ?? null)
          : item.workspace,
        inviter: Array.isArray(item.inviter)
          ? (item.inviter[0] ?? null)
          : item.inviter,
      }));

      setInvitations(normalizedInvitations);
      refetchTodaySchedules();
    } catch (error) {
      console.error("Failed to load notifications:", error);

      Alert.alert(
        "Gagal memuat notifikasi",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil notifikasi.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [refetchTodaySchedules]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
  };

  const handleAccept = async (invitation: WorkspaceInvitation) => {
    if (processingId) {
      return;
    }

    try {
      setProcessingId(invitation.id);
      await workspaceMemberService.acceptInvitation(invitation.id);

      // Invalidate queries so all dependent views refetch from DB
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
      queryClient.invalidateQueries({ queryKey: ["my-workspace-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      // Refresh source of truth from database
      await loadNotifications();

      Alert.alert(
        "Invitation Diterima",
        `Kamu sekarang menjadi member workspace "${invitation.workspace?.name ?? "Workspace"}".`,
      );
    } catch (error) {
      console.error("Failed to accept invitation:", error);

      Alert.alert(
        "Gagal menerima invitation",
        error instanceof Error
          ? error.message
          : "Invitation tidak dapat diterima.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: WorkspaceInvitation) => {
    if (processingId) {
      return;
    }

    Alert.alert(
      "Tolak Invitation?",
      `Kamu yakin ingin menolak invitation ke "${invitation.workspace?.name ?? "Workspace"}"?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Tolak",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(invitation.id);
              await workspaceMemberService.declineInvitation(invitation.id);

              queryClient.invalidateQueries({ queryKey: ["my-workspace-invitations"] });
              await loadNotifications();

              Alert.alert(
                "Invitation Ditolak",
                "Invitation workspace telah ditolak.",
              );
            } catch (error) {
              console.error("Failed to decline invitation:", error);

              Alert.alert(
                "Gagal menolak invitation",
                error instanceof Error
                  ? error.message
                  : "Invitation tidak dapat ditolak.",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const renderInvitation = ({ item }: { item: WorkspaceInvitation }) => {
    const inviterName =
      item.inviter?.full_name || item.inviter?.email || "Seseorang";

    const workspaceName = item.workspace?.name || "Workspace";

    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.invitationIcon}>
            <Ionicons name="people-outline" size={24} color={COLORS.goldText} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Undangan Workspace</Text>

            <Text style={styles.cardMessage}>
              <Text style={styles.inviterName}>{inviterName}</Text> mengundang
              kamu untuk bergabung ke{" "}
              <Text style={styles.workspaceName}>{workspaceName}</Text>.
            </Text>
          </View>
        </View>

        <View style={styles.workspaceInfo}>
          <View style={styles.workspaceInfoIcon}>
            <Ionicons name="briefcase-outline" size={16} color={COLORS.goldText} />
          </View>

          <View style={styles.workspaceInfoContent}>
            <Text style={styles.workspaceInfoName}>{workspaceName}</Text>
            <Text style={styles.workspaceRole}>Role: {item.role}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.declineButton,
              pressed && styles.pressed,
              isProcessing && styles.disabled,
            ]}
          >
            <Text style={styles.declineText}>Tolak</Text>
          </Pressable>

          <Pressable
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.pressed,
              isProcessing && styles.disabled,
            ]}
          >
            <LinearGradient
              colors={COLORS.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.acceptButtonGradient}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.textDark} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={17} color={COLORS.textDark} />
                  <Text style={styles.acceptText}>Terima</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderSchedule = (schedule: Schedule) => {
    const reminderTime = new Date(
      `${schedule.occurrenceDate ?? ""}T${schedule.startTime}`,
    );
    reminderTime.setMinutes(
      reminderTime.getMinutes() - (schedule.reminderMinutes || 0),
    );

    const reminderDisplay = `${reminderTime.getHours().toString().padStart(2, "0")}.${reminderTime.getMinutes().toString().padStart(2, "0")}`;

    return (
      <View key={schedule.id} style={styles.scheduleNotification}>
        <View style={styles.scheduleIcon}>
          <Ionicons name="calendar-outline" size={22} color={COLORS.goldText} />
        </View>

        <View style={styles.scheduleContent}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle} numberOfLines={1}>
              {schedule.subject?.name ?? "Subject"}
            </Text>

            <Text style={styles.scheduleTime}>
              {formatScheduleRange(schedule.startTime, schedule.endTime)}
            </Text>
          </View>

          <View style={styles.scheduleMetaRow}>
            <Text style={styles.scheduleRecurrence}>
              {formatRecurrence(schedule)}
            </Text>

            {schedule.reminderEnabled && (
              <View style={styles.reminderBadge}>
                <Ionicons
                  name="notifications-outline"
                  size={11}
                  color={COLORS.goldText}
                />

                <Text style={styles.reminderText}>
                  Reminder {reminderDisplay}
                </Text>
              </View>
            )}
          </View>

          {schedule.subject?.room && (
            <View style={styles.roomRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.roomText}>{schedule.subject.room}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient
          colors={[COLORS.bgBlack, '#131316', COLORS.bgBlack]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      </View>
    );
  }

  const totalNotifications = invitations.length + todaySchedules.length;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bgBlack, '#131316', COLORS.bgBlack]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NOTIFIKASI</Text>
            <Text style={styles.title}>Notifikasi</Text>
            <Text style={styles.subtitle}>Undangan dan jadwal pertemuan hari ini.</Text>
          </View>

          {totalNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalNotifications}</Text>
            </View>
          )}
        </View>

        <FlatList
          data={invitations}
          keyExtractor={(item) => item.id}
          renderItem={renderInvitation}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primaryGold}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 120 },
          ]}
          ListHeaderComponent={
            todaySchedules.length > 0 ? (
              <View style={styles.scheduleSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionEyebrow}>HARI INI</Text>
                    <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
                  </View>

                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>
                      {todaySchedules.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.scheduleList}>
                  {todaySchedules.map(renderSchedule)}
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            invitations.length === 0 && todaySchedules.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={34}
                    color={COLORS.primaryGold}
                  />
                </View>

                <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>

                <Text style={styles.emptyDescription}>
                  Saat ada undangan workspace atau jadwal hari ini, informasi
                  tersebut akan muncul di sini.
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 18,
    paddingBottom: 22,
  },

  eyebrow: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.goldText,
    marginBottom: 4,
  },

  title: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.textLight,
  },

  subtitle: {
    fontFamily: FONTS.regular,
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  badge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryGold,
  },

  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },

  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },

  scheduleSection: {
    marginBottom: 22,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionEyebrow: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: COLORS.goldText,
    marginBottom: 3,
  },

  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
  },

  sectionBadge: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },

  sectionBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.goldText,
  },

  scheduleList: {
    gap: 10,
  },

  scheduleNotification: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },

  scheduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },

  scheduleContent: {
    flex: 1,
    marginLeft: 12,
  },

  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  scheduleTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
  },

  scheduleTime: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.goldText,
  },

  scheduleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },

  scheduleRecurrence: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.goldSoft,
  },

  reminderText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: COLORS.goldText,
  },

  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  roomText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  card: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  invitationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },

  cardContent: {
    flex: 1,
    marginLeft: 12,
  },

  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textLight,
  },

  cardMessage: {
    fontFamily: FONTS.regular,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },

  inviterName: {
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
  },

  workspaceName: {
    fontFamily: FONTS.bold,
    color: COLORS.goldText,
  },

  workspaceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },

  workspaceInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
  },

  workspaceInfoContent: {
    flex: 1,
    marginLeft: 10,
  },

  workspaceInfoName: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textLight,
  },

  workspaceRole: {
    fontFamily: FONTS.regular,
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "capitalize",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  declineButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },

  declineText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },

  acceptButtonGradient: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
  },

  acceptText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.55,
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
    paddingHorizontal: 30,
    paddingVertical: 50,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },

  emptyTitle: {
    fontFamily: FONTS.bold,
    marginTop: 16,
    fontSize: 17,
    color: COLORS.textLight,
    textAlign: "center",
  },

  emptyDescription: {
    fontFamily: FONTS.regular,
    maxWidth: 300,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
