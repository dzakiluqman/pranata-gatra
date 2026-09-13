import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
  TaskFilter,
  type TaskFilters,
  useTasks,
  useUpdateTaskStatus,
} from '@/features/task';

export default function TasksScreen() {
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    deadline: 'all',
    search: '',
  });

  const tasksQuery = useTasks(filters);
  const updateStatusMutation = useUpdateTaskStatus();

  const filteredTasks = useMemo(() => {
    const list = tasksQuery.data ?? [];
    const search = filters.search?.trim().toLowerCase();

    if (!search) {
      return list;
    }

    return list.filter((task) => {
      return (
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.workspace?.name.toLowerCase().includes(search) ||
        task.subject?.name.toLowerCase().includes(search)
      );
    });
  }, [tasksQuery.data, filters.search]);

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

  const handleCreateTask = () => {
    router.push('/(app)/task/create' as any);
  };

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient */}
      <AppHeader />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {/* Title and Add Button */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
              Kelola semua tugas kamu dalam satu tempat
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButtonWrapper,
              pressed && styles.pressed,
            ]}
            onPress={handleCreateTask}
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

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.goldText} />
          <TextInput
            value={filters.search ?? ''}
            onChangeText={(search) =>
              setFilters((current) => ({
                ...current,
                search,
              }))
            }
            placeholder="Cari tugas..."
            placeholderTextColor="#666666"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!filters.search && (
            <Pressable
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  search: '',
                }))
              }
            >
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <TaskFilter filters={filters} onChange={setFilters} />

        {/* Task List */}
        {tasksQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat tugas...</Text>
          </View>
        ) : tasksQuery.error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />
            <Text style={styles.errorTitle}>Gagal memuat tugas</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => tasksQuery.refetch()}
            >
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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
                  name="checkmark-done-outline"
                  size={42}
                  color={COLORS.primaryGold}
                />
                <Text style={styles.emptyTitle}>Belum ada tugas</Text>
                <Text style={styles.emptySubtitle}>
                  Buat tugas baru untuk mulai mengatur pekerjaanmu.
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
    paddingTop: 20,
    marginTop: -8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.goldText,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  addButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
  },
  listContent: {
    paddingBottom: 120,
    paddingTop: 8,
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
  errorTitle: {
    marginTop: 10,
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.danger,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  retryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.goldText,
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
    opacity: 0.8,
  },
});
