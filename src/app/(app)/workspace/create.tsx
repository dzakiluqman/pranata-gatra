import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useWorkspaces } from '@/features/workspace';
import {
  CreateWorkspaceFormData,
  WorkspaceForm,
} from '@/features/workspace/components/WorkspaceForm';
import { workspaceMemberService } from '@/features/workspace/services/workspaceMemberService';

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const { addWorkspace } = useWorkspaces();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: CreateWorkspaceFormData) => {
    try {
      setIsSubmitting(true);

      const workspace = await addWorkspace({
        name: values.name,
        description: values.description
          ? `${values.description} • ${values.type === 'collaborative' ? 'Collaborative Workspace' : 'Personal Workspace'}`
          : values.type === 'collaborative'
            ? 'Collaborative Workspace'
            : 'Personal Workspace',
      });

      // If collaborative and members were specified, invite them
      if (values.type === 'collaborative' && values.members.length > 0) {
        await Promise.allSettled(
          values.members.map((email) =>
            workspaceMemberService.createInvitation({
              workspaceId: workspace.id,
              inviteeEmail: email,
            }),
          ),
        );
      }

      router.replace(`/(app)/workspace/${workspace.id}` as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="workspace" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
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

          {/* Heading */}
          <Text style={styles.title}>Create Workspace</Text>
          <Text style={styles.subtitle}>
            Workspace can used for academics, personal projects, even collaborative projects purpose.
          </Text>

          {/* Form */}
          <WorkspaceForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </ScrollView>
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
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#8E8E93',
    marginBottom: 24,
  },
  pressed: {
    opacity: 0.7,
  },
});