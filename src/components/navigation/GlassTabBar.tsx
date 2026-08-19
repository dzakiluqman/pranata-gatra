import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GlassTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const TAB_CONFIG = {
  index: {
    label: "Dashboard",
    icon: "home-outline" as const,
    activeIcon: "home" as const,
  },
  workspace: {
    label: "Workspace",
    icon: "folder-outline" as const,
    activeIcon: "folder" as const,
  },
  schedule: {
    label: "Schedule",
    icon: "calendar-outline" as const,
    activeIcon: "calendar" as const,
  },
  tasks: {
    label: "Tasks",
    icon: "checkmark-circle-outline" as const,
    activeIcon: "checkmark-circle" as const,
  },
} as const;

export default function GlassTabBar({
  state,
  navigation,
  descriptors,
}: GlassTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];

          if (!config) {
            return null;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const label =
            descriptors[route.key]?.options.tabBarLabel ?? config.label;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                typeof label === "string" ? label : config.label
              }
              testID={descriptors[route.key]?.options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={isFocused ? config.activeIcon : config.icon}
                  size={25}
                  color={isFocused ? "#263B2A" : "#F4F5F2"}
                />
              </View>

              {isFocused && (
                <Text style={styles.activeLabel}>{config.label}</Text>
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
    position: "absolute",

    left: 24,
    right: 24,

    // bottom diberikan secara dinamis
    // berdasarkan safe-area inset.

    zIndex: 100,
  },

  tabBar: {
    height: 76,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 8,

    borderRadius: 40,

    backgroundColor: "rgba(42, 48, 43, 0.72)",

    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.25,
    shadowRadius: 18,

    elevation: 10,
  },

  tabButton: {
    flex: 1,
    height: "100%",

    alignItems: "center",
    justifyContent: "center",

    gap: 4,
  },

  iconContainer: {
    width: 56,
    height: 56,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 28,

    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },

  activeIconContainer: {
    backgroundColor: "#F7FAF5",

    borderColor: "#F7FAF5",

    shadowColor: "#FFFFFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.45,
    shadowRadius: 10,

    elevation: 5,
  },

  activeLabel: {
    position: "absolute",

    bottom: 3,

    fontSize: 8,
    fontWeight: "600",

    color: "#F7FAF5",
  },
});
