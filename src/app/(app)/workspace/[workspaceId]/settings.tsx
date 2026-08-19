import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    useWorkspace,
} from '@/features/workspace';

import {
    WorkspaceForm,
} from '@/features/workspace/components/WorkspaceForm';

export default function WorkspaceSettingsScreen() {
  const router = useRouter();

  const { workspaceId } =
    useLocalSearchParams<{
      workspaceId: string;
    }>();

  const {
    workspace,
    isLoading,
    error,
    editWorkspace,
  } = useWorkspace(workspaceId);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async (values: {
    name: string;
    description?: string;
  }) => {
    try {
      setIsSubmitting(true);

      await editWorkspace({
        name: values.name,
        description:
          values.description ?? null,
      });

      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.error}>
            {error?.message ??
              'Workspace tidak ditemukan.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Pengaturan Workspace
        </Text>

        <Text style={styles.subtitle}>
          Ubah informasi workspace kamu.
        </Text>

        <WorkspaceForm
          initialValues={{
            name: workspace.name,
            description:
              workspace.description ?? '',
          }}
          submitLabel="Simpan Perubahan"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  error: {
    textAlign: 'center',
    color: '#DC2626',
  },
});