import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, color, style }: StatCardProps) {
  const colors = useColors();
  const tintColor = color || colors.primary;

  return (
    <Card style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: tintColor + "15" }]}>
        <Feather name={icon} size={20} color={tintColor} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
});
