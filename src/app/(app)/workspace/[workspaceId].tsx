import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS } from '@/constants/theme';
import { useWorkspace } from '@/features/workspace';
import { WorkspaceDetail } from '@/features/workspace/components/WorkspaceDetail';
import { supabase } from '@/lib/supabase/client';

export default function WorkspaceDetailScreen() {
  const router = useRouter();

  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  const { workspace, isLoading, error, removeWorkspace, leaveWorkspace } =
    useWorkspace(workspaceId);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

  const isOwner = Boolean(
    workspace && currentUserId && workspace.ownerId === currentUserId,
  );

  const handleDelete = () => {
    Alert.alert(
      'Hapus Workspace',
      `Apakah kamu yakin ingin menghapus "${workspace?.name}"?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWorkspace();
              router.replace('/(app)/(tabs)/workspace' as any);
            } catch (err) {
              Alert.alert(
                'Gagal',
                err instanceof Error
                  ? err.message
                  : 'Gagal menghapus workspace.',
              );
            }
          },
        },
      ],
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Keluar dari Workspace',
      `Apakah kamu yakin ingin keluar dari workspace "${workspace?.name}"?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveWorkspace();
              router.replace('/(app)/(tabs)/workspace' as any);
            } catch (err) {
              Alert.alert(
                'Gagal',
                err instanceof Error
                  ? err.message
                  : 'Gagal keluar dari workspace.',
              );
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push(`/(app)/workspace/${workspaceId}/settings` as any);
  };

  const handleTasks = () => {
    router.push(`/(app)/workspace/${workspaceId}/tasks` as any);
  };

  const handleSubjects = () => {
    router.push(`/(app)/workspace/${workspaceId}/subjects` as any);
  };

  const handleMembers = () => {
    router.push(`/(app)/workspace/${workspaceId}/members` as any);
  };

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="workspace" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Back chevron */}
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.goldText} />
          </Pressable>

          <WorkspaceDetail
            workspace={workspace}
            isLoading={isLoading}
            error={error}
            isOwner={isOwner}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLeave={handleLeave}
            onTasks={handleTasks}
            onSubjects={handleSubjects}
            onMembers={handleMembers}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  blackSheet: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: -8,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
