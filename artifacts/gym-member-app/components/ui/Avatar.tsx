import React from "react";
import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getInitials } from "@/utils/helpers";

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ name, uri, size = 48, style }: AvatarProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary + "20",
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initials, { color: colors.primary, fontSize: size * 0.35 }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontFamily: "Inter_700Bold",
  },
});
