import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    icon: "zap" as const,
    title: "Train Smarter",
    description:
      "Access personalized workout plans crafted by expert trainers to help you reach your goals faster.",
    color: "#E31C25",
  },
  {
    id: "2",
    icon: "calendar" as const,
    title: "Book Classes",
    description:
      "Reserve your spot in top fitness classes — yoga, HIIT, spin, boxing — all at your fingertips.",
    color: "#FF6B35",
  },
  {
    id: "3",
    icon: "trending-up" as const,
    title: "Track Progress",
    description:
      "Monitor your transformation with detailed metrics, charts, and milestone achievements.",
    color: "#22C55E",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const ref = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const next = () => {
    if (current < slides.length - 1) {
      ref.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      router.replace("/login");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={[styles.skip, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={ref}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + "15" }]}>
              <View style={[styles.iconInner, { backgroundColor: item.color }]}>
                <Feather name={item.icon} size={48} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: botPad + 24 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === current ? colors.primary : colors.border,
                  width: i === current ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <Button
          title={current === slides.length - 1 ? "Get Started" : "Next"}
          onPress={next}
          size="lg"
        />
        {current === slides.length - 1 && (
          <TouchableOpacity onPress={() => router.replace("/login")} style={{ marginTop: 12 }}>
            <Text style={[styles.loginLink, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  skip: { fontFamily: "Inter_500Medium", fontSize: 16 },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    textAlign: "center",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  loginLink: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
