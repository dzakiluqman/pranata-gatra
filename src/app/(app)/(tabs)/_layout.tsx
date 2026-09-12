import AppHeader from "@/components/navigation/AppHeader";
import GlassTabBar from "@/components/navigation/GlassTabBar";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
        }}
      />

      <Tabs.Screen
        name="workspace"
        options={{
          title: "Workspace",
          headerShown: true,
          header: () => <AppHeader />,
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
