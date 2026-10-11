import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
      {/* Outer shadow container to preserve drop shadow while BlurView clips content */}
      <View style={styles.dockShadow}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 85}
          tint="dark"
          style={styles.dockBlur}
        >
          {/* Subtle liquid glass specular highlight shine */}
          <LinearGradient
            colors={[
              'rgba(255, 232, 179, 0.16)',
              'rgba(255, 255, 255, 0.03)',
              'rgba(18, 18, 22, 0.35)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.dockInner}>
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
                      <Ionicons name={tab.icon} size={24} color={COLORS.secondaryLightGold} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </BlurView>
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
  dockShadow: {
    width: '100%',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  dockBlur: {
    width: '100%',
    height: 72,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(14, 14, 18, 0.65)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 232, 179, 0.28)',
  },
  dockInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
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
    shadowColor: '#FFE8B3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  inactiveCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(179, 141, 70, 0.3)',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

