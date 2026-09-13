import { Tabs } from 'expo-router';
import React from 'react';

import AppBottomBar, { TabKey } from './AppBottomBar';

type GlassTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

const ROUTE_NAME_MAP: Record<string, TabKey> = {
  index: 'home',
  workspace: 'workspace',
  schedule: 'schedule',
  tasks: 'tasks',
};

export default function GlassTabBar({ state, navigation }: GlassTabBarProps) {
  const currentRouteName = state.routes[state.index]?.name || 'index';
  const activeTab = ROUTE_NAME_MAP[currentRouteName] || 'home';

  const handleTabPress = (key: TabKey) => {
    const targetRoute = Object.entries(ROUTE_NAME_MAP).find(([, v]) => v === key)?.[0];
    if (targetRoute) {
      navigation.navigate(targetRoute);
    }
  };

  return (
    <AppBottomBar
      activeTab={activeTab}
      onTabPress={handleTabPress}
    />
  );
}
