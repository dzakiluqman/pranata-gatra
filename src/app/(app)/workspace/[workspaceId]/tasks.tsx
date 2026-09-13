import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import {
  TaskCard,
  useUpdateTaskStatus,
  useWorkspaceTasks,
} from '@/features/task';
import { useWorkspace } from '@/features/workspace/hooks/useWorkspace';

export default function WorkspaceTasksScreen() {
  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  const workspaceQuery = useWorkspace(workspaceId);
  const tasksQuery = useWorkspaceTasks(workspaceId);
  const updateStatusMutation = useUpdateTaskStatus();

  const [search, setSearch] = useState('');

  const tasks = tasksQuery.data ?? [];

  const filteredTasks = search.trim()
    ? tasks.filter((task) => {
        const query = search.trim().toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.subject?.name.toLowerCase().includes(query)
        );
      })
    : tasks;

  const workspace = workspaceQuery.workspace;

  const handleCreate = () => {
    router.push({
      pathname: '/(app)/task/create',
      params: {
        workspaceId,
      },
    } as any);
  };

  const handleStatusChange = async (
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed',
  ) => {
    await updateStatusMutation.mutateAsync({
      taskId,
      status,
    });
  };

  const handleTaskPress = (taskId: string) => {
    router.push({
      pathname: '/(app)/task/[taskId]',
      params: {
        taskId,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="workspace" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {/* Navigation row: Back + Title + Add Button */}
        <View style={styles.topRow}>
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

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {workspace?.name ? `${workspace.name} Tasks` : 'Workspace Tasks'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButtonWrapper,
              pressed && styles.pressed,
            ]}
            onPress={handleCreate}
            hitSlop={8}
          >
            <LinearGradient
              colors={COLORS.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={22} color={COLORS.textDark} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.goldText} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari tugas workspace..."
            placeholderTextColor="#666666"
            style={styles.searchInput}
          />
          {Boolean(search) && (
            <Pressable onPress={() => setSearch('')} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Task List */}
        {tasksQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat tugas...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={tasksQuery.isRefetching}
                onRefresh={() => tasksQuery.refetch()}
                tintColor={COLORS.primaryGold}
              />
            }
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onPress={() => handleTaskPress(item.id)}
                onStatusChange={() =>
                  handleStatusChange(
                    item.id,
                    item.status === 'completed' ? 'pending' : 'completed',
                  )
                }
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="checkbox-outline"
                  size={40}
                  color={COLORS.primaryGold}
                />
                <Text style={styles.emptyTitle}>Belum ada tugas</Text>
                <Text style={styles.emptySubtitle}>
                  Tambahkan tugas baru untuk workspace ini.
                </Text>
              </View>
            }
          />
        )}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.goldText,
  },
  addButtonWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
  },
  listContent: {
    paddingBottom: 120,
  },
  center: {
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
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textLight,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
