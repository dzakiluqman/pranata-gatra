import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GlassCard from "../../../components/ui/GlassCard";
import { useSession } from "../../../features/auth/hooks/useSession";
import { signOut } from "../../../features/auth/services/authService";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fullName =
    (user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "User") as string;
  const email = user?.email || "-";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const handleLogout = () => {
    Alert.alert("Konfirmasi Keluar", "Apakah kamu yakin ingin keluar dari akun?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            const { error } = await signOut();
            if (error) {
              Alert.alert("Gagal keluar", error.message);
            }
          } catch (err) {
            Alert.alert(
              "Gagal keluar",
              err instanceof Error ? err.message : "Terjadi kesalahan.",
            );
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#0D1610", "#182A1C", "#09100C", "#142519", "#060A08"]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        start={{ x: -0.5, y: 0 }}
        end={{ x: 1.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#F5F7F3" />
        </Pressable>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#55466E", "#342845"]}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={44} color="#E6ECE6" />
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <GlassCard style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="person-outline" size={18} color="#A8D8A8" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Nama Lengkap</Text>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="mail-outline" size={18} color="#A8D8A8" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="calendar-outline" size={18} color="#A8D8A8" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Terdaftar Sejak</Text>
                <Text style={styles.infoValue}>{createdAt}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aksi Akun</Text>
          <GlassCard style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}
              onPress={() => router.push("/(app)/(tabs)/notifications")}
            >
              <View style={styles.actionLeft}>
                <View style={styles.actionIconWrapper}>
                  <Ionicons name="notifications-outline" size={18} color="#A8D8A8" />
                </View>
                <Text style={styles.actionText}>Notifikasi & Undangan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#7E8980" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIconWrapper, styles.logoutIconBg]}>
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#FF8A8A" />
                  ) : (
                    <Ionicons name="log-out-outline" size={18} color="#FF8A8A" />
                  )}
                </View>
                <Text style={[styles.actionText, styles.logoutText]}>
                  {isLoggingOut ? "Sedang keluar..." : "Keluar dari Akun"}
                </Text>
              </View>
              {!isLoggingOut && (
                <Ionicons name="chevron-forward" size={18} color="#7E8980" />
              )}
            </Pressable>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060A08",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F7F3",
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  profileHero: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 16,
  },
  avatarGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5F7F3",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#8E998F",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DCE3DC",
    marginBottom: 12,
  },
  card: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(168, 216, 168, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#7E8980",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F7F3",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  menuAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(168, 216, 168, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  logoutIconBg: {
    backgroundColor: "rgba(255, 138, 138, 0.1)",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F5F7F3",
  },
  logoutText: {
    color: "#FF8A8A",
  },
  pressed: {
    opacity: 0.7,
  },
});
