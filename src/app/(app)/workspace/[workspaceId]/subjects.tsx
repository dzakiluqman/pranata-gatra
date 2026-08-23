import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import GlassCard from "../../../../components/ui/GlassCard";
import { useSubjectMutation, useSubjects } from "../../../../features/schedule";

import type { Subject } from "../../../../features/schedule";

import SubjectForm from "../../../../features/schedule/components/SubjectForm";

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
  const { deleteSubject, isDeleting } = useSubjectMutation();

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
      "Hapus subject?",
      `Kamu yakin ingin menghapus "${subject.name}"? Schedule yang terkait juga akan dihapus.`,
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
              setDeletingId(subject.id);
              await deleteSubject(subject.id);
              Alert.alert("Berhasil", "Subject berhasil dihapus.");
            } catch (error) {
              Alert.alert(
                "Gagal",
                error instanceof Error
                  ? error.message
                  : "Subject gagal dihapus.",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <GlassCard style={styles.subjectCard}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/workspace/subject/[subjectId]",
            params: { subjectId: item.id, workspaceId: workspaceId },
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Text style={styles.subjectName} numberOfLines={2}>
              {item.name}
            </Text>

            {item.lecturer && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="person-outline"
                  size={12}
                  color="#7F8B80"
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.lecturer}
                </Text>
              </View>
            )}

            {item.room && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color="#7F8B80"
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.room}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setEditingSubject(item)}
            >
              <Ionicons name="create-outline" size={16} color="#B8C5B8" />
            </Pressable>

            <Pressable
              style={styles.actionButton}
              disabled={deletingId === item.id}
              onPress={() => handleDeleteSubject(item)}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color="#FF8A8A" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#FF8A8A" />
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </GlassCard>
  );

  if (!workspaceId) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F5F7F3" />
          </Pressable>
          <Text style={styles.title}>Subjects</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF8A8A" />
          <Text style={styles.errorText}>Workspace ID tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F5F7F3" />
        </Pressable>
        <Text style={styles.title}>Subjects</Text>

        <Pressable
          style={styles.addButton}
          onPress={() => {
            setEditingSubject(null);
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#F5F7F3" />
        </Pressable>
      </View>

      {showForm ? (
        <SubjectForm
          workspaceId={workspaceId}
          initial={editingSubject}
          onSuccess={() => {
            setShowForm(false);
            setEditingSubject(null);
            refetch();
          }}
        />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8D8A8" />
          <Text style={styles.loadingText}>Memuat subjects...</Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubject}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={32} color="#A8D8A8" />
              </View>
              <Text style={styles.emptyTitle}>Belum ada subject</Text>
              <Text style={styles.emptyText}>
                Buat subject pertama kamu untuk memulai.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#A8D8A8"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  spacer: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 12,
  },
  subjectCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardContent: {
    flex: 1,
    gap: 6,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaIcon: {
    marginTop: 1,
  },
  metaText: {
    fontSize: 11,
    color: "#7F8B80",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,216,168,0.08)",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F7F3",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: "#8E998F",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#FF8A8A",
    fontWeight: "600",
  },
});
