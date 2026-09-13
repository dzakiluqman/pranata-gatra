import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS } from '@/constants/theme';
import { useSession } from '@/features/auth/hooks/useSession';
import { signOut } from '@/features/auth/services/authService';
import { supabase } from '@/lib/supabase/client';

import { useNotificationModal } from '@/lib/notifications';

import AppBottomBar, { TabKey } from './AppBottomBar';

type AppHeaderProps = {
  headerBottomContent?: React.ReactNode;
  showBottomBar?: boolean;
  activeTab?: TabKey;
  bottomBarOnly?: boolean;
  children?: React.ReactNode;
};

export default function AppHeader({
  headerBottomContent,
  showBottomBar = false,
  activeTab,
  bottomBarOnly = false,
  children,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { openNotificationModal, unreadCount, setUnreadCount } =
    useNotificationModal();

  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fullName =
    (user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'User') as string;
  const firstName = fullName.split(' ')[0] || 'User';

  // Check pending invitations for badge
  useEffect(() => {
    async function checkNotifications() {
      if (!user?.email) return;
      try {
        const { count, error } = await supabase
          .from('workspace_invitations')
          .select('*', { count: 'exact', head: true })
          .eq('invitee_email', user.email)
          .eq('status', 'pending');

        if (!error && typeof count === 'number') {
          setUnreadCount(count);
        }
      } catch {
        // silent fallback
      }
    }
    checkNotifications();
  }, [user, setUnreadCount]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      const { error } = await signOut();
      if (error) {
        console.error('Logout failed:', error);
        return;
      }
      setMenuVisible(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfile = () => {
    setMenuVisible(false);
    router.push('/(app)/profile');
  };

  if (bottomBarOnly) {
    return <AppBottomBar activeTab={activeTab} />;
  }

  const headerNode = (
    <LinearGradient
      colors={COLORS.goldHeaderGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingTop: insets.top + 6,
        },
      ]}
    >
      <View style={styles.content}>
        {/* User Section (Avatar + Name) */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#4A3B18" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.welcome}>
              Welcome, <Text style={styles.name}>{firstName}</Text>
            </Text>
            <Text style={styles.subtitle}>Let’s Get Things Done!</Text>
          </View>
        </View>

        {/* Action Icons: Bell + Hamburger */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
            hitSlop={10}
            onPress={openNotificationModal}
          >
            <Ionicons
              name="notifications-outline"
              size={26}
              color={COLORS.textDark}
            />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.pressed,
            ]}
            hitSlop={10}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu-outline" size={30} color={COLORS.textDark} />
          </Pressable>
        </View>
      </View>

      {/* Optional Header Content (e.g. Today's Progress on Dashboard) */}
      {headerBottomContent && (
        <View style={styles.headerBottomContainer}>
          {headerBottomContent}
        </View>
      )}
    </LinearGradient>
  );

  const modalsNode = (
    <>
      {/* Profile / Menu Pop-up Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setMenuVisible(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!isLoggingOut) setMenuVisible(false);
          }}
        >
          <Pressable
            style={[
              styles.menuContainer,
              {
                top: insets.top + 64,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Ionicons name="person" size={20} color={COLORS.primaryGold} />
              </View>

              <View style={styles.menuHeaderText}>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {fullName}
                </Text>
                <Text style={styles.menuSubtitle} numberOfLines={1}>
                  {user?.email || 'Kelola akun kamu'}
                </Text>
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
                <Ionicons name="person-outline" size={20} color={COLORS.goldText} />
              </View>

              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Profile</Text>
                <Text style={styles.menuItemDescription}>Lihat profil akun</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#777C77" />
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
                  <ActivityIndicator size="small" color={COLORS.danger} />
                ) : (
                  <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                )}
              </View>

              <View style={styles.menuItemContent}>
                <Text style={styles.logoutTitle}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Text>
                <Text style={styles.menuItemDescription}>Keluar dari akun</Text>
              </View>

              {!isLoggingOut && (
                <Ionicons name="chevron-forward" size={18} color="#777C77" />
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );

  if (children) {
    return (
      <View style={styles.screenWrapper}>
        {headerNode}
        {children}
        {showBottomBar && <AppBottomBar activeTab={activeTab} />}
        {modalsNode}
      </View>
    );
  }

  return (
    <>
      {headerNode}
      {showBottomBar && <AppBottomBar activeTab={activeTab} />}
      {modalsNode}
    </>
  );
}


const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  content: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAD196',
    borderWidth: 1.5,
    borderColor: '#C6A152',
  },
  textContainer: {
    marginLeft: 12,
  },
  welcome: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 19,
    color: COLORS.textDark,
  },
  name: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FONTS.medium,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(28, 25, 23, 0.75)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E53935',
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  menuButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBottomContainer: {
    marginTop: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  menuContainer: {
    position: 'absolute',
    right: 18,
    width: 280,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  menuHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textLight,
  },
  menuSubtitle: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 14,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    borderRadius: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goldSoft,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 83, 83, 0.15)',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  logoutTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.danger,
  },
  menuItemDescription: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
