import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
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

const { width, height } = Dimensions.get("window");

const SPLASH_BG = require("../assets/images/splash-bg.png");
const HERO_WORKOUT = require("../assets/images/hero-workout.png");
const HERO_DIET = require("../assets/images/hero-diet.png");
const HERO_CLASSES = require("../assets/images/hero-classes.jpg");
const LOGO = require("../assets/images/logo.png");

const slides = [
  {
    id: "1",
    image: HERO_WORKOUT,
    icon: "zap" as const,
    title: "Train Smarter",
    description:
      "Access personalized workout plans crafted by expert trainers to help you reach your goals faster.",
    color: "#E31C25",
  },
  {
    id: "2",
    image: HERO_CLASSES,
    icon: "calendar" as const,
    title: "Book Classes",
    description:
      "Reserve your spot in top fitness classes — yoga, HIIT, spin, boxing — all at your fingertips.",
    color: "#FF6B35",
  },
  {
    id: "3",
    image: HERO_DIET,
    icon: "coffee" as const,
    title: "Eat Right",
    description:
      "Follow expert-crafted diet plans with macro tracking, meal schedules, and nutritionist guidance.",
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
    <ImageBackground source={SPLASH_BG} style={styles.bgFill} resizeMode="cover">
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.60)" }]} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.skip}>Skip</Text>
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
              {item.image ? (
                <View style={styles.heroImageWrapper}>
                  <Image
                    source={item.image}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.heroOverlay, { backgroundColor: item.color + "30" }]} />
                </View>
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: item.color + "25" }]}>
                  <View style={[styles.iconInner, { backgroundColor: item.color }]}>
                    <Feather name={item.icon} size={48} color="#FFFFFF" />
                  </View>
                </View>
              )}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
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
                    backgroundColor: i === current ? "#E31C25" : "rgba(255,255,255,0.4)",
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
              <Text style={styles.loginLink}>
                Already have an account?{" "}
                <Text style={{ color: "#E31C25", fontFamily: "Inter_600SemiBold" }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgFill: { flex: 1, width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerLogo: { width: 44, height: 44 },
  skip: { fontFamily: "Inter_500Medium", fontSize: 16, color: "rgba(255,255,255,0.75)" },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  heroImageWrapper: {
    width: Math.min(width * 0.78, 340),
    height: Math.min(width * 0.78, 340),
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    color: "#FFFFFF",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    color: "rgba(255,255,255,0.80)",
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
  loginLink: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.7)" },
});
