import GlassTabBar from '@/components/navigation/GlassTabBar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                },
            }}
            tabBar={(props) => <GlassTabBar {...props} />}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                }}
            />

            <Tabs.Screen
                name="workspace"
                options={{
                    title: 'Workspace',
                }}
            />

            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Schedule',
                }}
            />

            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Tasks',
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
