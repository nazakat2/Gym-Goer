import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color, height = 6, style }: ProgressBarProps) {
  const colors = useColors();
  const tint = color || colors.primary;
  const pct = Math.min(Math.max(progress, 0), 1);
  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: colors.border, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${pct * 100}%`, backgroundColor: tint, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden" },
  fill: { height: "100%" },
});
