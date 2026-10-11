import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '@/components/navigation/AppHeader';
import { COLORS, FONTS } from '@/constants/theme';
import { useSession } from '@/features/auth/hooks/useSession';
import { signOut } from '@/features/auth/services/authService';
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
} from '@/features/profile/services/profileService';

type SelectedImageState = {
  uri: string;
  base64?: string | null;
  mimeType?: string;
};

export default function ProfileScreen() {
  const { user } = useSession();

  // Local state for profile data
  const [initialFullName, setInitialFullName] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);

  // Loading & status states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const email = user?.email || '-';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  // Load existing profile from Supabase profiles table (or fallback to auth metadata)
  useEffect(() => {
    let isMounted = true;

    async function initProfile() {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const fallbackName =
          (user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            '') as string;
        const fallbackAvatar = (user.user_metadata?.avatar_url as string) || null;

        const { data: profileData, error } = await fetchProfile(user.id);

        if (!isMounted) return;

        if (error || !profileData) {
          setInitialFullName(fallbackName);
          setFullNameInput(fallbackName);
          setSavedAvatarUrl(fallbackAvatar);
        } else {
          const loadedName = profileData.full_name || fallbackName;
          const loadedAvatar = profileData.avatar_url || fallbackAvatar;
          setInitialFullName(loadedName);
          setFullNameInput(loadedName);
          setSavedAvatarUrl(loadedAvatar);
        }
      } catch {
        // silent fallback
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    initProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Check if any change has been made
  const isNameChanged = fullNameInput.trim() !== initialFullName.trim();
  const isImageChanged = selectedImage !== null;
  const isDirty = isNameChanged || isImageChanged;

  // Handle image picking via expo-image-picker
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Galeri Diperlukan',
          'Aplikasi memerlukan izin untuk mengakses galeri agar dapat memilih foto profil.',
          [{ text: 'Mengerti' }],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
        setSaveSuccessMsg(null);
      }
    } catch (err) {
      Alert.alert(
        'Gagal Membuka Galeri',
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memilih gambar.',
      );
    }
  };

  // Revert changes back to loaded profile
  const handleCancelChanges = () => {
    setFullNameInput(initialFullName);
    setSelectedImage(null);
    setSaveSuccessMsg(null);
  };

  // Save profile updates (Upload to Supabase Storage + Save to profiles table)
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    const trimmedName = fullNameInput.trim();
    if (!trimmedName) {
      Alert.alert('Nama Tidak Boleh Kosong', 'Harap masukkan nama lengkap kamu.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccessMsg(null);

      let finalAvatarUrl = savedAvatarUrl;

      // 1. If a new image was picked, upload to Supabase Storage bucket 'avatars'
      if (selectedImage) {
        const { data: uploadedUrl, error: uploadErr } = await uploadAvatar(
          user.id,
          selectedImage.uri,
          selectedImage.base64,
          selectedImage.mimeType,
        );

        if (uploadErr || !uploadedUrl) {
          throw new Error(uploadErr?.message || 'Gagal mengunggah foto profil.');
        }

        finalAvatarUrl = uploadedUrl;
      }

      // 2. Save full_name and avatar_url to the Supabase 'profiles' table & auth metadata
      const { data: updatedProfile, error: updateErr } = await updateProfile(user.id, {
        full_name: trimmedName,
        avatar_url: finalAvatarUrl || undefined,
        email: user.email,
      });

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      // 3. Update local states
      const savedName = updatedProfile?.full_name || trimmedName;
      setInitialFullName(savedName);
      setFullNameInput(savedName);
      setSavedAvatarUrl(finalAvatarUrl);
      setSelectedImage(null);

      setSaveSuccessMsg('Profil berhasil diperbarui!');
      Alert.alert('Berhasil', 'Profil kamu telah berhasil diperbarui.');
    } catch (err) {
      Alert.alert(
        'Gagal Menyimpan Profil',
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan perubahan.',
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  // Determine which avatar image URI to display
  const currentAvatarUri = selectedImage?.uri || savedAvatarUrl;
  const displayedName = fullNameInput.trim() || initialFullName || 'User';

  return (
    <View style={styles.container}>
      {/* Top Header on Gold Gradient with Floating Bottom Bar */}
      <AppHeader showBottomBar activeTab="home" />

      {/* Black Curved Sheet */}
      <View style={styles.blackSheet}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

            {/* Profile Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.avatarWrapper}>
                {currentAvatarUri ? (
                  <Image
                    source={{ uri: currentAvatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <LinearGradient
                    colors={COLORS.goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarCircle}
                  >
                    <Ionicons name="person" size={44} color={COLORS.textDark} />
                  </LinearGradient>
                )}

                {/* Edit Photo Floating Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cameraBadge,
                    pressed && styles.pressed,
                    isSaving && styles.disabled,
                  ]}
                  onPress={handlePickImage}
                  disabled={isSaving}
                  hitSlop={8}
                  accessibilityLabel="Ubah foto profil"
                >
                  <LinearGradient
                    colors={COLORS.goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cameraBadgeGradient}
                  >
                    <Ionicons name="camera" size={16} color={COLORS.textDark} />
                  </LinearGradient>
                </Pressable>

                {/* Loading indicator on avatar during saving */}
                {isSaving && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.primaryGold} />
                  </View>
                )}
              </View>

              <Text style={styles.userName} numberOfLines={1}>
                {displayedName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {email}
              </Text>

              {selectedImage && (
                <View style={styles.pendingImageBadge}>
                  <Ionicons name="image-outline" size={13} color={COLORS.goldAccent} />
                  <Text style={styles.pendingImageText}>Foto baru siap disimpan</Text>
                </View>
              )}

              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Member sejak {createdAt}</Text>
              </View>
            </View>

            {/* Edit Profile Form */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Edit Profil</Text>
                {isLoadingProfile && (
                  <ActivityIndicator size="small" color={COLORS.primaryGold} />
                )}
              </View>

              <View style={styles.formCard}>
                {/* Full Name Input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.goldAccent}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={fullNameInput}
                      onChangeText={(text) => {
                        setFullNameInput(text);
                        setSaveSuccessMsg(null);
                      }}
                      placeholder="Masukkan nama lengkap"
                      placeholderTextColor="#77777A"
                      style={styles.textInput}
                      editable={!isSaving}
                      maxLength={70}
                      autoCapitalize="words"
                    />
                    {fullNameInput.length > 0 && !isSaving && (
                      <Pressable
                        onPress={() => setFullNameInput('')}
                        hitSlop={8}
                        style={styles.clearButton}
                      >
                        <Ionicons name="close-circle" size={18} color="#77777A" />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Change Avatar Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.pickImageButton,
                    pressed && styles.pressed,
                    isSaving && styles.disabled,
                  ]}
                  onPress={handlePickImage}
                  disabled={isSaving}
                >
                  <View style={styles.pickImageLeft}>
                    <View style={styles.pickImageIconBox}>
                      <Ionicons name="images-outline" size={20} color={COLORS.goldText} />
                    </View>
                    <View style={styles.pickImageTextGroup}>
                      <Text style={styles.pickImageTitle}>
                        {selectedImage ? 'Ganti Pilihan Foto' : 'Pilih Foto Profil Baru'}
                      </Text>
                      <Text style={styles.pickImageSub}>
                        {selectedImage ? 'Gambar galeri telah dipilih' : 'Format JPG/PNG dari galeri'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </Pressable>

                {/* Success Message Banner */}
                {saveSuccessMsg && (
                  <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={styles.successBannerText}>{saveSuccessMsg}</Text>
                  </View>
                )}

                {/* Save & Cancel Action Buttons */}
                {isDirty && (
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && styles.pressed,
                        isSaving && styles.disabled,
                      ]}
                      onPress={handleCancelChanges}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelButtonText}>Batal</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.saveButtonWrapper,
                        pressed && styles.pressed,
                        isSaving && styles.disabled,
                      ]}
                      onPress={handleSaveProfile}
                      disabled={isSaving}
                    >
                      <LinearGradient
                        colors={COLORS.goldGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.saveButtonGradient}
                      >
                        {isSaving ? (
                          <View style={styles.savingRow}>
                            <ActivityIndicator size="small" color={COLORS.textDark} />
                            <Text style={styles.saveButtonText}>Menyimpan...</Text>
                          </View>
                        ) : (
                          <View style={styles.savingRow}>
                            <Ionicons name="checkmark" size={18} color={COLORS.textDark} />
                            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Account Details Read-Only Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detail Akun</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="person-outline" size={18} color={COLORS.goldText} />
                    <Text style={styles.infoLabel}>Nama Lengkap</Text>
                  </View>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {initialFullName || '-'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.goldText} />
                    <Text style={styles.infoLabel}>Email</Text>
                  </View>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {email}
                  </Text>
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
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBlack,
  },
  keyboardAvoid: {
    flex: 1,
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
    paddingBottom: 130,
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
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.goldAccent,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraBadgeGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.bgCard,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 10,
    textAlign: 'center',
  },
  pendingImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(179, 141, 70, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  pendingImageText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.goldText,
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
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.goldText,
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.goldText,
  },
  inputContainer: {
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
  },
  clearButton: {
    padding: 4,
  },
  pickImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickImageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pickImageIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageTextGroup: {
    flex: 1,
  },
  pickImageTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  pickImageSub: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  successBannerText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.success,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  saveButtonWrapper: {
    flex: 2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
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
    maxWidth: '55%',
    textAlign: 'right',
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
