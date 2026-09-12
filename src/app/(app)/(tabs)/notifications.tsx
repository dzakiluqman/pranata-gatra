import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

import type { Schedule } from "@/features/schedule";
import { formatRecurrence, useTodaySchedules } from "@/features/schedule";
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
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<
    string | undefined
  >(undefined);

  const { data: todaySchedules = [] } = useTodaySchedules(currentWorkspaceId);

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
        setCurrentWorkspaceId(undefined);
        return;
      }

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
        .ilike("invitee_email", user.email)
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

      // Fetch user's workspaces to set current workspace for schedules
      const { data: ownedWorkspaces, error: ownedWorkspaceError } =
        await supabase.from("workspaces").select("id").eq("owner_id", user.id);

      if (ownedWorkspaceError) {
        throw ownedWorkspaceError;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      if (membershipError) {
        throw membershipError;
      }

      const workspaceIds = Array.from(
        new Set([
          ...(ownedWorkspaces ?? []).map((workspace) => workspace.id),
          ...(memberships ?? []).map((membership) => membership.workspace_id),
        ]),
      );

      // Set first workspace to load schedules
      if (workspaceIds.length > 0) {
        setCurrentWorkspaceId(workspaceIds[0]);
      }
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
  }, []);

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

      const { data, error } = await supabase.rpc(
        "accept_workspace_invitation",
        {
          p_invitation_id: invitation.id,
        },
      );

      if (error) {
        throw error;
      }

      if (data === false) {
        throw new Error("Invitation tidak dapat diterima.");
      }

      setInvitations((current) =>
        current.filter((item) => item.id !== invitation.id),
      );

      Alert.alert(
        "Invitation diterima",
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
      "Tolak invitation?",
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

              const { error } = await supabase
                .from("workspace_invitations")
                .update({
                  status: "declined",
                })
                .eq("id", invitation.id)
                .eq("status", "pending");

              if (error) {
                throw error;
              }

              setInvitations((current) =>
                current.filter((item) => item.id !== invitation.id),
              );

              Alert.alert(
                "Invitation ditolak",
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
            <Ionicons name="people-outline" size={25} color="#A8D8A8" />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Workspace Invitation</Text>

            <Text style={styles.cardMessage}>
              <Text style={styles.inviterName}>{inviterName}</Text> mengundang
              kamu untuk bergabung ke{" "}
              <Text style={styles.workspaceName}>{workspaceName}</Text>.
            </Text>
          </View>
        </View>

        <View style={styles.workspaceInfo}>
          <View style={styles.workspaceInfoIcon}>
            <Ionicons name="briefcase-outline" size={17} color="#B6C7B6" />
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
            {isProcessing ? (
              <ActivityIndicator size="small" color="#0A0E0A" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#0A0E0A" />

                <Text style={styles.acceptText}>Terima</Text>
              </>
            )}
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
          <Ionicons name="calendar-outline" size={22} color="#A8D8A8" />
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
                  color="#A8D8A8"
                />

                <Text style={styles.reminderText}>
                  Reminder {reminderDisplay}
                </Text>
              </View>
            )}
          </View>

          {schedule.subject?.room && (
            <View style={styles.roomRow}>
              <Ionicons name="location-outline" size={12} color="#7F8A80" />

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
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8D8A8" />

          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      </View>
    );
  }

  const totalNotifications = invitations.length + todaySchedules.length;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NOTIFICATIONS</Text>

            <Text style={styles.title}>Notifikasi</Text>

            <Text style={styles.subtitle}>Invitation dan jadwal hari ini.</Text>
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
              tintColor="#A8D8A8"
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
                    <Text style={styles.sectionEyebrow}>TODAY</Text>

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
                    color="#A8D8A8"
                  />
                </View>

                <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>

                <Text style={styles.emptyDescription}>
                  Saat ada invitation workspace atau jadwal hari ini, informasi
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
    backgroundColor: "#0A0E0A",
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

  badge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A8D8A8",
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A0E0A",
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
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#8DB88D",
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F5F7F3",
  },

  sectionBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(168, 216, 168, 0.15)",
  },

  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A8D8A8",
  },

  scheduleList: {
    gap: 10,
  },

  scheduleNotification: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },

  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(168, 216, 168, 0.12)",
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
    fontSize: 14,
    fontWeight: "800",
    color: "#F5F7F3",
  },

  scheduleTime: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B9DAB9",
  },

  scheduleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 7,
  },

  scheduleRecurrence: {
    fontSize: 10,
    color: "#A2AFA1",
  },

  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(168, 216, 168, 0.07)",
  },

  reminderText: {
    fontSize: 9,
    color: "#A8D8A8",
    fontWeight: "600",
  },

  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  roomText: {
    fontSize: 10,
    color: "#7F8A80",
  },

  card: {
    padding: 17,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  invitationIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(168, 216, 168, 0.15)",
  },

  cardContent: {
    flex: 1,
    marginLeft: 13,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F5F7F3",
  },

  cardMessage: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(245, 247, 243, 0.62)",
  },

  inviterName: {
    fontWeight: "700",
    color: "#F5F7F3",
  },

  workspaceName: {
    fontWeight: "700",
    color: "#B9DAB9",
  },

  workspaceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
  },

  workspaceInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.08)",
  },

  workspaceInfoContent: {
    flex: 1,
    marginLeft: 10,
  },

  workspaceInfoName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  workspaceRole: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(245, 247, 243, 0.45)",
    textTransform: "capitalize",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  declineButton: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  declineText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#BFC5BF",
  },

  acceptButton: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 13,
    backgroundColor: "#A8D8A8",
  },

  acceptText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A0E0A",
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.55,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(245, 247, 243, 0.55)",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 216, 168, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(168, 216, 168, 0.12)",
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 19,
    fontWeight: "800",
    color: "#F5F7F3",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 320,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(245, 247, 243, 0.48)",
    textAlign: "center",
  },
});
