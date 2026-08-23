import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

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
          <Text style={styles.title}>Ulangi schedule</Text>
          <Text style={styles.subtitle}>
            Schedule dapat diulang secara otomatis.
          </Text>
        </View>

        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          trackColor={{
            false: "#343A34",
            true: "#5C8F65",
          }}
          thumbColor="#F5F7F3"
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
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
    color: "#F5F7F3",
    fontSize: 15,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 4,
    color: "#7F867F",
    fontSize: 12,
  },

  repeatContainer: {
    marginTop: 18,
  },

  label: {
    marginBottom: 8,
    color: "#9CA39B",
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
    backgroundColor: "#0D120D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#F5F7F3",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
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
    backgroundColor: "#0D120D",
  },

  unitButtonActive: {
    backgroundColor: "rgba(92,143,101,0.22)",
    borderWidth: 1,
    borderColor: "#5C8F65",
  },

  unitText: {
    color: "#858C85",
    fontSize: 12,
    fontWeight: "600",
  },

  unitTextActive: {
    color: "#B8D7BD",
  },
});
