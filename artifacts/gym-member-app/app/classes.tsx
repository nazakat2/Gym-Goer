import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiService } from "@/services/api";
import { calcProgress, formatDate } from "@/utils/helpers";

const CATEGORIES = ["All", "HIIT", "Yoga", "Cardio", "Strength", "Other"];

export default function ClassesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [category, setCategory] = useState("All");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await apiService.getClasses();
      setClasses(data);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = category === "All" ? classes : classes.filter((c) => c.category === category);

  const handleBook = async (cls: any) => {
    if (cls.enrolled >= cls.capacity && !cls.isBooked) {
      if (Platform.OS !== "web") {
        Alert.alert("Class Full", "This class is fully booked.");
      }
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      if (cls.isBooked && cls.bookingId) {
        await apiService.cancelBooking(String(cls.bookingId));
      } else {
        await apiService.bookClass(String(cls.id));
      }
      await loadClasses();
    } catch (e: any) {
      if (Platform.OS !== "web") Alert.alert("Error", e.message || "Could not process booking");
    }
  };

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Class Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={[
              styles.catBtn,
              {
                backgroundColor: cat === category ? colors.primary : colors.card,
                borderColor: cat === category ? colors.primary : colors.border,
                borderRadius: 99,
              },
            ]}
          >
            <Text style={[styles.catText, { color: cat === category ? "#FFF" : colors.foreground }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, marginTop: 12 }]}>Loading classes...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <Feather name="calendar" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, marginTop: 12 }]}>No classes available</Text>
        </View>
      ) : (
        filtered.map((cls) => {
          const progress = calcProgress(cls.enrolled, cls.capacity);
          const isFull = cls.enrolled >= cls.capacity;
          return (
            <Card key={cls.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.className, { color: colors.foreground }]}>{cls.name}</Text>
                  <Text style={[styles.classInstructor, { color: colors.mutedForeground }]}>
                    {cls.instructor}
                  </Text>
                </View>
                <Badge
                  label={cls.category}
                  variant={cls.category === "HIIT" ? "danger" : cls.category === "Yoga" ? "primary" : "muted"}
                />
              </View>

              <View style={[styles.classDivider, { backgroundColor: colors.border }]} />

              <View style={styles.classMeta}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(cls.date)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{cls.time} • {cls.duration}min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{cls.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="bar-chart-2" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{cls.level}</Text>
                </View>
              </View>

              <View style={styles.capacityRow}>
                <Text style={[styles.capacityText, { color: colors.mutedForeground }]}>
                  {cls.enrolled}/{cls.capacity} spots
                </Text>
                <Text style={[styles.capacityText, { color: isFull ? colors.destructive : colors.success }]}>
                  {isFull ? "Full" : `${cls.capacity - cls.enrolled} left`}
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                color={isFull ? colors.destructive : progress > 0.7 ? colors.warning : colors.success}
                style={{ marginBottom: 12 }}
              />

              <TouchableOpacity
                onPress={() => handleBook(cls)}
                disabled={isFull && !cls.isBooked}
                style={[
                  styles.bookBtn,
                  {
                    backgroundColor: cls.isBooked ? colors.muted : isFull ? colors.muted : colors.primary,
                    borderRadius: colors.radius,
                    opacity: isFull && !cls.isBooked ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.bookBtnText, { color: cls.isBooked ? colors.foreground : "#FFF" }]}>
                  {cls.isBooked ? "Cancel Booking" : isFull ? "Class Full" : "Book Class"}
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  catRow: { marginBottom: 20 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1.5 },
  catText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  classCard: { marginBottom: 12 },
  classHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 12 },
  className: { fontFamily: "Inter_700Bold", fontSize: 17 },
  classInstructor: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  classDivider: { height: 1, marginBottom: 12 },
  classMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  capacityRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  capacityText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  bookBtn: { paddingVertical: 12, alignItems: "center" },
  bookBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" },
});
