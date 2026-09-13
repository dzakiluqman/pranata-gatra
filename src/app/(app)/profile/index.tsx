import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useSession } from '@/features/auth/hooks/useSession';
import { signOut } from '@/features/auth/services/authService';

export default function ProfileScreen() {
  const { user } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fullName =
    (user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'User') as string;
  const email = user?.email || '-';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah kamu yakin ingin keluar dari akun?', [
      {
        text: 'Batal',
        style: 'cancel',
      },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            const { error } = await signOut();
            if (error) {
              Alert.alert('Gagal keluar', error.message);
            }
          } catch (err) {
            Alert.alert(
              'Gagal keluar',
              err instanceof Error ? err.message : 'Terjadi kesalahan.',
            );
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="home" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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

          {/* Profile Hero */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={COLORS.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Ionicons name="person" size={36} color={COLORS.textDark} />
            </LinearGradient>

            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{email}</Text>

            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Member sejak {createdAt}</Text>
            </View>
          </View>

          {/* Account Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detail Akun</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="person-outline" size={18} color={COLORS.goldText} />
                  <Text style={styles.infoLabel}>Nama Lengkap</Text>
                </View>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.goldText} />
                  <Text style={styles.infoLabel}>Email</Text>
                </View>
                <Text style={styles.infoValue}>{email}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoLeft}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.goldText} />
                  <Text style={styles.infoLabel}>Terdaftar</Text>
                </View>
                <Text style={styles.infoValue}>{createdAt}</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
              isLoggingOut && styles.disabled,
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                <Text style={styles.logoutButtonText}>Keluar dari Akun</Text>
              </>
            )}
          </Pressable>
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
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: COLORS.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  memberBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.secondaryLightGold,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.goldText,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  logoutButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(229, 83, 83, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 83, 83, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
});
