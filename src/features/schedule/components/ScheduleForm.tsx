import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DatePickerField, TimePickerField } from "@/components/ui";
import { COLORS, FONTS } from "@/constants/theme";
import { parseLocalDate } from "@/lib/datetime/dateUtils";
import { useSchedule } from "../hooks/useSchedule";
import { scheduleService } from "../services/scheduleService";
import type { RecurrenceUnit } from "../types/schedule.types";
import RecurrenceForm from "./RecurrenceForm";

interface Props {
  subjectId: string;
  workspaceId: string;
  scheduleId?: string;
  onSuccess?: () => void;
}

export default function ScheduleForm({
  subjectId,
  workspaceId,
  scheduleId,
  onSuccess,
}: Props) {
  const { createSchedule, updateSchedule, isCreating, isUpdating } =
    useSchedule();

  const [loading, setLoading] = useState(!!scheduleId);

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceUnit>("week");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const isEditing = !!scheduleId;
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    let isMounted = true;
    if (scheduleId) {
      scheduleService
        .getById(scheduleId)
        .then((schedule) => {
          if (!isMounted) return;
          setStartDate(schedule.startDate);
          setStartTime(schedule.startTime);
          setEndTime(schedule.endTime);
          setRecurrenceEnabled(schedule.recurrenceEnabled);
          setRecurrenceInterval(schedule.recurrenceInterval);
          setRecurrenceUnit(schedule.recurrenceUnit);
          setRecurrenceEndDate(schedule.recurrenceEndDate || "");
          setLoading(false);
        })
        .catch((error) => {
          if (!isMounted) return;
          console.error("Failed to load schedule:", error);
          Alert.alert("Gagal", "Tidak dapat memuat data schedule.");
          setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [scheduleId]);

  const handleSubmit = async () => {
    if (!startDate) {
      Alert.alert("Validasi", "Tanggal schedule wajib diisi.");
      return;
    }

    if (!startTime || !endTime) {
      Alert.alert("Validasi", "Jam mulai dan selesai wajib diisi.");
      return;
    }

    const formattedStartTime = startTime.includes(".")
      ? startTime.replace(".", ":")
      : startTime;
    const formattedEndTime = endTime.includes(".")
      ? endTime.replace(".", ":")
      : endTime;

    if (formattedStartTime >= formattedEndTime) {
      Alert.alert("Validasi", "Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    if (recurrenceEnabled && recurrenceEndDate) {
      if (recurrenceEndDate < startDate) {
        Alert.alert(
          "Validasi",
          "Tanggal berakhir tidak boleh mendahului tanggal mulai.",
        );
        return;
      }
    }

    try {
      if (isEditing && scheduleId) {
        await updateSchedule({
          id: scheduleId,
          startDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          recurrenceEnabled,
          recurrenceInterval,
          recurrenceUnit,
          recurrenceEndDate: recurrenceEndDate ? recurrenceEndDate : null,
        });
        Alert.alert("Berhasil", "Schedule berhasil diperbarui.");
      } else {
        await createSchedule({
          subjectId,
          workspaceId,
          startDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          recurrenceEnabled,
          recurrenceInterval,
          recurrenceUnit,
          recurrenceEndDate: recurrenceEndDate ? recurrenceEndDate : null,
          reminderEnabled: false,
          reminderMinutes: 60,
        });
        Alert.alert("Berhasil", "Schedule berhasil dibuat.");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save schedule:", error);
      Alert.alert(
        "Gagal",
        error instanceof Error ? error.message : "Schedule gagal disimpan.",
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGold} />
        <Text style={styles.loadingText}>Memuat jadwal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        {isEditing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
      </Text>
      <Text style={styles.subtitle}>
        Tentukan hari dan jam pertemuan untuk subject ini.
      </Text>

      <DatePickerField
        label="Tanggal Mulai"
        value={startDate}
        onChange={(_, dateStr) => setStartDate(dateStr)}
        placeholder="Pilih tanggal mulai"
        showWeekday={true}
        required
      />

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <TimePickerField
            label="Jam Mulai"
            value={startTime}
            onChange={(_, timeStr) => setStartTime(timeStr)}
            placeholder="08:00"
            required
          />
        </View>

        <View style={styles.timeField}>
          <TimePickerField
            label="Jam Selesai"
            value={endTime}
            onChange={(_, timeStr) => setEndTime(timeStr)}
            placeholder="10:00"
            required
          />
        </View>
      </View>

      <RecurrenceForm
        enabled={recurrenceEnabled}
        interval={recurrenceInterval}
        unit={recurrenceUnit}
        onEnabledChange={setRecurrenceEnabled}
        onIntervalChange={setRecurrenceInterval}
        onUnitChange={setRecurrenceUnit}
      />

      {recurrenceEnabled && (
        <DatePickerField
          label="Berakhir pada (opsional)"
          value={recurrenceEndDate || null}
          onChange={(_, dateStr) => setRecurrenceEndDate(dateStr)}
          placeholder="Pilih tanggal berakhir"
          minimumDate={parseLocalDate(startDate) ?? undefined}
          showWeekday={true}
          clearable={true}
          onClear={() => setRecurrenceEndDate("")}
        />
      )}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      >
        <LinearGradient
          colors={COLORS.goldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.textDark} />
          ) : (
            <Text style={styles.buttonText}>
              {isEditing ? "Simpan Perubahan" : "Simpan Jadwal"}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  title: {
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    marginTop: -10,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  button: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
    fontSize: 15,
  },
});
