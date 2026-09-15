import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS, FONTS } from "@/constants/theme";
import type { RecurrenceUnit } from "../types/schedule.types";

interface Props {
  enabled: boolean;
  interval: number;
  unit: RecurrenceUnit;
  onEnabledChange: (value: boolean) => void;
  onIntervalChange: (value: number) => void;
  onUnitChange: (value: RecurrenceUnit) => void;
}

const units: {
  label: string;
  value: RecurrenceUnit;
}[] = [
  {
    label: "Hari",
    value: "day",
  },
  {
    label: "Minggu",
    value: "week",
  },
  {
    label: "Bulan",
    value: "month",
  },
];

export default function RecurrenceForm({
  enabled,
  interval,
  unit,
  onEnabledChange,
  onIntervalChange,
  onUnitChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Ulangi jadwal</Text>
          <Text style={styles.subtitle}>
            Jadwal dapat diulang secara berkala otomatis.
          </Text>
        </View>

        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          trackColor={{
            false: "#27272A",
            true: COLORS.primaryGold,
          }}
          thumbColor={COLORS.textLight}
        />
      </View>

      {enabled && (
        <View style={styles.repeatContainer}>
          <Text style={styles.label}>Ulangi setiap</Text>

          <View style={styles.controls}>
            <TextInput
              style={styles.intervalInput}
              value={String(interval)}
              onChangeText={(value) => {
                const parsed = Number(value.replace(/\D/g, ""));
                onIntervalChange(parsed > 0 ? parsed : 1);
              }}
              keyboardType="number-pad"
              maxLength={2}
            />

            <View style={styles.units}>
              {units.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => onUnitChange(item.value)}
                  style={[
                    styles.unitButton,
                    unit === item.value && styles.unitButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitText,
                      unit === item.value && styles.unitTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  textContainer: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    fontSize: 15,
  },

  subtitle: {
    fontFamily: FONTS.regular,
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  repeatContainer: {
    marginTop: 18,
  },

  label: {
    fontFamily: FONTS.medium,
    marginBottom: 8,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  controls: {
    flexDirection: "row",
    gap: 8,
  },

  intervalInput: {
    width: 58,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.bgBlack,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    color: COLORS.textLight,
    textAlign: "center",
    fontSize: 16,
    fontFamily: FONTS.bold,
  },

  units: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },

  unitButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.bgBlack,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 6,
  },

  unitButtonActive: {
    backgroundColor: COLORS.goldSoft,
    borderColor: COLORS.primaryGold,
  },

  unitText: {
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  unitTextActive: {
    fontFamily: FONTS.bold,
    color: COLORS.goldText,
  },
});
