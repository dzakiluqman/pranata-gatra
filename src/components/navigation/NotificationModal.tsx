import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

type WorkspaceInvitation = {
  id: string;
  workspace_id: string;
  inviter_id: string;
  invitee_email: string;
  role: string;
  token: string;
  status: string;
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

type NotificationModalProps = {
  visible: boolean;
  onClose: () => void;
  onNotificationCountChange?: (count: number) => void;
};

export default function NotificationModal({
  visible,
  onClose,
  onNotificationCountChange,
}: NotificationModalProps) {
  const insets = useSafeAreaInsets();
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        setInvitations([]);
        onNotificationCountChange?.(0);
        return;
      }

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select(`
            id,
            workspace_id,
            inviter_id,
            invitee_email,
            role,
            token,
            status,
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
          `)
        .eq('invitee_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load notifications:', error);
        return;
      }

      const items = (data ?? []) as unknown as WorkspaceInvitation[];
      setInvitations(items);
      onNotificationCountChange?.(items.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);



  React.useEffect(() => {
    if (visible) {
      (async () => {
        await fetchInvitations();
      })();
    }
  }, [visible, fetchInvitations]);

  const handleAccept = async (invitation: WorkspaceInvitation) => {
    try {
      setActionLoadingId(invitation.id);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User tidak ditemukan');

      // Add to workspace members
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: invitation.role || 'member',
        });

      if (memberError && !memberError.message.includes('unique')) {
        throw memberError;
      }

      // Update invitation status
      await supabase
        .from('workspace_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      setInvitations((prev) => prev.filter((item) => item.id !== invitation.id));
      onNotificationCountChange?.(Math.max(0, invitations.length - 1));
      Alert.alert('Sukses', `Kamu telah bergabung dengan workspace "${invitation.workspace?.name || 'Workspace'}"!`);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menerima undangan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (invitation: WorkspaceInvitation) => {
    try {
      setActionLoadingId(invitation.id);
      await supabase
        .from('workspace_invitations')
        .update({
          status: 'rejected',
        })
        .eq('id', invitation.id);

      setInvitations((prev) => prev.filter((item) => item.id !== invitation.id));
      onNotificationCountChange?.(Math.max(0, invitations.length - 1));
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menolak undangan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            {
              marginTop: insets.top + 60,
              marginBottom: insets.bottom + 40,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="notifications" size={20} color={COLORS.primaryGold} />
              <Text style={styles.headerTitle}>Notifikasi</Text>
              {invitations.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{invitations.length}</Text>
                </View>
              )}
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={COLORS.textLight} />
            </Pressable>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={COLORS.primaryGold} />
              <Text style={styles.mutedText}>Memuat notifikasi...</Text>
            </View>
          ) : invitations.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={32} color={COLORS.primaryGold} />
              </View>
              <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
              <Text style={styles.emptySubtitle}>Semua pembaruan dan undangan akan muncul di sini.</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {invitations.map((inv) => {
                const isProcessing = actionLoadingId === inv.id;
                return (
                  <View key={inv.id} style={styles.invitationCard}>
                    <View style={styles.invitationHeader}>
                      <View style={styles.invitationIconCircle}>
                        <Ionicons name="mail-unread-outline" size={18} color={COLORS.primaryGold} />
                      </View>
                      <View style={styles.invitationInfo}>
                        <Text style={styles.invitationTitle}>Undangan Workspace</Text>
                        <Text style={styles.invitationDescription}>
                          <Text style={styles.boldText}>
                            {inv.inviter?.full_name || inv.inviter?.email || 'Seseorang'}
                          </Text>{' '}
                          mengundang Anda untuk bergabung ke{' '}
                          <Text style={styles.boldText}>{inv.workspace?.name || 'Workspace'}</Text>.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionsRow}>
                      <Pressable
                        style={[styles.declineButton, isProcessing && styles.disabled]}
                        onPress={() => handleDecline(inv)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.declineButtonText}>Tolak</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.acceptButtonWrapper, isProcessing && styles.disabled]}
                        onPress={() => handleAccept(inv)}
                        disabled={isProcessing}
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
                            <Text style={styles.acceptButtonText}>Terima</Text>
                          )}
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textLight,
  },
  countBadge: {
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.textDark,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  mutedText: {
    marginTop: 10,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  invitationCard: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  invitationHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  invitationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 4,
  },

  invitationDescription: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  boldText: {
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  acceptButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },
  disabled: {
    opacity: 0.5,
  },
});
