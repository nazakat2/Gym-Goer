import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DUMMY_PAYMENTS } from "@/utils/dummyData";
import { formatDate, formatCurrency } from "@/utils/helpers";

const TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Membership: "star",
  "Personal Training": "user",
};

export default function PaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const total = DUMMY_PAYMENTS.reduce((s, p) => s + p.amount, 0);

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Payment History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      <Card style={[styles.summaryCard, { backgroundColor: colors.primary, borderWidth: 0 }]}>
        <Text style={styles.summaryLabel}>Total Spent (All Time)</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemValue}>{DUMMY_PAYMENTS.length}</Text>
            <Text style={styles.summaryItemLabel}>Transactions</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemValue}>{formatCurrency(DUMMY_PAYMENTS[0].amount)}</Text>
            <Text style={styles.summaryItemLabel}>Last Payment</Text>
          </View>
          <View style={[styles.summaryDivider]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemValue}>{formatDate(DUMMY_PAYMENTS[0].date)}</Text>
            <Text style={styles.summaryItemLabel}>Last Date</Text>
          </View>
        </View>
      </Card>

      {/* Payment List */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transactions</Text>
      {DUMMY_PAYMENTS.map((p) => (
        <Card key={p.id} style={styles.payCard}>
          <View style={styles.payRow}>
            <View style={[styles.payIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name={TYPE_ICONS[p.type] || "credit-card"} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.payDesc, { color: colors.foreground }]}>{p.description}</Text>
              <Text style={[styles.payMethod, { color: colors.mutedForeground }]}>{p.method}</Text>
              <Text style={[styles.payDate, { color: colors.mutedForeground }]}>{formatDate(p.date)}</Text>
            </View>
            <View style={styles.payRight}>
              <Text style={[styles.payAmount, { color: colors.foreground }]}>{formatCurrency(p.amount)}</Text>
              <Badge label={p.status} variant="success" />
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  summaryCard: { padding: 20, marginBottom: 24 },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 14 },
  summaryAmount: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 36, marginVertical: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryItemValue: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 15 },
  summaryItemLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 14 },
  payCard: { marginBottom: 10 },
  payRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  payIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  payDesc: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  payMethod: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  payDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  payRight: { alignItems: "flex-end", gap: 6 },
  payAmount: { fontFamily: "Inter_700Bold", fontSize: 17 },
});
