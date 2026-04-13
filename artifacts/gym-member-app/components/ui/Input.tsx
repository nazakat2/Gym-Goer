import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : focused ? colors.primary : colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.mutedForeground}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={secure}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.rightIcon}
          >
            <Feather
              name={secure ? "eye" : "eye-off"}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Feather name={rightIcon} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
  },
  rightIcon: {
    padding: 4,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
});
