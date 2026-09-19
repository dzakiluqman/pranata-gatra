import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useTodaySchedules } from '@/features/schedule';
import { supabase } from '@/lib/supabase/client';

type Task = {
  id: string;
  workspace_id: string;
  subject_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceTaskCount = {
  [workspaceId: string]: number;
};

type DashboardData = {
  activeTasks: number;
  completedTasks: number;
  remainingTasks: number;
  upcomingTasks: Task[];
  workspaces: Workspace[];
  workspaceTaskCounts: WorkspaceTaskCount;
};

const INITIAL_DATA: DashboardData = {
  activeTasks: 0,
  completedTasks: 0,
  remainingTasks: 0,
  upcomingTasks: [],
  workspaces: [],
  workspaceTaskCounts: {},
};

function formatTaskDeadline(deadline: string | null) {
  if (!deadline) return 'No deadline';

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return 'No deadline';

  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const time = date
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', '.');

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  const day = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${day}, ${time}`;
}

function formatScheduleTime(time: string | null) {
  if (!time) return '--.--';
  return time.slice(0, 5).replace(':', '.');
}

function formatScheduleRange(startTime: string | null, endTime: string | null) {
  return `${formatScheduleTime(startTime)} - ${formatScheduleTime(endTime)}`;
}

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const today = new Date();

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(
      `
        id,
        workspace_id,
        subject_id,
        assigned_to,
        title,
        description,
        status,
        deadline,
        completed_at,
        created_at,
        updated_at
      `,
    )
    .or(`assigned_to.eq.${userId},assigned_to.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false });

  if (tasksError) throw tasksError;

  const allTasks = (tasks ?? []) as Task[];
  const completedStatuses = ['completed', 'done', 'finished', 'complete'];

  const activeTasks = allTasks.filter(
    (task) => !completedStatuses.includes(task.status.toLowerCase()),
  );

  const completedToday = allTasks.filter((task) => {
    if (!task.completed_at) return false;
    const completedAt = new Date(task.completed_at);
    return completedAt >= startOfToday && completedAt <= endOfToday;
  });

  const remainingTasks = activeTasks.filter((task) => {
    if (!task.deadline) return true;
    return new Date(task.deadline) >= today;
  });

  const upcomingTasks = activeTasks
    .filter((task) => {
      if (!task.deadline) return false;
      return new Date(task.deadline) >= today;
    })
    .slice(0, 5);

  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from('workspaces')
    .select(
      `
        id,
        owner_id,
        name,
        description,
        deadline,
        created_at,
        updated_at
      `,
    )
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (ownedError) throw ownedError;

  const { data: memberships, error: membershipsError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId);

  if (membershipsError) throw membershipsError;

  const memberWorkspaceIds =
    memberships?.map((membership) => membership.workspace_id) ?? [];

  let memberWorkspaces: Workspace[] = [];

  if (memberWorkspaceIds.length > 0) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(
        `
          id,
          owner_id,
          name,
          description,
          deadline,
          created_at,
          updated_at
        `,
      )
      .in('id', memberWorkspaceIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    memberWorkspaces = (data ?? []) as Workspace[];
  }

  const workspaceMap = new Map<string, Workspace>();
  [...((ownedWorkspaces ?? []) as Workspace[]), ...memberWorkspaces].forEach(
    (workspace) => {
      workspaceMap.set(workspace.id, workspace);
    },
  );

  const workspaces = Array.from(workspaceMap.values());

  const workspaceTaskCounts: WorkspaceTaskCount = {};
  workspaces.forEach((workspace) => {
    workspaceTaskCounts[workspace.id] = activeTasks.filter(
      (task) => task.workspace_id === workspace.id,
    ).length;
  });

  return {
    activeTasks: activeTasks.length,
    completedTasks: completedToday.length,
    remainingTasks: remainingTasks.length,
    upcomingTasks,
    workspaces,
    workspaceTaskCounts,
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: todaySchedules = [], refetch: refetchTodaySchedules } =
    useTodaySchedules();

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User belum login.');

      const dashboardData = await fetchDashboardData(user.id);
      setData(dashboardData);
      refetchTodaySchedules();
    } catch (err) {
      console.error('[Dashboard] Failed to load:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refetchTodaySchedules]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const totalTasks = data.activeTasks + data.completedTasks;
  const progressPercentage =
    totalTasks > 0
      ? Math.min(100, Math.round((data.completedTasks / totalTasks) * 100))
      : 0;

  return (
    <View style={styles.container}>
      {/* Scrollable container with top gradient and black curved sheet */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primaryGold}
          />
        }
      >
        {/* Top Section: AppHeader with Today's Progress on Gold Gradient */}
        <AppHeader
          headerBottomContent={
            <View style={styles.progressSection}>
              <Text style={styles.progressHeading}>Today’s Progress</Text>

              {/* 3 Metric Cards */}
              <View style={styles.cardsRow}>
                {/* Active Tasks */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricNumber}>{data.activeTasks}</Text>
                  <Text style={styles.metricLabel}>{'Tasks\nActive'}</Text>
                </View>

                {/* Completed Tasks */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricNumber}>{data.completedTasks}</Text>
                  <Text style={styles.metricLabel}>{'Tasks\nCompleted'}</Text>
                </View>

                {/* Remaining Tasks */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricNumber}>{data.remainingTasks}</Text>
                  <Text style={styles.metricLabel}>{'Tasks\nRemaining'}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={COLORS.goldGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(progressPercentage > 0 ? progressPercentage : 15, 0)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          }
        />

        {/* Black Curved Sheet */}
        <View style={styles.blackSheet}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryGold} />
              <Text style={styles.loadingText}>Memuat dashboard...</Text>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              {/* Section 1: Upcoming Tasks */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Tasks</Text>

                <View style={styles.tasksContainer}>
                  {data.upcomingTasks.length === 0 ? (
                    <View style={styles.emptyTaskRow}>
                      <Ionicons name="checkmark-done-outline" size={20} color={COLORS.primaryGold} />
                      <Text style={styles.emptyText}>Tidak ada tugas mendatang</Text>
                    </View>
                  ) : (
                    data.upcomingTasks.map((task) => (
                      <Pressable
                        key={task.id}
                        style={({ pressed }) => [
                          styles.taskRow,
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/task/[taskId]',
                            params: { taskId: task.id },
                          })
                        }
                      >
                        <View style={styles.taskLeft}>
                          <Ionicons name="pin-outline" size={18} color={COLORS.secondaryLightGold} />
                          <Text style={styles.taskTitle} numberOfLines={1}>
                            {task.title}
                          </Text>
                        </View>
                        <Text style={styles.taskDeadline}>
                          {formatTaskDeadline(task.deadline)}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>

              {/* Section 2: Today's Schedule */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today’s Schedule</Text>

                {todaySchedules.length === 0 ? (
                  <View style={styles.schedulePill}>
                    <Text style={styles.emptyText}>Tidak ada jadwal kelas untuk hari ini</Text>
                  </View>
                ) : (
                  todaySchedules.map((schedule) => (
                    <View key={schedule.id} style={styles.schedulePill}>
                      <Text style={styles.scheduleTime}>
                        {formatScheduleRange(schedule.startTime, schedule.endTime)}
                      </Text>
                      <Text style={styles.scheduleSubject} numberOfLines={1}>
                        {schedule.subject?.name || 'Kuliah'}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Section 3: Workspace Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workspace Overview</Text>

                <View style={styles.workspaceGrid}>
                  {data.workspaces.slice(0, 4).map((workspace) => {
                    const taskCount = data.workspaceTaskCounts[workspace.id] ?? 0;
                    return (
                      <Pressable
                        key={workspace.id}
                        style={({ pressed }) => [
                          styles.workspaceCard,
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          router.push(`/(app)/workspace/${workspace.id}` as any)
                        }
                      >
                        <View>
                          <Text style={styles.workspaceName} numberOfLines={1}>
                            {workspace.name}
                          </Text>
                          <Text style={styles.workspaceTaskSubtitle}>
                            {taskCount > 0
                              ? `You have ${taskCount} tasks today`
                              : 'Tidak ada tugas aktif'}
                          </Text>
                        </View>

                        <View style={styles.workspaceFooter}>
                          <Text style={styles.workspaceFooterText}>
                            {workspace.description?.toLowerCase().includes('collaborative')
                              ? 'Collaborative Workspace'
                              : 'Personal Workspace'}
                          </Text>
                          <Ionicons name="arrow-forward" size={13} color="#8E8E93" />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
    backgroundColor: COLORS.bgBlack,
  },
  topGradientContainer: {
    width: '100%',
    paddingBottom: 24,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  progressHeading: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textDark,
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161618',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  metricNumber: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.secondaryLightGold,
  },
  metricLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.textLight,
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#161618',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.goldText,
    marginBottom: 12,
  },
  tasksContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taskTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textLight,
    flex: 1,
  },
  taskDeadline: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 10,
  },
  emptyTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  schedulePill: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTime: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textLight,
  },
  scheduleSubject: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  workspaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workspaceCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  workspaceName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
  },
  workspaceTaskSubtitle: {
    marginTop: 6,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textMuted,
  },
  workspaceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  workspaceFooterText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
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
  pressed: {
    opacity: 0.75,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 83, 83, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 83, 83, 0.3)',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.danger,
  },
});
