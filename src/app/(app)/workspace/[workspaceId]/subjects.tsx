import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useSubjectMutation, useSubjects } from '@/features/schedule';
import type { Subject } from '@/features/schedule';
import SubjectForm from '@/features/schedule/components/SubjectForm';

export default function SubjectsScreen() {
  const params = useLocalSearchParams<{
    workspaceId: string;
  }>();

  const workspaceId = Array.isArray(params.workspaceId)
    ? params.workspaceId[0]
    : params.workspaceId;

  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: subjects = [], isLoading, refetch } = useSubjects(workspaceId);
  const { deleteSubject } = useSubjectMutation();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleDeleteSubject = (subject: Subject) => {
    Alert.alert(
      'Hapus subject?',
      `Kamu yakin ingin menghapus "${subject.name}"? Schedule yang terkait juga akan dihapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(subject.id);
              await deleteSubject.mutateAsync(subject.id);
              refetch();
            } catch (err) {
              Alert.alert(
                'Gagal menghapus',
                err instanceof Error ? err.message : 'Subject tidak dapat dihapus.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const renderSubjectCard = ({ item }: { item: Subject }) => (
    <View style={styles.card}>
      <Pressable
        onPress={() =>
          router.push(`/(app)/workspace/${workspaceId}/subject/${item.id}` as any)
        }
        style={({ pressed }) => [
          styles.cardContent,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconBox}>
          <Ionicons name="book-outline" size={20} color={COLORS.goldText} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.lecturer && (
            <Text style={styles.subjectMeta} numberOfLines={1}>
              Dosen: {item.lecturer}
            </Text>
          )}
          {item.room && (
            <Text style={styles.subjectMeta} numberOfLines={1}>
              Ruang: {item.room}
            </Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => setEditingSubject(item)}
            hitSlop={6}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.goldText} />
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            disabled={deletingId === item.id}
            onPress={() => handleDeleteSubject(item)}
            hitSlop={6}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            )}
          </Pressable>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient */}
      <AppHeader />

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

          <Text style={styles.title}>Subjects</Text>

          <Pressable
            style={({ pressed }) => [
              styles.addButtonWrapper,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              setEditingSubject(null);
              setShowForm(true);
            }}
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

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat mata kuliah...</Text>
          </View>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            renderItem={renderSubjectCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primaryGold}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={40} color={COLORS.primaryGold} />
                <Text style={styles.emptyTitle}>Belum ada mata kuliah</Text>
                <Text style={styles.emptySubtitle}>
                  Tambahkan mata kuliah untuk workspace ini.
                </Text>
              </View>
            }
          />
        )}

        {/* Modal Form for Add/Edit Subject */}
        {(showForm || editingSubject) && (
          <SubjectForm
            visible={showForm || Boolean(editingSubject)}
            workspaceId={workspaceId!}
            subject={editingSubject ?? undefined}
            onClose={() => {
              setShowForm(false);
              setEditingSubject(null);
            }}
            onSuccess={() => {
              setShowForm(false);
              setEditingSubject(null);
              refetch();
            }}
          />
        )}
      </View>

      {/* Bottom Floating Navigation Bar */}
      <AppHeader showBottomBar activeTab="workspace" />
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
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
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
  listContent: {
    paddingBottom: 120,
    paddingTop: 4,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
  },
  subjectMeta: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
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
