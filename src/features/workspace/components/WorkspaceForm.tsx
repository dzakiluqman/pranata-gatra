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

export type CreateWorkspaceFormData = {
  name: string;
  description: string;
  type: 'personal' | 'collaborative';
  members: string[];
};

type WorkspaceFormProps = {
  initialValues?: Partial<CreateWorkspaceFormData>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateWorkspaceFormData) => Promise<void>;
};

export function WorkspaceForm({
  initialValues,
  submitLabel = 'Create Workspace',
  isSubmitting = false,
  onSubmit,
}: WorkspaceFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [type, setType] = useState<'personal' | 'collaborative'>(
    initialValues?.type ?? 'personal',
  );
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<string[]>(initialValues?.members ?? []);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    if (!email.includes('@')) {
      setError('Masukkan email yang valid.');
      return;
    }
    if (members.includes(email)) {
      setError('Email member sudah ditambahkan.');
      return;
    }
    setMembers((prev) => [...prev, email]);
    setMemberEmail('');
    setError(null);
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMembers((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Workspace Name wajib diisi.');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        type,
        members,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan workspace.');
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Workspace Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Workspace Name</Text>
        <View style={styles.pillInputContainer}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name Example"
            placeholderTextColor="#666666"
            style={styles.input}
            editable={!isSubmitting}
            maxLength={100}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor="#666666"
            style={[styles.input, styles.textArea]}
            editable={!isSubmitting}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
      </View>

      {/* Workspace Type */}
      <View style={styles.field}>
        <Text style={styles.label}>Workspace Type</Text>
        <View style={styles.typeRow}>
          {/* Personal Pill */}
          <Pressable
            style={styles.typeButtonWrapper}
            onPress={() => setType('personal')}
          >
            {type === 'personal' ? (
              <LinearGradient
                colors={COLORS.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.typeButtonActive}
              >
                <Text style={styles.typeTextActive}>Personal</Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['#8C7238', '#C4A259']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.typeButtonInactive, { opacity: 0.6 }]}
              >
                <Text style={styles.typeTextInactive}>Personal</Text>
              </LinearGradient>
            )}
          </Pressable>

          {/* Collaborative Pill */}
          <Pressable
            style={styles.typeButtonWrapper}
            onPress={() => setType('collaborative')}
          >
            {type === 'collaborative' ? (
              <LinearGradient
                colors={COLORS.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.typeButtonActive}
              >
                <Text style={styles.typeTextActive}>Collaborative</Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['#8C7238', '#C4A259']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.typeButtonInactive, { opacity: 0.6 }]}
              >
                <Text style={styles.typeTextInactive}>Collaborative</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>

      {/* Members field (only shown if type === 'collaborative') */}
      {type === 'collaborative' && (
        <View style={styles.field}>
          <Text style={styles.label}>Members</Text>
          <View style={styles.memberInputContainer}>
            <TextInput
              value={memberEmail}
              onChangeText={setMemberEmail}
              placeholder="example@gmail.com"
              placeholderTextColor="#666666"
              style={styles.memberInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              onSubmitEditing={handleAddMember}
            />

            <Pressable
              onPress={handleAddMember}
              hitSlop={8}
              style={({ pressed }) => [
                styles.sendButtonWrapper,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={COLORS.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={16} color={COLORS.textDark} />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Added members email list */}
          {members.length > 0 && (
            <View style={styles.membersList}>
              {members.map((email) => (
                <Pressable
                  key={email}
                  style={styles.memberChip}
                  onPress={() => handleRemoveMember(email)}
                  hitSlop={6}
                >
                  <Text style={styles.removeCross}>✕</Text>
                  <Text style={styles.memberEmailText}>{email}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Create Workspace Submit Pill Button */}
      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButtonWrapper,
          pressed && styles.pressed,
          isSubmitting && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={COLORS.goldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitButtonGradient}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.textDark} />
          ) : (
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.goldText,
    marginBottom: 8,
  },
  pillInputContainer: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textAreaContainer: {
    minHeight: 120,
    borderRadius: 24,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
  },
  textArea: {
    minHeight: 100,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButtonWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  typeButtonActive: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonInactive: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTextActive: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },
  typeTextInactive: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },
  memberInputContainer: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 6,
  },
  memberInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
  },
  sendButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersList: {
    marginTop: 10,
    gap: 6,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  removeCross: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  memberEmailText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  submitButtonWrapper: {
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    height: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
