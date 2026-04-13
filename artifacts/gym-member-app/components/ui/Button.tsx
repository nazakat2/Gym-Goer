import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColor =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
      ? colors.destructive
      : variant === "secondary"
      ? colors.secondary
      : "transparent";

  const textColor =
    variant === "primary" || variant === "danger"
      ? "#FFFFFF"
      : variant === "secondary"
      ? colors.secondaryForeground
      : variant === "outline"
      ? colors.primary
      : colors.mutedForeground;

  const borderColor = variant === "outline" ? colors.primary : "transparent";

  const paddingV = size === "sm" ? 10 : size === "lg" ? 18 : 14;
  const fontSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          paddingVertical: paddingV,
          borderRadius: colors.radius,
          opacity: pressed || disabled ? 0.75 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor, fontSize }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
