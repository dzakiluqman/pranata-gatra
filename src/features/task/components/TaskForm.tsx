import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { createTaskSchema } from "../schemas/taskSchemas";
import type { TaskStatus, TaskWithRelations } from "../types/task.types";

export interface TaskFormWorkspace {
  id: string;
  name: string;
}

export interface TaskFormSubject {
  id: string;
  name: string;
}

export interface TaskFormMember {
  id: string;
  email: string;
  full_name: string | null;
}

interface TaskFormProps {
  task?: TaskWithRelations | null;
  workspaces: TaskFormWorkspace[];
  subjects?: TaskFormSubject[];
  members?: TaskFormMember[];
  defaultWorkspaceId?: string;
  defaultSubjectId?: string | null;
  defaultAssignedTo?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: {
    title: string;
    description: string;
    workspace_id: string;
    subject_id: string | null;
    assigned_to: string | null;
    deadline: string | null;
    status?: TaskStatus;
  }) => void;
  onCancel?: () => void;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isValidDate(date: Date | null) {
  return Boolean(date && !Number.isNaN(date.getTime()));
}

export function TaskForm({
  task,
  workspaces,
  subjects = [],
  members = [],
  defaultWorkspaceId,
  defaultSubjectId = null,
  defaultAssignedTo = null,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState(task?.title ?? "");

  const [description, setDescription] = useState(task?.description ?? "");

  const [workspaceId, setWorkspaceId] = useState(
    task?.workspace_id ?? defaultWorkspaceId ?? workspaces[0]?.id ?? "",
  );

  const [subjectId, setSubjectId] = useState<string | null>(
    task?.subject_id ?? defaultSubjectId ?? null,
  );

  const [assignedTo, setAssignedTo] = useState<string | null>(
    task?.assigned_to ?? defaultAssignedTo ?? null,
  );

  const [deadline, setDeadline] = useState<Date | null>(
    task?.deadline ? new Date(task.deadline) : null,
  );

  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);

  const [errors, setErrors] = useState<{
    title?: string;
    workspace_id?: string;
    deadline?: string;
  }>({});

  useEffect(() => {
    if (!task && defaultWorkspaceId) {
      setWorkspaceId(defaultWorkspaceId);
    }
  }, [defaultWorkspaceId, task]);

  const filteredSubjects = useMemo(() => subjects, [subjects]);

  const selectedWorkspace = workspaces.find(
    (workspace) => workspace.id === workspaceId,
  );

  const selectedSubject = subjects.find((subject) => subject.id === subjectId);

  const selectedMember = members.find((member) => member.id === assignedTo);

  const validate = () => {
    const result = createTaskSchema.safeParse({
      title,
      description,
      workspace_id: workspaceId,
      subject_id: subjectId,
      assigned_to: assignedTo,
      deadline: deadline ? deadline.toISOString() : null,
    });

    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors: {
      title?: string;
      workspace_id?: string;
      deadline?: string;
    } = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0];

      if (
        field === "title" ||
        field === "workspace_id" ||
        field === "deadline"
      ) {
        nextErrors[field] = issue.message;
      }
    }

    setErrors(nextErrors);

    return false;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      workspace_id: workspaceId,
      subject_id: subjectId,
      assigned_to: assignedTo,
      deadline: deadline ? deadline.toISOString() : null,
      status: isEditing ? status : undefined,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event?.type === "dismissed" || !selectedDate) {
      return;
    }

    const nextDate = new Date(selectedDate);

    if (deadline) {
      nextDate.setHours(deadline.getHours(), deadline.getMinutes(), 0, 0);
    } else {
      nextDate.setHours(23, 59, 0, 0);
    }

    setDeadline(nextDate);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (event?.type === "dismissed" || !selectedTime) {
      return;
    }

    const baseDate = deadline ? new Date(deadline) : new Date();

    baseDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    setDeadline(baseDate);
  };

  const handleClearDeadline = () => {
    setDeadline(null);
    setErrors((current) => ({
      ...current,
      deadline: undefined,
    }));
  };

  const handleWorkspaceChange = (id: string) => {
    setWorkspaceId(id);

    if (subjectId && !subjects.some((subject) => subject.id === subjectId)) {
      setSubjectId(null);
    }
  };

  const handleSubjectChange = (id: string | null) => {
    setSubjectId(id);
  };

  const handleMemberChange = (id: string | null) => {
    setAssignedTo(id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Tugas</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Judul Tugas</Text>

            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);

                if (errors.title) {
                  setErrors((current) => ({
                    ...current,
                    title: undefined,
                  }));
                }
              }}
              placeholder="Contoh: Kerjakan laporan Basis Data"
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              style={[styles.input, errors.title && styles.inputError]}
              editable={!isSubmitting}
            />

            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Deskripsi</Text>

              <Text style={styles.counter}>{description.length}/5000</Text>
            </View>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tambahkan detail tugas..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              maxLength={5000}
              style={[styles.input, styles.textArea]}
              editable={!isSubmitting}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workspace</Text>

          <View style={styles.optionsContainer}>
            {workspaces.map((workspace) => {
              const selected = workspace.id === workspaceId;

              return (
                <Pressable
                  key={workspace.id}
                  onPress={() => handleWorkspaceChange(workspace.id)}
                  disabled={isSubmitting}
                  style={[styles.option, selected && styles.selectedOption]}
                >
                  <View
                    style={[styles.radio, selected && styles.selectedRadio]}
                  >
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.optionText,
                      selected && styles.selectedOptionText,
                    ]}
                  >
                    {workspace.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!selectedWorkspace && workspaces.length === 0 ? (
            <Text style={styles.helperText}>
              Belum ada workspace yang tersedia.
            </Text>
          ) : null}

          {errors.workspace_id ? (
            <Text style={styles.errorText}>{errors.workspace_id}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject</Text>

          <View style={styles.optionsContainer}>
            <Pressable
              onPress={() => handleSubjectChange(null)}
              disabled={isSubmitting}
              style={[
                styles.option,
                subjectId === null && styles.selectedOption,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  subjectId === null && styles.selectedRadio,
                ]}
              >
                {subjectId === null ? <View style={styles.radioDot} /> : null}
              </View>

              <Text
                style={[
                  styles.optionText,
                  subjectId === null && styles.selectedOptionText,
                ]}
              >
                Tanpa Subject
              </Text>
            </Pressable>

            {filteredSubjects.map((subject) => {
              const selected = subject.id === subjectId;

              return (
                <Pressable
                  key={subject.id}
                  onPress={() => handleSubjectChange(subject.id)}
                  disabled={isSubmitting}
                  style={[styles.option, selected && styles.selectedOption]}
                >
                  <View
                    style={[styles.radio, selected && styles.selectedRadio]}
                  >
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>

                  <View style={styles.optionContent}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.optionText,
                        selected && styles.selectedOptionText,
                      ]}
                    >
                      {subject.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedSubject ? (
            <View style={styles.selectedInfo}>
              <Ionicons name="book-outline" size={15} color="#1C5BFF" />

              <Text style={styles.selectedInfoText}>
                {selectedSubject.name}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign ke Member</Text>

          <View style={styles.optionsContainer}>
            <Pressable
              onPress={() => handleMemberChange(null)}
              disabled={isSubmitting}
              style={[
                styles.option,
                assignedTo === null && styles.selectedOption,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  assignedTo === null && styles.selectedRadio,
                ]}
              >
                {assignedTo === null ? <View style={styles.radioDot} /> : null}
              </View>

              <Text
                style={[
                  styles.optionText,
                  assignedTo === null && styles.selectedOptionText,
                ]}
              >
                Belum ditugaskan
              </Text>
            </Pressable>

            {members.map((member) => {
              const selected = member.id === assignedTo;

              return (
                <Pressable
                  key={member.id}
                  onPress={() => handleMemberChange(member.id)}
                  disabled={isSubmitting}
                  style={[styles.option, selected && styles.selectedOption]}
                >
                  <View
                    style={[styles.radio, selected && styles.selectedRadio]}
                  >
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>

                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {(member.full_name || member.email)
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.optionContent}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.optionText,
                        selected && styles.selectedOptionText,
                      ]}
                    >
                      {member.full_name || member.email}
                    </Text>

                    {member.full_name ? (
                      <Text numberOfLines={1} style={styles.memberEmail}>
                        {member.email}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedMember ? (
            <View style={styles.selectedInfo}>
              <Ionicons name="person-outline" size={15} color="#1C5BFF" />

              <Text style={styles.selectedInfoText}>
                Ditugaskan ke {selectedMember.full_name || selectedMember.email}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Deadline</Text>

              <Text style={styles.sectionSubtitle}>Opsional</Text>
            </View>

            {deadline ? (
              <Pressable onPress={handleClearDeadline} disabled={isSubmitting}>
                <Text style={styles.clearText}>Hapus</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.deadlineActions}>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              disabled={isSubmitting}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color="#1C5BFF" />

              <View style={styles.dateButtonContent}>
                <Text style={styles.dateButtonLabel}>Tanggal</Text>

                <Text style={styles.dateButtonValue}>
                  {deadline
                    ? new Intl.DateTimeFormat("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(deadline)
                    : "Pilih tanggal"}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setShowTimePicker(true)}
              disabled={isSubmitting}
              style={styles.dateButton}
            >
              <Ionicons name="time-outline" size={20} color="#1C5BFF" />

              <View style={styles.dateButtonContent}>
                <Text style={styles.dateButtonLabel}>Waktu</Text>

                <Text style={styles.dateButtonValue}>
                  {deadline
                    ? new Intl.DateTimeFormat("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(deadline)
                    : "Pilih waktu"}
                </Text>
              </View>
            </Pressable>
          </View>

          {deadline && isValidDate(deadline) ? (
            <View style={styles.deadlinePreview}>
              <Ionicons name="alarm-outline" size={17} color="#6B7280" />

              <Text style={styles.deadlinePreviewText}>
                {formatDateTime(deadline)}
              </Text>
            </View>
          ) : null}

          {errors.deadline ? (
            <Text style={styles.errorText}>{errors.deadline}</Text>
          ) : null}

          {showDatePicker ? (
            <DateTimePicker
              value={deadline ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          ) : null}

          {showTimePicker ? (
            <DateTimePicker
              value={deadline ?? new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          ) : null}
        </View>

        {isEditing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>

            <View style={styles.statusContainer}>
              {(["pending", "in_progress", "completed"] as TaskStatus[]).map(
                (item) => {
                  const selected = status === item;

                  const label =
                    item === "pending"
                      ? "Pending"
                      : item === "in_progress"
                        ? "Dikerjakan"
                        : "Selesai";

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setStatus(item)}
                      disabled={isSubmitting}
                      style={[
                        styles.statusButton,
                        selected && styles.selectedStatusButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          selected && styles.selectedStatusButtonText,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "save-outline" : "add-outline"}
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.submitButtonText}>
                  {isEditing ? "Simpan Perubahan" : "Buat Tugas"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  counter: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  input: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  textArea: {
    minHeight: 120,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  selectedOption: {
    borderColor: "#1C5BFF",
    backgroundColor: "#F5F8FF",
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    borderColor: "#1C5BFF",
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#1C5BFF",
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  selectedOptionText: {
    color: "#1C5BFF",
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEFF",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C5BFF",
  },
  memberEmail: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F5F8FF",
  },
  selectedInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#1C5BFF",
  },
  clearText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  deadlineActions: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  dateButtonContent: {
    flex: 1,
    gap: 3,
  },
  dateButtonLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  dateButtonValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  deadlinePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  deadlinePreviewText: {
    fontSize: 12,
    color: "#4B5563",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  selectedStatusButton: {
    backgroundColor: "#1C5BFF",
    borderColor: "#1C5BFF",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  selectedStatusButtonText: {
    color: "#FFFFFF",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  submitButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "#1C5BFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
