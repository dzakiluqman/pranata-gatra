import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
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

import { COLORS, FONTS } from "@/constants/theme";
import { createTaskSchema } from "../schemas/taskSchemas";
import type { TaskStatus, TaskWithRelations } from "../types/task.types";

export interface TaskFormWorkspace {
  id: string;
  name: string;
}

export interface TaskFormSubject {
  id: string;
  name: string;
  workspace_id?: string;
}

export interface TaskFormMember {
  id: string;
  email: string;
  full_name: string | null;
  workspace_id?: string;
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
  onWorkspaceChange?: (workspaceId: string) => void;
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
  onWorkspaceChange,
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
    subject_id?: string;
    assigned_to?: string;
    deadline?: string;
  }>({});

  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (subject) => !subject.workspace_id || subject.workspace_id === workspaceId,
    );
  }, [subjects, workspaceId]);

  const filteredMembers = useMemo(() => {
    return members.filter(
      (member) => !member.workspace_id || member.workspace_id === workspaceId,
    );
  }, [members, workspaceId]);

  const effectiveSubjectId = filteredSubjects.some((s) => s.id === subjectId)
    ? subjectId
    : null;

  const effectiveAssignedTo = filteredMembers.some((m) => m.id === assignedTo)
    ? assignedTo
    : null;

  const selectedWorkspace = workspaces.find(
    (workspace) => workspace.id === workspaceId,
  );

  const selectedSubject = filteredSubjects.find(
    (subject) => subject.id === effectiveSubjectId,
  );

  const selectedMember = filteredMembers.find(
    (member) => member.id === effectiveAssignedTo,
  );

  const validate = () => {
    const nextErrors: {
      title?: string;
      workspace_id?: string;
      subject_id?: string;
      assigned_to?: string;
      deadline?: string;
    } = {};

    if (!title.trim()) {
      nextErrors.title = "Judul tugas wajib diisi.";
    }

    if (!workspaceId) {
      nextErrors.workspace_id = "Workspace wajib dipilih.";
    }

    if (subjectId && !filteredSubjects.some((s) => s.id === subjectId)) {
      nextErrors.subject_id =
        "Subject tidak valid untuk workspace yang dipilih.";
    }

    if (assignedTo && !filteredMembers.some((m) => m.id === assignedTo)) {
      nextErrors.assigned_to =
        "Member tidak valid untuk workspace yang dipilih.";
    }

    const result = createTaskSchema.safeParse({
      title,
      description,
      workspace_id: workspaceId,
      subject_id: effectiveSubjectId,
      assigned_to: effectiveAssignedTo,
      deadline: deadline ? deadline.toISOString() : null,
    });

    if (!result.success) {
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
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      workspace_id: workspaceId,
      subject_id: effectiveSubjectId,
      assigned_to: effectiveAssignedTo,
      deadline: deadline ? deadline.toISOString() : null,
      status: isEditing ? status : undefined,
    });
  };

  const handleDateChange = (event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (!selectedDate) {
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

  const handleTimeChange = (event: unknown, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (!selectedTime) {
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
    if (id === workspaceId) return;
    setWorkspaceId(id);
    setSubjectId(null);
    setAssignedTo(null);
    onWorkspaceChange?.(id);
    setErrors((prev) => ({
      ...prev,
      workspace_id: undefined,
      subject_id: undefined,
      assigned_to: undefined,
    }));
  };

  const handleSubjectChange = (id: string | null) => {
    setSubjectId(id);
    setErrors((prev) => ({ ...prev, subject_id: undefined }));
  };

  const handleMemberChange = (id: string | null) => {
    setAssignedTo(id);
    setErrors((prev) => ({ ...prev, assigned_to: undefined }));
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
              placeholderTextColor="#6D786E"
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
              placeholderTextColor="#6D786E"
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

          {errors.workspace_id ? (
            <Text style={styles.errorText}>{errors.workspace_id}</Text>
          ) : null}

          {selectedWorkspace ? (
            <View style={styles.selectedInfo}>
              <Ionicons name="grid-outline" size={15} color="#A8D8A8" />
              <Text style={styles.selectedInfoText}>
                Workspace: {selectedWorkspace.name}
              </Text>
            </View>
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
                effectiveSubjectId === null && styles.selectedOption,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  effectiveSubjectId === null && styles.selectedRadio,
                ]}
              >
                {effectiveSubjectId === null ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>

              <Text
                style={[
                  styles.optionText,
                  effectiveSubjectId === null && styles.selectedOptionText,
                ]}
              >
                Tanpa Subject
              </Text>
            </Pressable>

            {filteredSubjects.map((subject) => {
              const selected = subject.id === effectiveSubjectId;

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

          {errors.subject_id ? (
            <Text style={styles.errorText}>{errors.subject_id}</Text>
          ) : null}

          {selectedSubject ? (
            <View style={styles.selectedInfo}>
              <Ionicons name="book-outline" size={15} color="#A8D8A8" />
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
                effectiveAssignedTo === null && styles.selectedOption,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  effectiveAssignedTo === null && styles.selectedRadio,
                ]}
              >
                {effectiveAssignedTo === null ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>

              <Text
                style={[
                  styles.optionText,
                  effectiveAssignedTo === null && styles.selectedOptionText,
                ]}
              >
                Belum ditugaskan
              </Text>
            </Pressable>

            {filteredMembers.map((member) => {
              const selected = member.id === effectiveAssignedTo;

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

          {errors.assigned_to ? (
            <Text style={styles.errorText}>{errors.assigned_to}</Text>
          ) : null}

          {selectedMember ? (
            <View style={styles.selectedInfo}>
              <Ionicons name="person-outline" size={15} color="#A8D8A8" />
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
              <Ionicons name="calendar-outline" size={20} color="#A8D8A8" />

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
              <Ionicons name="time-outline" size={20} color="#A8D8A8" />

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
              <Ionicons name="alarm-outline" size={17} color="#A8D8A8" />
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
            <Text style={styles.sectionTitle}>Status Tugas</Text>

            <View style={styles.statusContainer}>
              <Pressable
                onPress={() => setStatus("pending")}
                disabled={isSubmitting}
                style={[
                  styles.statusButton,
                  status === "pending" && styles.selectedStatusButton,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "pending" && styles.selectedStatusButtonText,
                  ]}
                >
                  Pending
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setStatus("in_progress")}
                disabled={isSubmitting}
                style={[
                  styles.statusButton,
                  status === "in_progress" && styles.selectedStatusButton,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "in_progress" && styles.selectedStatusButtonText,
                  ]}
                >
                  In Progress
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setStatus("completed")}
                disabled={isSubmitting}
                style={[
                  styles.statusButton,
                  status === "completed" && styles.selectedStatusButton,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "completed" && styles.selectedStatusButtonText,
                  ]}
                >
                  Selesai
                </Text>
              </Pressable>
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
            style={[styles.submitButtonWrapper, isSubmitting && styles.disabledButton]}
          >
            <LinearGradient
              colors={COLORS.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.textDark} />
              ) : (
                <>
                  <Ionicons
                    name={isEditing ? "save-outline" : "add-outline"}
                    size={19}
                    color={COLORS.textDark}
                  />

                  <Text style={styles.submitButtonText}>
                    {isEditing ? "Simpan Perubahan" : "Buat Tugas"}
                  </Text>
                </>
              )}
            </LinearGradient>
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
    paddingBottom: 40,
    gap: 22,
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
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.goldText,
  },
  sectionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
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
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.goldText,
  },
  counter: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  input: {
    minHeight: 50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 20,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.danger,
  },
  optionsContainer: {
    gap: 9,
  },
  option: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.bgCard,
  },
  selectedOption: {
    borderColor: COLORS.primaryGold,
    backgroundColor: COLORS.goldSoft,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    borderColor: COLORS.primaryGold,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primaryGold,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  selectedOptionText: {
    color: COLORS.goldText,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.goldText,
  },
  memberEmail: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
  },
  selectedInfoText: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.goldText,
  },
  clearText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.danger,
  },
  deadlineActions: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    backgroundColor: COLORS.bgCard,
  },
  dateButtonContent: {
    flex: 1,
    gap: 2,
  },
  dateButtonLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dateButtonValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textLight,
  },
  deadlinePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  deadlinePreviewText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.bgCard,
  },
  selectedStatusButton: {
    backgroundColor: COLORS.goldSoft,
    borderColor: COLORS.primaryGold,
  },
  statusButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  selectedStatusButtonText: {
    color: COLORS.goldText,
    fontFamily: FONTS.bold,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.bgCard,
  },
  cancelButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  submitButtonWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
  },
  submitButtonGradient: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textDark,
  },
});
