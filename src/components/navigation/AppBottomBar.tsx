import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';

export type TabKey = 'home' | 'workspace' | 'schedule' | 'tasks';

type AppBottomBarProps = {
  activeTab?: TabKey;
  onTabPress?: (key: TabKey) => void;
};

const TABS: { key: TabKey; route: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  {
    key: 'home',
    route: '/(app)/(tabs)',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    key: 'workspace',
    route: '/(app)/(tabs)/workspace',
    icon: 'folder-outline',
    activeIcon: 'folder',
  },
  {
    key: 'schedule',
    route: '/(app)/(tabs)/schedule',
    icon: 'time-outline',
    activeIcon: 'time',
  },
  {
    key: 'tasks',
    route: '/(app)/(tabs)/tasks',
    icon: 'list-outline',
    activeIcon: 'list',
  },
];

export default function AppBottomBar({ activeTab: explicitActiveTab, onTabPress }: AppBottomBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Detect active tab from pathname if not explicitly passed
  let currentActiveTab: TabKey = explicitActiveTab || 'home';
  if (!explicitActiveTab) {
    if (pathname.includes('/workspace')) {
      currentActiveTab = 'workspace';
    } else if (pathname.includes('/schedule')) {
      currentActiveTab = 'schedule';
    } else if (pathname.includes('/task')) {
      currentActiveTab = 'tasks';
    } else {
      currentActiveTab = 'home';
    }
  }

  const handlePress = (tab: typeof TABS[number]) => {
    if (onTabPress) {
      onTabPress(tab.key);
    } else {
      router.push(tab.route as any);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom + 8, 16),
        },
      ]}
    >
      <View style={styles.dock}>
        {TABS.map((tab) => {
          const isActive = currentActiveTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handlePress(tab)}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              {isActive ? (
                <LinearGradient
                  colors={COLORS.goldGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeCircle}
                >
                  <Ionicons name={tab.activeIcon} size={25} color={COLORS.textDark} />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveCircle}>
                  <Ionicons name={tab.icon} size={25} color={COLORS.secondaryLightGold} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  dock: {
    width: '100%',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderRadius: 40,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#2A2A30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
