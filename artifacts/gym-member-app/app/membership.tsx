import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DUMMY_MEMBERSHIP } from "@/utils/dummyData";
import { formatDate, getDaysUntil } from "@/utils/helpers";

export default function MembershipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const daysLeft = getDaysUntil(DUMMY_MEMBERSHIP.endDate);
  const totalDays = 365;
  const usedDays = totalDays - daysLeft;
  const progress = usedDays / totalDays;

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>My Membership</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Card */}
      <Card style={[styles.mainCard, { backgroundColor: colors.primary, borderWidth: 0 }]}>
        <View style={styles.mainCardHeader}>
          <View>
            <Text style={styles.cardMemberLabel}>Member Since</Text>
            <Text style={styles.cardMemberDate}>{formatDate(DUMMY_MEMBERSHIP.startDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <View style={[styles.statusDot, { backgroundColor: "#4ADE80" }]} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        <Text style={styles.planType}>{DUMMY_MEMBERSHIP.type} Plan</Text>
        <Text style={styles.planPrice}>${DUMMY_MEMBERSHIP.price}/month</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Membership Period</Text>
            <Text style={styles.progressLabel}>{daysLeft} days left</Text>
          </View>
          <ProgressBar progress={progress} color="rgba(255,255,255,0.6)" height={8} />
          <View style={styles.progressDates}>
            <Text style={styles.progressDate}>{formatDate(DUMMY_MEMBERSHIP.startDate)}</Text>
            <Text style={styles.progressDate}>{formatDate(DUMMY_MEMBERSHIP.endDate)}</Text>
          </View>
        </View>
      </Card>

      {/* Features */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Plan Features</Text>
      <Card>
        {DUMMY_MEMBERSHIP.features.map((f, i) => (
          <View key={i} style={[styles.featureRow, i < DUMMY_MEMBERSHIP.features.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.success + "20" }]}>
              <Feather name="check" size={14} color={colors.success} />
            </View>
            <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
          </View>
        ))}
      </Card>

      {/* Billing Info */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Billing</Text>
      <Card>
        <View style={styles.billingRow}>
          <Text style={[styles.billingLabel, { color: colors.mutedForeground }]}>Next Billing Date</Text>
          <Text style={[styles.billingValue, { color: colors.foreground }]}>{formatDate(DUMMY_MEMBERSHIP.nextBillingDate)}</Text>
        </View>
        <View style={[styles.billingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[styles.billingLabel, { color: colors.mutedForeground }]}>Auto-Renew</Text>
          <Badge label={DUMMY_MEMBERSHIP.autoRenew ? "Enabled" : "Disabled"} variant={DUMMY_MEMBERSHIP.autoRenew ? "success" : "muted"} />
        </View>
        <View style={[styles.billingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={[styles.billingLabel, { color: colors.mutedForeground }]}>Amount</Text>
          <Text style={[styles.billingValue, { color: colors.foreground }]}>${DUMMY_MEMBERSHIP.price}/mo</Text>
        </View>
      </Card>

      <Button title="Upgrade Plan" onPress={() => {}} variant="primary" size="lg" style={{ marginTop: 8 }} />
      <Button title="Cancel Membership" onPress={() => {}} variant="outline" size="lg" style={{ marginTop: 12, marginBottom: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  mainCard: { marginBottom: 24, padding: 20 },
  mainCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardMemberLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 12 },
  cardMemberDate: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  planType: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 28 },
  planPrice: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 16, marginBottom: 20 },
  progressSection: { gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 12 },
  progressDates: { flexDirection: "row", justifyContent: "space-between" },
  progressDate: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 11 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12, marginTop: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  featureIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 },
  billingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  billingLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  billingValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
