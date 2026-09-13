import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';

import { useWorkspaces } from '../hooks/useWorkspaces';
import type { Workspace } from '../types/workspace.types';

export default function WorkspaceScreen() {
  const { workspaces = [], isLoading, error, refetch } = useWorkspaces();

  // Separate active vs expired workspaces
  const { activeWorkspaces, expiredWorkspaces } = useMemo(() => {
    const now = new Date();
    const active: Workspace[] = [];
    const expired: Workspace[] = [];

    workspaces.forEach((w) => {
      if (w.deadline && new Date(w.deadline) < now) {
        expired.push(w);
      } else {
        active.push(w);
      }
    });

    return { activeWorkspaces: active, expiredWorkspaces: expired };
  }, [workspaces]);

  const handleOpenWorkspace = (workspaceId: string) => {
    router.push(`/(app)/workspace/${workspaceId}` as any);
  };

  const handleCreateWorkspace = () => {
    router.push('/(app)/workspace/create' as any);
  };

  const renderWorkspaceCard = (item: Workspace) => {
    const isCollaborative = item.description?.toLowerCase().includes('collaborative');

    return (
      <Pressable
        key={item.id}
        onPress={() => handleOpenWorkspace(item.id)}
        style={({ pressed }) => [
          styles.workspaceCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.cardTop}>
          <Text numberOfLines={1} style={styles.workspaceName}>
            {item.name}
          </Text>
          <Text numberOfLines={2} style={styles.workspaceDescription}>
            {item.description || 'Penjadwalan tugas dan kelas.'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.workspaceType}>
            {isCollaborative ? 'Collaborative Workspace' : 'Personal Workspace'}
          </Text>
          <Ionicons name="arrow-forward" size={13} color="#8E8E93" />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Gold Gradient */}
      <AppHeader />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat workspace...</Text>
          </View>
        ) : (
          <FlatList
            data={[]}
            renderItem={null}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={COLORS.primaryGold}
              />
            }
            ListHeaderComponent={
              <>
                {/* Active Workspaces Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Active Workspaces</Text>

                  {activeWorkspaces.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="folder-open-outline" size={28} color={COLORS.primaryGold} />
                      <Text style={styles.emptyText}>Belum ada workspace aktif</Text>
                    </View>
                  ) : (
                    <View style={styles.grid}>
                      {activeWorkspaces.map(renderWorkspaceCard)}
                    </View>
                  )}
                </View>

                {/* Expired Workspaces Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Expired Workspaces</Text>

                  {expiredWorkspaces.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptySubtext}>Tidak ada workspace yang kedaluwarsa</Text>
                    </View>
                  ) : (
                    <View style={styles.grid}>
                      {expiredWorkspaces.map(renderWorkspaceCard)}
                    </View>
                  )}
                </View>
              </>
            }
          />
        )}

        {/* Floating Action Button (+) */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={handleCreateWorkspace}
          hitSlop={10}
        >
          <LinearGradient
            colors={COLORS.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color={COLORS.textDark} />
          </LinearGradient>
        </Pressable>
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
    paddingTop: 24,
    marginTop: -8,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.goldText,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  workspaceCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  cardTop: {
    marginBottom: 12,
  },
  workspaceName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  workspaceDescription: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  workspaceType: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textLight,
  },
  emptySubtext: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 90,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  pressed: {
    opacity: 0.75,
  },
});
