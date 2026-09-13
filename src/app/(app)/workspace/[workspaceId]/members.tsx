import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { WorkspaceMembers } from '@/features/workspace/components/WorkspaceMembers';

export default function WorkspaceMembersPage() {
  const { workspaceId } = useLocalSearchParams<{
    workspaceId: string;
  }>();

  if (!workspaceId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header on Gold Gradient */}
      <AppHeader />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        {/* Back chevron + Title */}
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
          <Text style={styles.title}>Workspace Members</Text>
        </View>

        <View style={styles.content}>
          <WorkspaceMembers workspaceId={workspaceId} />
        </View>
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
    gap: 8,
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
  content: {
    flex: 1,
    paddingBottom: 110,
  },
  pressed: {
    opacity: 0.7,
  },
});
