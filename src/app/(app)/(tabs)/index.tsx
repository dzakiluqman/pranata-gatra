import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppHeader from "../../../components/navigation/AppHeader";
import GlassCard from "../../../components/ui/GlassCard";
import { useTodaySchedules } from "../../../features/schedule";
import { supabase } from "../../../lib/supabase/client";

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
  if (!deadline) return "No deadline";

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "No deadline";

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
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", ".");

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${day}, ${time}`;
}

function formatScheduleTime(time: string | null) {
  if (!time) return "--.--";
  return time.slice(0, 5).replace(":", ".");
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
    .from("tasks")
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
    .order("deadline", { ascending: true, nullsFirst: false });

  if (tasksError) throw tasksError;

  const allTasks = (tasks ?? []) as Task[];
  const completedStatuses = ["completed", "done", "finished", "complete"];

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
    .from("workspaces")
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
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (ownedError) throw ownedError;

  const { data: memberships, error: membershipsError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  if (membershipsError) throw membershipsError;

  const memberWorkspaceIds =
    memberships?.map((membership) => membership.workspace_id) ?? [];

  let memberWorkspaces: Workspace[] = [];

  if (memberWorkspaceIds.length > 0) {
    const { data, error } = await supabase
      .from("workspaces")
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
      .in("id", memberWorkspaceIds)
      .order("created_at", { ascending: false });

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
  const workspaceIds = workspaces.map((workspace) => workspace.id);

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
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<
    string | undefined
  >(undefined);

  const { data: todaySchedules = [] } = useTodaySchedules(currentWorkspaceId);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User belum login.");

      const dashboardData = await fetchDashboardData(user.id);
      setData(dashboardData);

      // Set first workspace for schedules
      if (dashboardData.workspaces.length > 0) {
        setCurrentWorkspaceId(dashboardData.workspaces[0].id);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to load:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const progressPercentage =
    data.activeTasks + data.completedTasks > 0
      ? Math.min(
          100,
          (data.completedTasks / (data.activeTasks + data.completedTasks)) *
            100,
        )
      : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5F7F3" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#F5F7F3"
            />
          }
        >
          {error && (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#FF8A8A"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </GlassCard>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <GlassCard>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  <Text style={styles.boldText}>{data.activeTasks} </Text>Tasks
                  Active
                </Text>
                <Text style={styles.progressText}>
                  <Text style={styles.boldText}>{data.completedTasks} </Text>
                  Completed
                </Text>
                <Text style={styles.progressText}>
                  <Text style={styles.boldText}>{data.remainingTasks} </Text>
                  Tasks Remaining
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(progressPercentage, 8)}%` },
                  ]}
                />
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <GlassCard style={styles.taskListCard}>
              {data.upcomingTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={28}
                    color="#8E998F"
                  />
                  <Text style={styles.emptyTitle}>No upcoming tasks</Text>
                  <Text style={styles.emptySubtitle}>
                    You have no upcoming deadlines.
                  </Text>
                </View>
              ) : (
                data.upcomingTasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskLeft}>
                      <Ionicons
                        name="pin-outline"
                        size={16}
                        color="#E3E8E2"
                        style={styles.pinIcon}
                      />
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>
                    <Text style={styles.taskTime}>
                      {formatTaskDeadline(task.deadline)}
                    </Text>
                  </View>
                ))
              )}
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {todaySchedules.length === 0 ? (
              <GlassCard>
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={28} color="#8E998F" />
                  <Text style={styles.emptyTitle}>No schedule today</Text>
                  <Text style={styles.emptySubtitle}>
                    There are no subjects scheduled for today.
                  </Text>
                </View>
              </GlassCard>
            ) : (
              <View style={styles.scheduleContainer}>
                {todaySchedules.map((schedule) => (
                  <GlassCard key={schedule.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleTime}>
                        {formatScheduleRange(
                          schedule.startTime,
                          schedule.endTime,
                        )}
                      </Text>
                      <Text style={styles.scheduleTitle} numberOfLines={1}>
                        {schedule.subject?.name ?? "Subject"}
                      </Text>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workspace Overview</Text>
            {data.workspaces.length === 0 ? (
              <GlassCard>
                <View style={styles.emptyState}>
                  <Ionicons
                    name="folder-open-outline"
                    size={28}
                    color="#8E998F"
                  />
                  <Text style={styles.emptyTitle}>No workspaces yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create or join a workspace to get started.
                  </Text>
                </View>
              </GlassCard>
            ) : (
              <View style={styles.workspaceContainer}>
                {data.workspaces.slice(0, 4).map((workspace) => {
                  const taskCount = data.workspaceTaskCounts[workspace.id] ?? 0;
                  return (
                    <GlassCard key={workspace.id} style={styles.workspaceCard}>
                      <View>
                        <Text style={styles.workspaceTitle} numberOfLines={1}>
                          {workspace.name}
                        </Text>
                        <Text style={styles.workspaceSubtitle}>
                          You have {taskCount}{" "}
                          {taskCount === 1 ? "task" : "tasks"} today
                        </Text>
                      </View>

                      <View style={styles.workspaceFooter}>
                        <Text style={styles.workspaceType}>
                          {workspace.owner_id
                            ? "Personal Workspace"
                            : "Collaborative Workspace"}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color="#C4CCC3"
                        />
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#8E998F",
  },
  errorCard: {
    marginBottom: 20,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#FF8A8A",
  },
  progressTextContainer: {
    gap: 8,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 15,
    color: "#D4DDD3",
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  boldText: {
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: 15,
  },
  progressBarTrack: {
    height: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 2,
    justifyContent: "center",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 20,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  taskListCard: {
    gap: 18,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  taskLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pinIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: "#E3E8E2",
    fontWeight: "400",
  },
  taskTime: {
    fontSize: 13,
    color: "#A2AFA1",
  },
  scheduleContainer: {
    gap: 14,
  },
  scheduleCard: {
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleTime: {
    fontSize: 14,
    color: "#D4DDD3",
  },
  scheduleTitle: {
    fontSize: 14,
    color: "#E3E8E2",
    fontWeight: "400",
  },
  workspaceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  workspaceCard: {
    width: "48%",
    minHeight: 115,
    padding: 18,
    justifyContent: "space-between",
  },
  workspaceTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  workspaceSubtitle: {
    fontSize: 11,
    color: "#9EA89D",
  },
  workspaceFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  workspaceType: {
    fontSize: 10,
    color: "#C4CCC3",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F7F3",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#8E998F",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 40,
  },
});
