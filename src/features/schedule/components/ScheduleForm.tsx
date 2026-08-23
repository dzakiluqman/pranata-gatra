import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
    if (scheduleId) {
      loadSchedule();
    }
  }, [scheduleId]);

  const loadSchedule = async () => {
    if (!scheduleId) return;
    try {
      setLoading(true);
      const schedule = await scheduleService.getById(scheduleId);
      setStartDate(schedule.startDate);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setRecurrenceEnabled(schedule.recurrenceEnabled);
      setRecurrenceInterval(schedule.recurrenceInterval);
      setRecurrenceUnit(schedule.recurrenceUnit);
      setRecurrenceEndDate(schedule.recurrenceEndDate || "");
    } catch (error) {
      console.error("Failed to load schedule:", error);
      Alert.alert("Gagal", "Tidak dapat memuat data schedule.");
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert("Gagal", "Schedule gagal disimpan.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A8D8A8" />
        <Text style={styles.loadingText}>Memuat schedule...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isEditing ? "Edit Schedule" : "Tambah Schedule"}
      </Text>
      <Text style={styles.subtitle}>Atur jadwal untuk subject ini.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Tanggal mulai</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder={startDate}
          placeholderTextColor="#555C55"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.label}>Mulai</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder={startTime}
            placeholderTextColor="#555C55"
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.timeField}>
          <Text style={styles.label}>Selesai</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder={endTime}
            placeholderTextColor="#555C55"
            style={styles.input}
            keyboardType="numbers-and-punctuation"
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
        <View style={styles.field}>
          <Text style={styles.label}>
            Berakhir pada
            <Text style={styles.optional}> (opsional)</Text>
          </Text>
          <TextInput
            value={recurrenceEndDate}
            onChangeText={setRecurrenceEndDate}
            placeholder={recurrenceEndDate || "YYYY-MM-DD"}
            placeholderTextColor="#555C55"
            style={styles.input}
          />
        </View>
      )}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? "Simpan Perubahan" : "Simpan Schedule"}
          </Text>
        )}
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
    fontSize: 13,
    color: "#8E998F",
  },
  title: {
    color: "#F5F7F3",
    fontSize: 25,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: -12,
    color: "#7F867F",
    fontSize: 13,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#A2A8A1",
    fontSize: 12,
    fontWeight: "600",
  },
  optional: {
    color: "#666D66",
    fontWeight: "400",
  },
  input: {
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    color: "#F5F7F3",
    fontSize: 14,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
  },
  timeField: {
    flex: 1,
    gap: 8,
  },
  button: {
    minHeight: 52,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#5C8F65",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
