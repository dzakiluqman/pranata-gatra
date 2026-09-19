import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useQuery } from '@tanstack/react-query';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import {
  isScheduleOnDate,
  type Schedule,
} from '@/features/schedule';
import { supabase } from '@/lib/supabase/client';

function parseDateTime(date: string, time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const result = new Date(`${date}T00:00:00`);
  result.setHours(hours || 0, minutes || 0, 0, 0);
  return result;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(time: string | null) {
  if (!time) return '--.--';
  return time.slice(0, 5).replace(':', '.');
}

export default function ScheduleScreen() {
  const {
    data: schedules = [],
    isLoading: loading,
    isRefetching: refreshing,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['schedules', 'all-user'],
    queryFn: async (): Promise<Schedule[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User belum login.');

      const { data: memberships, error: membershipsError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      const workspaceIds = Array.from(
        new Set([
          ...(memberships ?? []).map((item) => item.workspace_id),
          ...(ownedWorkspaces ?? []).map((item) => item.id),
        ]),
      );

      if (workspaceIds.length === 0) {
        return [];
      }

      const { data, error: schedulesError } = await supabase
        .from('subject_schedules')
        .select(
          `
          id,
          subject_id,
          workspace_id,
          start_date,
          start_time,
          end_time,
          recurrence_enabled,
          recurrence_interval,
          recurrence_unit,
          recurrence_end_date,
          reminder_enabled,
          reminder_minutes,
          created_at,
          updated_at,
          subject:subjects!inner (
            id,
            name,
            lecturer,
            room
          )
        `,
        )
        .in('workspace_id', workspaceIds)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (schedulesError) throw schedulesError;

      return (data ?? []).map((item: any) => ({
        id: item.id,
        subjectId: item.subject_id,
        workspaceId: item.workspace_id,
        occurrenceDate: item.start_date,
        startDate: item.start_date,
        startTime: item.start_time,
        endTime: item.end_time,
        recurrenceEnabled: item.recurrence_enabled,
        recurrenceInterval: item.recurrence_interval,
        recurrenceUnit: item.recurrence_unit,
        recurrenceEndDate: item.recurrence_end_date,
        reminderEnabled: item.reminder_enabled,
        reminderMinutes: item.reminder_minutes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        subject: item.subject
          ? {
              id: item.subject.id,
              name: item.subject.name,
              lecturer: item.subject.lecturer,
              room: item.subject.room,
            }
          : undefined,
      }));
    },
  });

  const error = queryError instanceof Error ? queryError.message : null;

  const loadSchedules = useCallback(() => {
    refetch();
  }, [refetch]);


  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules]),
  );

  const upcomingSchedules = useMemo(() => {
    const today = new Date();
    const result: {
      schedule: Schedule;
      date: Date;
    }[] = [];

    for (let offset = 0; offset < 30; offset++) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + offset);

      schedules.forEach((schedule) => {
        if (isScheduleOnDate(schedule, date)) {
          result.push({
            schedule,
            date,
          });
        }
      });
    }

    result.sort((a, b) => {
      const aDateStr = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}-${String(a.date.getDate()).padStart(2, '0')}`;
      const bDateStr = `${b.date.getFullYear()}-${String(b.date.getMonth() + 1).padStart(2, '0')}-${String(b.date.getDate()).padStart(2, '0')}`;

      const first = parseDateTime(
        aDateStr,
        a.schedule.startTime,
      );

      const second = parseDateTime(
        bDateStr,
        b.schedule.startTime,
      );

      return first.getTime() - second.getTime();
    });

    return result.slice(0, 50);
  }, [schedules]);

  const handleRefresh = useCallback(() => {
    loadSchedules();
  }, [loadSchedules]);

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient */}
      <AppHeader />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat jadwal...</Text>
          </View>
        ) : (
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
            <Text style={styles.title}>Schedule</Text>
            <Text style={styles.subtitle}>
              Semua jadwal perkuliahan dan agenda kegiatan.
            </Text>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {upcomingSchedules.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={36} color={COLORS.primaryGold} />
                <Text style={styles.emptyTitle}>Belum ada jadwal</Text>
                <Text style={styles.emptySubtitle}>
                  Jadwal mata kuliah yang dibuat di workspace akan muncul di sini.
                </Text>
              </View>
            ) : (
              upcomingSchedules.map(({ schedule, date }, index) => {
                const dateKey = formatDate(date);
                const prevDateKey =
                  index > 0
                    ? formatDate(upcomingSchedules[index - 1].date)
                    : null;
                const showDateHeader = dateKey !== prevDateKey;

                return (
                  <View key={`${schedule.id}-${date.toISOString()}`}>
                    {showDateHeader && (
                      <Text style={styles.dateHeader}>{dateKey}</Text>
                    )}

                    <View style={styles.schedulePill}>
                      <View style={styles.timeSection}>
                        <Text style={styles.scheduleTime}>
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </Text>
                        {schedule.subject?.room && (
                          <Text style={styles.scheduleRoom}>
                            Ruang {schedule.subject.room}
                          </Text>
                        )}
                      </View>

                      <View style={styles.subjectSection}>
                        <Text style={styles.scheduleSubject} numberOfLines={1}>
                          {schedule.subject?.name || 'Mata Kuliah'}
                        </Text>
                        {schedule.subject?.lecturer && (
                          <Text style={styles.scheduleLecturer} numberOfLines={1}>
                            {schedule.subject.lecturer}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
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
    paddingTop: 24,
    marginTop: -8,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.goldText,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  dateHeader: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.goldAccent,
    marginTop: 14,
    marginBottom: 8,
  },
  schedulePill: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSection: {
    flex: 1,
  },
  scheduleTime: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  scheduleRoom: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subjectSection: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  scheduleSubject: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  scheduleLecturer: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'right',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 83, 83, 0.1)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 83, 83, 0.25)',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
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
    lineHeight: 18,
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
});
