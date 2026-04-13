import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, action, onAction }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={36} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>{description}</Text>
      )}
      {action && onAction && (
        <Button title={action} onPress={onAction} fullWidth={false} style={{ paddingHorizontal: 32 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 48, gap: 12 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
});
