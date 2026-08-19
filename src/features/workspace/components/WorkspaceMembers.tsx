import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useWorkspaceMembers } from "../hooks/useWorkspaceMembers";
import { MemberCard } from "./MemberCard";
import { MemberForm } from "./MemberForm";

type WorkspaceMembersProps = {
  workspaceId: string;
};

export function WorkspaceMembers({ workspaceId }: WorkspaceMembersProps) {
  const {
    members,
    invitations,
    isLoading,
    error,
    inviteMember,
    removeMember,
    isInviting,
    isRemoving,
  } = useWorkspaceMembers(workspaceId);

  const handleInvite = async (email: string) => {
    await inviteMember({ email });

    Alert.alert(
      "Invitation terkirim",
      `Invitation berhasil dikirim ke ${email}.`,
    );
  };

  const handleRemove = (memberId: string) => {
    Alert.alert(
      "Hapus Member",
      "Yakin ingin menghapus member ini dari workspace?",
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
              await removeMember(memberId);
            } catch (err) {
              Alert.alert(
                "Gagal",
                err instanceof Error ? err.message : "Gagal menghapus member.",
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />

        <Text style={styles.loadingText}>Memuat members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color="#EF4444" />

        <Text style={styles.errorTitle}>Gagal memuat members</Text>

        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Terjadi kesalahan."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workspace Members</Text>

          <Text style={styles.subtitle}>
            Kelola member dan invitation workspace.
          </Text>
        </View>

        <View style={styles.memberCount}>
          <Ionicons name="people-outline" size={17} color="#208AEF" />

          <Text style={styles.memberCountText}>{members.length}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Invite Member</Text>

      <MemberForm onSubmit={handleInvite} isSubmitting={isInviting} />

      <Text style={styles.sectionTitle}>Current Members</Text>

      {members.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={30} color="#94A3B8" />

          <Text style={styles.emptyTitle}>Belum ada member</Text>
        </View>
      ) : (
        members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onRemove={() => handleRemove(member.id)}
          />
        ))
      )}

      <Text style={styles.sectionTitle}>Pending Invitations</Text>

      {invitations.filter((invitation) => invitation.status === "pending")
        .length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-outline" size={30} color="#94A3B8" />

          <Text style={styles.emptyTitle}>Tidak ada invitation pending</Text>
        </View>
      ) : (
        invitations
          .filter((invitation) => invitation.status === "pending")
          .map((invitation) => (
            <View key={invitation.id} style={styles.invitationCard}>
              <View style={styles.invitationIcon}>
                <Ionicons name="mail-outline" size={21} color="#208AEF" />
              </View>

              <View style={styles.invitationContent}>
                <Text style={styles.invitationEmail}>
                  {invitation.invitee_email}
                </Text>

                <Text style={styles.invitationRole}>
                  {invitation.role} · Pending
                </Text>
              </View>
            </View>
          ))
      )}

      {isRemoving && (
        <View style={styles.removing}>
          <ActivityIndicator size="small" color="#208AEF" />

          <Text style={styles.removingText}>Menghapus member...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },

  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
  },

  memberCount: {
    minWidth: 42,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: "#E8F3FF",
  },

  memberCountText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#208AEF",
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    marginBottom: 4,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  invitationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  invitationIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#E8F3FF",
  },

  invitationContent: {
    flex: 1,
    marginLeft: 12,
  },

  invitationEmail: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  invitationRole: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    textTransform: "capitalize",
  },

  removing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  removingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#64748B",
  },
});
