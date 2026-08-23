import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { scheduleService } from "../services/scheduleService";
import type { Schedule } from "../types/schedule.types";
import { formatRecurrence } from "../utils/recurrence";

interface Props {
  schedule: Schedule;
  onPress?: () => void;
  onDeleteSuccess?: () => void;
  showDeleteButton?: boolean;
  workspaceId?: string;
  subjectId?: string;
}

export default function ScheduleCard({
  schedule,
  onPress,
  onDeleteSuccess,
  showDeleteButton = false,
  workspaceId,
  subjectId,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInProgressRef = useRef(false);
  const queryClient = useQueryClient();

  const handleDelete = () => {
    if (deleteInProgressRef.current || isDeleting) return;

    Alert.alert(
      "Hapus schedule?",
      "Schedule ini akan dihapus secara permanen.",
      [
        {
          text: "Batal",
          style: "cancel",
          onPress: () => {
            deleteInProgressRef.current = false;
          },
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            if (deleteInProgressRef.current || isDeleting) return;

            deleteInProgressRef.current = true;
            setIsDeleting(true);

            try {
              await scheduleService.remove(schedule.id);

              if (workspaceId) {
                queryClient.invalidateQueries({
                  queryKey: ["schedules", "workspace", workspaceId],
                });
              }

              if (subjectId) {
                queryClient.invalidateQueries({
                  queryKey: ["schedules", "subject", subjectId],
                });
              }

              queryClient.invalidateQueries({
                queryKey: ["schedules", "today"],
              });

              queryClient.invalidateQueries({
                queryKey: ["schedules"],
              });

              onDeleteSuccess?.();
            } catch (error) {
              Alert.alert(
                "Gagal menghapus",
                error instanceof Error
                  ? error.message
                  : "Schedule tidak dapat dihapus.",
              );
              deleteInProgressRef.current = false;
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        disabled={isDeleting}
        style={({ pressed }) => [
          styles.container,
          pressed && !showDeleteButton && styles.pressed,
          isDeleting && styles.disabled,
        ]}
      >
        <View style={styles.timeColumn}>
          <Text style={styles.startTime}>{schedule.startTime.slice(0, 5)}</Text>

          <View style={styles.line} />

          <Text style={styles.endTime}>{schedule.endTime.slice(0, 5)}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {schedule.subject?.name ?? "Subject"}
          </Text>

          {schedule.subject?.room && (
            <View style={styles.meta}>
              <Ionicons name="location-outline" size={14} color="#9CA39B" />

              <Text style={styles.metaText}>{schedule.subject.room}</Text>
            </View>
          )}

          <View style={styles.meta}>
            <Ionicons name="repeat-outline" size={14} color="#9CA39B" />

            <Text style={styles.metaText}>{formatRecurrence(schedule)}</Text>
          </View>
        </View>

        {!showDeleteButton && (
          <Ionicons name="chevron-forward" size={18} color="#666D66" />
        )}
      </Pressable>

      {showDeleteButton && (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deletePressed,
            isDeleting && styles.deleteDisabled,
          ]}
          disabled={isDeleting}
          onPress={handleDelete}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FF8A8A" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#FF8A8A" />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 96,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#151A15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  timeColumn: {
    width: 64,
    alignItems: "center",
  },
  startTime: {
    color: "#F5F7F3",
    fontSize: 15,
    fontWeight: "700",
  },
  endTime: {
    color: "#777E77",
    fontSize: 12,
  },
  line: {
    width: 1,
    height: 14,
    marginVertical: 4,
    backgroundColor: "#3A423A",
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  subjectName: {
    color: "#F5F7F3",
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  metaText: {
    marginLeft: 5,
    color: "#9CA39B",
    fontSize: 12,
  },
  deleteButton: {
    width: 48,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255, 138, 138, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 138, 138, 0.15)",
  },
  deletePressed: {
    backgroundColor: "rgba(255, 138, 138, 0.15)",
  },
  deleteDisabled: {
    opacity: 0.6,
  },
});
