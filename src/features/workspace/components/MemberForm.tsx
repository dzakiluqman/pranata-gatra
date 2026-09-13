import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';

type MemberFormProps = {
  onSubmit: (email: string) => Promise<void>;
  isSubmitting?: boolean;
};

export function MemberForm({
  onSubmit,
  isSubmitting = false,
}: MemberFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const value = email.trim().toLowerCase();

    if (!value) {
      setError('Email wajib diisi.');
      return;
    }

    if (!value.includes('@')) {
      setError('Masukkan email yang valid.');
      return;
    }

    try {
      setError(null);
      await onSubmit(value);
      setEmail('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengirim invitation.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Undang Member Baru</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={18} color={COLORS.goldText} />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="contoh@email.com"
          placeholderTextColor="#666666"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.buttonWrapper,
            pressed && styles.pressed,
            isSubmitting && styles.disabled,
          ]}
          hitSlop={6}
        >
          <LinearGradient
            colors={COLORS.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.textDark} />
            ) : (
              <Ionicons name="send" size={15} color={COLORS.textDark} />
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    marginBottom: 16,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.goldText,
    marginBottom: 10,
  },
  inputContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 25,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textLight,
  },
  error: {
    marginTop: 8,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.danger,
  },
  buttonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
