import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWorkspace } from '@/features/workspace';
import { WorkspaceForm } from '@/features/workspace/components/WorkspaceForm';

export default function WorkspaceSettingsScreen() {
  const insets = useSafeAreaInsets();
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

  const handleSubmit = async (values: {
    name: string;
    description?: string;
  }) => {
    try {
      setIsSubmitting(true);

      await editWorkspace({
        name: values.name,
        description: values.description ?? null,
      });

      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A8D8A8" />
        </View>
      </View>
    );
  }

  if (error || !workspace) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0D1610", "#182A1C", "#060A08"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <Text style={styles.error}>
            {error?.message ?? 'Workspace tidak ditemukan.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#060A08"]}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#F5F7F3" />
        </Pressable>
        <Text style={styles.headerTitle}>Pengaturan Workspace</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>Ubah Workspace</Text>
        <Text style={styles.subtitle}>
          Ubah informasi dan deskripsi workspace kamu.
        </Text>

        <WorkspaceForm
          initialValues={{
            name: workspace.name,
            description: workspace.description ?? '',
          }}
          submitLabel="Simpan Perubahan"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A08',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F7F3',
  },
  spacer: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#8DB88D',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F7F3',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 13,
    lineHeight: 19,
    color: '#8E998F',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  error: {
    textAlign: 'center',
    color: '#FF8A8A',
  },
  pressed: {
    opacity: 0.7,
  },
});