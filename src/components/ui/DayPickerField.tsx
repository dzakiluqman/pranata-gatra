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
import { DAYS_OF_WEEK, DayOfWeekItem } from '@/lib/datetime/dateUtils';

export interface DayPickerFieldProps {
  label?: string;
  value?: number | string | null; // 1 (Senin) to 7 (Minggu) or 'Senin', etc.
  onChange: (dayId: number, dayName: string) => void;
  disabled?: boolean;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  subtitle?: string;
}

export function DayPickerField({
  label,
  value,
  onChange,
  disabled = false,
  error,
  style,
  required = false,
  subtitle,
}: DayPickerFieldProps) {
  // Normalize value to 1-7
  const currentDayId = React.useMemo(() => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value >= 1 && value <= 7 ? value : null;
    const num = Number(value);
    if (!isNaN(num) && num >= 1 && num <= 7) return num;
    const match = DAYS_OF_WEEK.find(
      (d) => d.fullName.toLowerCase() === String(value).toLowerCase() ||
             d.shortName.toLowerCase() === String(value).toLowerCase()
    );
    return match ? match.id : null;
  }, [value]);

  const handleSelect = (item: DayOfWeekItem) => {
    if (disabled) return;
    onChange(item.id, item.fullName);
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.pillsContainer}>
        {DAYS_OF_WEEK.map((item) => {
          const isSelected = currentDayId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.dayPill,
                isSelected && styles.dayPillActive,
                pressed && !isSelected && styles.dayPillPressed,
                disabled && styles.dayPillDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.fullName}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.dayShortText,
                  isSelected && styles.dayShortTextActive,
                ]}
              >
                {item.shortName}
              </Text>
              <Text
                style={[
                  styles.dayFullText,
                  isSelected && styles.dayFullTextActive,
                ]}
              >
                {item.fullName}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#8A978B',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    flex: 1,
    minWidth: 42,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#121713',
    borderWidth: 1,
    borderColor: 'rgba(179, 141, 70, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dayPillActive: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  dayPillPressed: {
    backgroundColor: 'rgba(179, 141, 70, 0.12)',
    borderColor: COLORS.primaryGold,
  },
  dayPillDisabled: {
    opacity: 0.5,
  },
  dayShortText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  dayShortTextActive: {
    color: COLORS.textDark,
  },
  dayFullText: {
    fontFamily: FONTS.regular,
    fontSize: 9,
    color: '#8A978B',
    marginTop: 2,
  },
  dayFullTextActive: {
    color: '#3B2F13',
    fontFamily: FONTS.medium,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
  },
});
