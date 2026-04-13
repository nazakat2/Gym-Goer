import { router } from "expo-router";
import React, { useState } from "react";
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DUMMY_DIET_PLANS } from "@/utils/dummyData";

const HERO_DIET = require("../assets/images/hero-diet.png");

export default function DietPlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const plan = DUMMY_DIET_PLANS[0];

  const macros = [
    { label: "Protein", value: plan.protein, max: 200, unit: "g", color: "#E31C25" },
    { label: "Carbs", value: plan.carbs, max: 400, unit: "g", color: "#FF6B35" },
    { label: "Fat", value: plan.fat, max: 100, unit: "g", color: "#F59E0B" },
  ];

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Diet Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Overview Hero */}
      <ImageBackground
        source={HERO_DIET}
        style={styles.heroBanner}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{plan.name}</Text>
              <Text style={styles.heroGoal}>{plan.goal}</Text>
            </View>
            {plan.isActive && <Badge label="Active" variant="success" />}
          </View>
          <View style={[styles.calRow, { backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 12 }]}>
            <Feather name="zap" size={28} color="#FFD700" />
            <View>
              <Text style={styles.calValue}>{plan.calories}</Text>
              <Text style={styles.calLabel}>Daily Calories</Text>
            </View>
            <View style={styles.dietitianRow}>
              <Feather name="user" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.dietitianText}>{plan.dietitian}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Macros */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Macronutrients</Text>
      <Card>
        {macros.map((m, i) => (
          <View key={m.label} style={[styles.macroRow, i > 0 && { marginTop: 16 }]}>
            <View style={styles.macroLabel}>
              <View style={[styles.macroColorDot, { backgroundColor: m.color }]} />
              <Text style={[styles.macroName, { color: colors.foreground }]}>{m.label}</Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <ProgressBar progress={m.value / m.max} color={m.color} height={8} />
            </View>
            <Text style={[styles.macroValue, { color: colors.foreground }]}>{m.value}{m.unit}</Text>
          </View>
        ))}
      </Card>

      {/* Meals */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Meals</Text>
      {plan.meals.map((meal, i) => (
        <Card key={i} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View style={[styles.mealTimeBox, { backgroundColor: colors.primary + "15", borderRadius: 8 }]}>
              <Text style={[styles.mealTime, { color: colors.primary }]}>{meal.time}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mealType, { color: colors.foreground }]}>{meal.type}</Text>
              <Text style={[styles.mealCals, { color: colors.mutedForeground }]}>{meal.calories} kcal</Text>
            </View>
            <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
          </View>
          <View style={[styles.mealDivider, { backgroundColor: colors.border }]} />
          {meal.items.map((item, j) => (
            <View key={j} style={styles.mealItem}>
              <View style={[styles.mealItemDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.mealItemText, { color: colors.foreground }]}>{item}</Text>
            </View>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  heroBanner: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  heroImage: { borderRadius: 16 },
  heroOverlay: { backgroundColor: "rgba(0,0,0,0.58)", padding: 20 },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  heroTitle: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 22 },
  heroGoal: { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 4 },
  calRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  calValue: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 28 },
  calLabel: { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", fontSize: 13 },
  dietitianRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, justifyContent: "flex-end" },
  dietitianText: { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", fontSize: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 14 },
  macroRow: { flexDirection: "row", alignItems: "center" },
  macroLabel: { flexDirection: "row", alignItems: "center", gap: 8, width: 70 },
  macroColorDot: { width: 10, height: 10, borderRadius: 5 },
  macroName: { fontFamily: "Inter_500Medium", fontSize: 14 },
  macroValue: { fontFamily: "Inter_700Bold", fontSize: 14, width: 50, textAlign: "right" },
  mealCard: { marginBottom: 10 },
  mealHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  mealTimeBox: { padding: 8, alignItems: "center", minWidth: 72 },
  mealTime: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  mealType: { fontFamily: "Inter_700Bold", fontSize: 16 },
  mealCals: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  mealDivider: { height: 1, marginVertical: 12 },
  mealItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  mealItemDot: { width: 5, height: 5, borderRadius: 3 },
  mealItemText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
});
