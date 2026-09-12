import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWorkspaces } from '@/features/workspace';
import { WorkspaceForm } from '@/features/workspace/components/WorkspaceForm';

export default function CreateWorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { addWorkspace } = useWorkspaces();

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
        <Text style={styles.headerTitle}>Buat Workspace</Text>
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
        <Text style={styles.eyebrow}>NEW WORKSPACE</Text>
        <Text style={styles.title}>Ruang Kerja Baru</Text>
        <Text style={styles.subtitle}>
          Workspace dapat digunakan untuk akademik, project pribadi, maupun project bersama.
        </Text>

        <WorkspaceForm onSubmit={handleSubmit} />
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
  pressed: {
    opacity: 0.7,
  },
});