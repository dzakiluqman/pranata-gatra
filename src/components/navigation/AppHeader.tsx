import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { signOut } from "@/features/auth/services/authService";

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      const { error } = await signOut();

      if (error) {
        console.error("Logout failed:", error);
        return;
      }

      setMenuVisible(false);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfile = () => {
    setMenuVisible(false);
    router.push("/(app)/profile");
  };

  const handleNotifications = () => {
    router.push("/(app)/(tabs)/notifications");
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={23} color="#D4C8E3" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.welcome}>
                Welcome, <Text style={styles.name}>First Name</Text>
              </Text>

              <Text style={styles.subtitle}>Let’s Get Things Done!</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
              hitSlop={10}
              onPress={handleNotifications}
            >
              <Ionicons
                name="notifications-outline"
                size={30}
                color="#F5F7F3"
              />

              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.pressed,
              ]}
              hitSlop={10}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu-outline" size={34} color="#F5F7F3" />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) {
            setMenuVisible(false);
          }
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!isLoggingOut) {
              setMenuVisible(false);
            }
          }}
        >
          <Pressable
            style={[
              styles.menuContainer,
              {
                top: insets.top + 72,
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Ionicons name="person" size={20} color="#D4C8E3" />
              </View>

              <View style={styles.menuHeaderText}>
                <Text style={styles.menuTitle}>Account</Text>

                <Text style={styles.menuSubtitle}>Kelola akun kamu</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <Pressable
              disabled={isLoggingOut}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={handleProfile}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="person-outline" size={21} color="#D4C8E3" />
              </View>

              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Profile</Text>

                <Text style={styles.menuItemDescription}>
                  Lihat profil akun
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={19} color="#777C77" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <View style={styles.logoutIcon}>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#E85D5D" />
                ) : (
                  <Ionicons name="log-out-outline" size={21} color="#E85D5D" />
                )}
              </View>

              <View style={styles.menuItemContent}>
                <Text style={styles.logoutTitle}>
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Text>

                <Text style={styles.menuItemDescription}>Keluar dari akun</Text>
              </View>

              {!isLoggingOut && (
                <Ionicons name="chevron-forward" size={19} color="#777C77" />
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 24,
    backgroundColor: "#0A0E0A",
  },

  content: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#493C59",
    borderWidth: 1,
    borderColor: "#9A82B8",
  },

  textContainer: {
    marginLeft: 14,
  },

  welcome: {
    fontSize: 17,
    lineHeight: 21,
    color: "#F5F7F3",
    fontWeight: "400",
  },

  name: {
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(245, 247, 243, 0.65)",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E85D5D",
  },

  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  menuContainer: {
    position: "absolute",
    right: 18,
    width: 285,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  menuAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#493C59",
    borderWidth: 1,
    borderColor: "#9A82B8",
  },

  menuHeaderText: {
    marginLeft: 12,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  menuSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(245, 247, 243, 0.55)",
  },

  menuDivider: {
    height: 1,
    marginHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 66,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    borderRadius: 14,
  },

  menuItemPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(154, 130, 184, 0.12)",
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232, 93, 93, 0.1)",
  },

  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },

  menuItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5F7F3",
  },

  logoutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E85D5D",
  },

  menuItemDescription: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(245, 247, 243, 0.5)",
  },

  pressed: {
    opacity: 0.7,
  },
});
