import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { COLORS, FONTS } from '@/constants/theme';
import {
  combineDateAndTime,
  formatDateToYMD,
  formatDisplayDateTime,
  formatTimeToHHMM,
} from '@/lib/datetime/dateUtils';

import { DatePickerField } from './DatePickerField';
import { TimePickerField } from './TimePickerField';

export interface DateTimePickerFieldProps {
  label?: string;
  value?: Date | string | null;
  onChange: (combinedDate: Date, isoString: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  showPreview?: boolean;
  showWeekday?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  dateLabel = 'Tanggal',
  timeLabel = 'Waktu / Jam',
  datePlaceholder = 'Pilih tanggal',
  timePlaceholder = 'Pilih jam',
  minimumDate,
  maximumDate,
  disabled = false,
  error,
  style,
  required = false,
  showPreview = false,
  showWeekday = false,
  clearable = false,
  onClear,
}: DateTimePickerFieldProps) {
  const currentDate = value ? (value instanceof Date ? value : new Date(value)) : null;

  const handleDateChange = (newDate: Date) => {
    const combined = combineDateAndTime(newDate, currentDate, true);
    onChange(combined, combined.toISOString());
  };

  const handleTimeChange = (newTime: Date) => {
    const base = currentDate ?? new Date();
    const combined = combineDateAndTime(base, newTime);
    onChange(combined, combined.toISOString());
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>

          {clearable && Boolean(value) && onClear ? (
            <Pressable hitSlop={8} onPress={onClear} disabled={disabled}>
              <Text style={styles.clearBtnText}>Hapus</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <DatePickerField
            label={dateLabel}
            value={currentDate ? formatDateToYMD(currentDate) : null}
            onChange={handleDateChange}
            placeholder={datePlaceholder}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            disabled={disabled}
            showWeekday={showWeekday}
          />
        </View>

        <View style={styles.flexHalf}>
          <TimePickerField
            label={timeLabel}
            value={currentDate ? formatTimeToHHMM(currentDate) : null}
            onChange={handleTimeChange}
            placeholder={timePlaceholder}
            disabled={disabled}
          />
        </View>
      </View>

      {showPreview && currentDate && !isNaN(currentDate.getTime()) && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Terpilih:</Text>
          <Text style={styles.previewValue}>
            {formatDisplayDateTime(currentDate)}
          </Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.goldText,
  },
  clearBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#FF6B6B',
  },
  required: {
    color: '#FF6B6B',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexHalf: {
    flex: 1,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  previewLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#8A978B',
  },
  previewValue: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.primaryGold,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 2,
    marginLeft: 4,
  },
});
