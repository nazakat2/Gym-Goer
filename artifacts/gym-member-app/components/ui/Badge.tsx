import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BadgeProps {
  label: string;
  variant?: "primary" | "success" | "warning" | "danger" | "muted";
  style?: ViewStyle;
}

export function Badge({ label, variant = "primary", style }: BadgeProps) {
  const colors = useColors();

  const bgMap = {
    primary: colors.primary + "20",
    success: colors.success + "20",
    warning: colors.warning + "20",
    danger: colors.destructive + "20",
    muted: colors.muted,
  };

  const textMap = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    muted: colors.mutedForeground,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant], borderRadius: 99 }, style]}>
      <Text style={[styles.label, { color: textMap[variant] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
