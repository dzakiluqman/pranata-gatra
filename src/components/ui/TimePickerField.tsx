import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';
import {
  formatTimeToHHMM,
  parseLocalTime,
} from '@/lib/datetime/dateUtils';

export interface TimePickerFieldProps {
  label?: string;
  value?: Date | string | null;
  onChange: (date: Date, timeString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  is24Hour?: boolean;
}

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = 'Pilih waktu',
  disabled = false,
  error,
  style,
  required = false,
  is24Hour = true,
}: TimePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = parseLocalTime(value);
  const [tempIosDate, setTempIosDate] = useState<Date>(selectedDate);

  const handleOpen = () => {
    if (disabled) return;
    setTempIosDate(selectedDate);
    setShowPicker(true);
  };

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    newDate?: Date
  ) => {
    setShowPicker(false);
    if (event.type === 'set' && newDate) {
      onChange(newDate, formatTimeToHHMM(newDate));
    }
  };

  const handleIosConfirm = () => {
    setShowPicker(false);
    onChange(tempIosDate, formatTimeToHHMM(tempIosDate));
  };

  const displayValue = value ? formatTimeToHHMM(value) : '';

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        style={({ pressed }) => [
          styles.fieldCard,
          pressed && styles.fieldPressed,
          error ? styles.fieldError : null,
          disabled ? styles.fieldDisabled : null,
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name="time-outline"
            size={18}
            color={COLORS.primaryGold}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.valueText,
              !displayValue && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {displayValue || placeholder}
          </Text>
        </View>

        <Ionicons
          name="chevron-down"
          size={16}
          color={COLORS.goldText}
          style={styles.chevron}
        />
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Android Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          is24Hour={is24Hour}
          display="default"
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS Modal Picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            style={styles.iosModalOverlay}
            onPress={() => setShowPicker(false)}
          >
            <Pressable
              style={styles.iosPickerContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.iosToolbar}>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  hitSlop={10}
                >
                  <Text style={styles.iosCancelButton}>Batal</Text>
                </Pressable>

                <Text style={styles.iosTitle}>{label || 'Pilih Waktu'}</Text>

                <Pressable onPress={handleIosConfirm} hitSlop={10}>
                  <Text style={styles.iosConfirmButton}>Selesai</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempIosDate}
                mode="time"
                is24Hour={is24Hour}
                display="spinner"
                onChange={(_, date) => {
                  if (date) setTempIosDate(date);
                }}
                textColor="#FFFFFF"
                themeVariant="dark"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.goldText,
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  fieldCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121713',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(179, 141, 70, 0.25)',
    paddingHorizontal: 14,
  },
  fieldPressed: {
    borderColor: COLORS.primaryGold,
    backgroundColor: 'rgba(179, 141, 70, 0.08)',
  },
  fieldError: {
    borderColor: '#FF6B6B',
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(179, 141, 70, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  valueText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textLight,
  },
  placeholderText: {
    color: '#6F7B70',
    fontFamily: FONTS.regular,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.7,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
  },
  // iOS Picker Modal
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: '#181E19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(179, 141, 70, 0.3)',
  },
  iosToolbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iosTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.textLight,
  },
  iosCancelButton: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#9CA3AF',
  },
  iosConfirmButton: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primaryGold,
  },
});
