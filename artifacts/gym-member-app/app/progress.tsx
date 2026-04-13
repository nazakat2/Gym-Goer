import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DUMMY_PROGRESS } from "@/utils/dummyData";
import { formatDate } from "@/utils/helpers";

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [progress, setProgress] = useState(DUMMY_PROGRESS);
  const [showModal, setShowModal] = useState(false);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const latest = progress[0];
  const prev = progress[1];
  const weightChange = latest.weight - prev.weight;
  const fatChange = latest.bodyFat - prev.bodyFat;

  const handleAdd = () => {
    if (!weight || !bodyFat) { Alert.alert("Missing Info", "Please fill all fields."); return; }
    const entry = {
      id: "p_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      weight: parseFloat(weight),
      bodyFat: parseFloat(bodyFat),
      muscleMass: latest.muscleMass,
      bmi: parseFloat((parseFloat(weight) / (1.75 * 1.75)).toFixed(1)),
    };
    setProgress([entry, ...progress]);
    setShowModal(false);
    setWeight("");
    setBodyFat("");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Progress Tracking</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Feather name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Current Stats */}
      <Card style={[styles.heroCard, { backgroundColor: colors.primary, borderWidth: 0 }]}>
        <Text style={styles.heroLabel}>Current Stats</Text>
        <Text style={styles.heroDate}>As of {formatDate(latest.date)}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{latest.weight}kg</Text>
            <Text style={styles.heroStatLabel}>Weight</Text>
            <View style={[styles.changeBadge, { backgroundColor: weightChange < 0 ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)" }]}>
              <Feather name={weightChange < 0 ? "arrow-down" : "arrow-up"} size={10} color={weightChange < 0 ? "#4ADE80" : "#EF4444"} />
              <Text style={{ color: weightChange < 0 ? "#4ADE80" : "#EF4444", fontFamily: "Inter_600SemiBold", fontSize: 10 }}>
                {Math.abs(weightChange).toFixed(1)}kg
              </Text>
            </View>
          </View>
          <View style={[styles.heroStatDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{latest.bodyFat}%</Text>
            <Text style={styles.heroStatLabel}>Body Fat</Text>
            <View style={[styles.changeBadge, { backgroundColor: fatChange < 0 ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)" }]}>
              <Feather name={fatChange < 0 ? "arrow-down" : "arrow-up"} size={10} color={fatChange < 0 ? "#4ADE80" : "#EF4444"} />
              <Text style={{ color: fatChange < 0 ? "#4ADE80" : "#EF4444", fontFamily: "Inter_600SemiBold", fontSize: 10 }}>
                {Math.abs(fatChange).toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={[styles.heroStatDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{latest.bmi}</Text>
            <Text style={styles.heroStatLabel}>BMI</Text>
          </View>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <StatCard label="Muscle Mass" value={`${latest.muscleMass}kg`} icon="trending-up" color="#22C55E" />
        <StatCard label="Total Loss" value={`${(DUMMY_PROGRESS[DUMMY_PROGRESS.length - 1].weight - latest.weight).toFixed(1)}kg`} icon="activity" color={colors.primary} />
      </View>

      {/* History */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>History</Text>
      {progress.map((p, i) => (
        <Card key={p.id} style={styles.histCard}>
          <View style={styles.histRow}>
            <View>
              <Text style={[styles.histDate, { color: colors.foreground }]}>{formatDate(p.date)}</Text>
              <View style={styles.histMeta}>
                <Text style={[styles.histStat, { color: colors.mutedForeground }]}>Fat: {p.bodyFat}%</Text>
                <Text style={[styles.histStat, { color: colors.mutedForeground }]}>BMI: {p.bmi}</Text>
              </View>
            </View>
            <View style={styles.histWeight}>
              <Text style={[styles.histWeightVal, { color: colors.foreground }]}>{p.weight}kg</Text>
              {i < progress.length - 1 && (
                <Text style={[styles.histWeightDiff, { color: p.weight < progress[i + 1].weight ? colors.success : colors.destructive }]}>
                  {p.weight < progress[i + 1].weight ? "↓" : "↑"} {Math.abs(p.weight - progress[i + 1].weight).toFixed(1)}kg
                </Text>
              )}
            </View>
          </View>
        </Card>
      ))}

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Progress</Text>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Weight (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 81.5"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius }]}
            />
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Body Fat %</Text>
            <TextInput
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="decimal-pad"
              placeholder="e.g. 17.5"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius }]}
            />
            <Button title="Save Entry" onPress={handleAdd} style={{ marginTop: 8 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  heroCard: { padding: 20, marginBottom: 20 },
  heroLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 13 },
  heroDate: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 20 },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatValue: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 24 },
  heroStatLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 13 },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
  heroStatDivider: { width: 1, height: 50, marginHorizontal: 8 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 14 },
  histCard: { marginBottom: 10 },
  histRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  histDate: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  histMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  histStat: { fontFamily: "Inter_400Regular", fontSize: 13 },
  histWeight: { alignItems: "flex-end" },
  histWeightVal: { fontFamily: "Inter_700Bold", fontSize: 20 },
  histWeightDiff: { fontFamily: "Inter_500Medium", fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 20 },
  modalLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 8 },
  modalInput: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_400Regular", marginBottom: 16 },
});
