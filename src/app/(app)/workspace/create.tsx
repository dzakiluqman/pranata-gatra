import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
} from 'react-native';

import {
    useWorkspaces,
} from '@/features/workspace';

import {
    WorkspaceForm,
} from '@/features/workspace/components/WorkspaceForm';

export default function CreateWorkspaceScreen() {
  const router = useRouter();

  const {
    addWorkspace,
  } = useWorkspaces();

  const handleSubmit = async (values: {
    name: string;
    description?: string;
  }) => {
    const workspace = await addWorkspace(values);

    router.replace({
      pathname: '/(app)/workspace/[workspaceId]',
      params: {
        workspaceId: workspace.id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Buat Workspace
        </Text>

        <Text style={styles.subtitle}>
          Workspace dapat digunakan untuk akademik,
          project pribadi, maupun project bersama.
        </Text>

        <WorkspaceForm
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
    lineHeight: 21,
    color: '#6B7280',
  },
});