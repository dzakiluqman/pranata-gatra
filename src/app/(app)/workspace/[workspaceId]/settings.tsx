import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useWorkspace } from '@/features/workspace';
import {
  CreateWorkspaceFormData,
  WorkspaceForm,
} from '@/features/workspace/components/WorkspaceForm';

export default function WorkspaceSettingsScreen() {
  const router = useRouter();

  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  const {
    workspace,
    isLoading,
    error,
    editWorkspace,
  } = useWorkspace(workspaceId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: CreateWorkspaceFormData) => {
    try {
      setIsSubmitting(true);

      await editWorkspace({
        name: values.name,
        description: values.description
          ? `${values.description} • ${values.type === 'collaborative' ? 'Collaborative Workspace' : 'Personal Workspace'}`
          : values.type === 'collaborative'
            ? 'Collaborative Workspace'
            : 'Personal Workspace',
      });

      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient */}
      <AppHeader />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primaryGold} />
            <Text style={styles.loadingText}>Memuat pengaturan...</Text>
          </View>
        ) : error || !workspace ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
            <Text style={styles.errorTitle}>Gagal memuat workspace</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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

            <Text style={styles.title}>Edit Workspace</Text>
            <Text style={styles.subtitle}>
              Perbarui rincian dan informasi workspace Anda.
            </Text>

            <WorkspaceForm
              initialValues={{
                name: workspace.name,
                description: workspace.description || '',
                type: workspace.description?.toLowerCase().includes('collaborative')
                  ? 'collaborative'
                  : 'personal',
              }}
              submitLabel="Simpan Perubahan"
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </ScrollView>
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
  scrollContent: {
    paddingBottom: 120,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
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
  pressed: {
    opacity: 0.7,
  },
});