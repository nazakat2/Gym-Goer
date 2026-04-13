import { router } from "expo-router";
import React, { useState } from "react";
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

import { DUMMY_WORKOUT_PLANS } from "@/utils/dummyData";

const HERO_WORKOUT = require("../assets/images/hero-workout.png");

export default function WorkoutPlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [selected, setSelected] = useState(DUMMY_WORKOUT_PLANS[0].id);
  const plan = DUMMY_WORKOUT_PLANS.find((p) => p.id === selected) || DUMMY_WORKOUT_PLANS[0];

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Workout Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Plan Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planTabs}>
        {DUMMY_WORKOUT_PLANS.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setSelected(p.id)}
            style={[
              styles.planTab,
              {
                backgroundColor: selected === p.id ? colors.primary : colors.card,
                borderColor: selected === p.id ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.planTabText, { color: selected === p.id ? "#FFF" : colors.foreground }]}>
              {p.name}
            </Text>
            {p.isActive && <View style={[styles.activeDot, { backgroundColor: selected === p.id ? "#FFF" : colors.success }]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plan Hero Banner */}
      <ImageBackground
        source={HERO_WORKOUT}
        style={styles.heroCard}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          <View style={styles.overviewHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planGoal}>{plan.goal}</Text>
            </View>
            {plan.isActive && <Badge label="Active" variant="success" />}
          </View>
          <View style={styles.planMeta}>
            {[
              { icon: "calendar" as const, label: plan.duration },
              { icon: "zap" as const, label: `${plan.daysPerWeek}x / week` },
              { icon: "bar-chart-2" as const, label: plan.level },
            ].map((m) => (
              <View key={m.label} style={styles.planMetaItem}>
                <Feather name={m.icon} size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.planMetaText}>{m.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.trainerRow, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
            <Feather name="user" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.trainerText}>Trainer: {plan.trainer}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Exercises */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Exercises ({plan.exercises.length})
      </Text>
      {plan.exercises.map((ex, i) => (
        <Card key={i} style={styles.exCard}>
          <View style={styles.exRow}>
            <View style={[styles.exNum, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.exNumText, { color: colors.primary }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.exName, { color: colors.foreground }]}>{ex.name}</Text>
              <View style={styles.exMeta}>
                <View style={[styles.exBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.exBadgeText, { color: colors.mutedForeground }]}>{ex.sets} sets</Text>
                </View>
                <View style={[styles.exBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.exBadgeText, { color: colors.mutedForeground }]}>{ex.reps} reps</Text>
                </View>
                <View style={[styles.exBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.exBadgeText, { color: colors.mutedForeground }]}>Rest {ex.rest}</Text>
                </View>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  planTabs: { marginBottom: 16 },
  planTab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, borderWidth: 1.5 },
  planTabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  heroCard: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  heroImage: { borderRadius: 16 },
  heroOverlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 20,
  },
  overviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  planName: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 22 },
  planGoal: { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 4 },
  planMeta: { flexDirection: "row", gap: 16, marginBottom: 16 },
  planMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  planMetaText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 13 },
  trainerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  trainerText: { color: "#FFF", fontFamily: "Inter_500Medium", fontSize: 13 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 14 },
  exCard: { marginBottom: 10 },
  exRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  exNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  exNumText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  exName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  exMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  exBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  exBadgeText: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
