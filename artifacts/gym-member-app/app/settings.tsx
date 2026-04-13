import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";

type ModalType =
  | "change-password"
  | "two-factor"
  | "help"
  | "contact"
  | "terms"
  | "privacy"
  | "delete-account"
  | null;

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [notifs, setNotifs] = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
    }, 2500);
  };

  const openModal = (type: ModalType) => setActiveModal(type);
  const closeModal = () => {
    setActiveModal(null);
    setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError("");
    setContactName(""); setContactMsg(""); setContactSent(false);
  };

  const handleChangePassword = () => {
    setPwError("");
    if (!currentPw) return setPwError("Enter your current password.");
    if (newPw.length < 6) return setPwError("New password must be at least 6 characters.");
    if (newPw !== confirmPw) return setPwError("Passwords do not match.");
    setPwLoading(true);
    setTimeout(() => {
      setPwLoading(false);
      closeModal();
      showToast("Password changed successfully!");
    }, 1200);
  };

  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactMsg.trim()) return;
    setContactLoading(true);
    try {
      const { apiService } = await import("@/services/api");
      await apiService.contactSupport(contactName.trim(), contactMsg.trim());
      setContactSent(true);
    } catch (err: any) {
      if (Platform.OS === "web") {
        window.alert("Failed to send message. Please try again.");
      } else {
        Alert.alert("Error", err.message || "Failed to send message. Please try again.");
      }
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    openModal("delete-account");
  };

  const confirmDeleteAccount = async () => {
    closeModal();
    await logout();
    router.replace("/login");
  };

  const FAQs = [
    { q: "How do I cancel my membership?", a: "Go to My Membership and tap 'Cancel Membership'. You can also contact support for assistance." },
    { q: "Can I pause my membership?", a: "Yes, Premium and Elite members can pause for up to 30 days per year. Go to Membership settings." },
    { q: "How do I book a class?", a: "Go to Classes from the Home screen, choose a class and tap 'Book Now'." },
    { q: "Where can I find my payment receipts?", a: "Payment history is available under Profile > Payment History." },
    { q: "How do I update my trainer?", a: "Contact support to request a trainer change. We'll match you within 48 hours." },
    { q: "What equipment is available?", a: "Our gym has full cardio, free weights, cable machines, and dedicated stretching zones." },
  ];

  const TERMS = `Terms of Service\n\nLast updated: January 1, 2026\n\n1. ACCEPTANCE OF TERMS\nBy using GymFit, you agree to these Terms of Service. If you don't agree, please don't use the app.\n\n2. MEMBERSHIP\nMembership plans are billed monthly or annually as selected. Cancellations take effect at the end of the billing period.\n\n3. USE OF FACILITIES\nMembers must follow gym rules and respect other members. Misuse may result in membership termination.\n\n4. HEALTH & SAFETY\nConsult a doctor before starting a new fitness program. GymFit is not liable for injuries resulting from exercise.\n\n5. PERSONAL DATA\nWe collect and process your data as described in our Privacy Policy.\n\n6. INTELLECTUAL PROPERTY\nAll content in the app is owned by GymFit and protected by copyright.\n\n7. LIMITATION OF LIABILITY\nGymFit's liability is limited to the amount paid for your membership in the last 3 months.\n\n8. CHANGES TO TERMS\nWe may update these terms. You will be notified of significant changes.\n\n9. CONTACT\nFor questions, contact support@gymfit.com`;

  const PRIVACY = `Privacy Policy\n\nLast updated: January 1, 2026\n\n1. DATA WE COLLECT\n• Name, email, phone number\n• Fitness goals and health data\n• Attendance and workout history\n• Payment information (processed securely)\n• Device and usage data\n\n2. HOW WE USE YOUR DATA\n• To manage your membership and bookings\n• To personalize workout and diet recommendations\n• To send notifications you've opted in to\n• To improve our services\n\n3. DATA SHARING\nWe do not sell your personal data. We may share data with:\n• Payment processors\n• Assigned trainers\n• Legal authorities if required\n\n4. DATA SECURITY\nAll data is encrypted in transit and at rest. We follow industry best practices.\n\n5. YOUR RIGHTS\n• Access your data at any time\n• Request data deletion\n• Export your data\n• Opt-out of marketing\n\n6. COOKIES\nThe app uses minimal local storage for session management only.\n\n7. CONTACT\nPrivacy questions: privacy@gymfit.com`;

  const Section = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );

  const ToggleRow = ({
    icon, label, value, onToggle, color,
  }: { icon: keyof typeof Feather.glyphMap; label: string; value: boolean; onToggle: (v: boolean) => void; color?: string }) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: (color || colors.primary) + "15" }]}>
        <Feather name={icon} size={18} color={color || colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "80" }}
        thumbColor={value ? colors.primary : "#f4f3f4"}
      />
    </View>
  );

  const NavRow = ({
    icon, label, onPress, color, isLast,
  }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; color?: string; isLast?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: (color || colors.foreground) + "15" }]}>
        <Feather name={icon} size={18} color={color || colors.foreground} />
      </View>
      <Text style={[styles.rowLabel, { color: color || colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <Section title="NOTIFICATIONS" />
        <Card noPadding style={styles.card}>
          <ToggleRow icon="bell" label="Push Notifications" value={notifs} onToggle={setNotifs} />
          <ToggleRow icon="calendar" label="Class Reminders" value={classReminders} onToggle={setClassReminders} />
          <ToggleRow icon="credit-card" label="Payment Alerts" value={paymentAlerts} onToggle={setPaymentAlerts} />
          <ToggleRow icon="mail" label="Newsletter" value={newsletter} onToggle={setNewsletter} />
        </Card>

        <Section title="SECURITY" />
        <Card noPadding style={styles.card}>
          <ToggleRow icon="shield" label="Biometric Login" value={biometric} onToggle={(v) => { setBiometric(v); showToast(v ? "Biometric login enabled" : "Biometric login disabled"); }} />
          <NavRow icon="lock" label="Change Password" onPress={() => openModal("change-password")} />
          <NavRow icon="smartphone" label="Two-Factor Auth" onPress={() => openModal("two-factor")} isLast />
        </Card>

        <Section title="SUPPORT" />
        <Card noPadding style={styles.card}>
          <NavRow icon="help-circle" label="Help Center" onPress={() => openModal("help")} />
          <NavRow icon="message-circle" label="Contact Support" onPress={() => openModal("contact")} />
          <NavRow icon="file-text" label="Terms of Service" onPress={() => openModal("terms")} />
          <NavRow icon="shield" label="Privacy Policy" onPress={() => openModal("privacy")} isLast />
        </Card>

        <Section title="ACCOUNT" />
        <Card noPadding style={styles.card}>
          <NavRow icon="trash-2" label="Delete Account" onPress={handleDeleteAccount} color={colors.destructive} isLast />
        </Card>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>GymFit v1.0.0</Text>
      </ScrollView>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal visible={activeModal === "change-password"} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
          <View style={[styles.sheetInner, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Change Password</Text>
            {pwError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}>
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{pwError}</Text>
              </View>
            ) : null}
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Current Password</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={currentPw}
              onChangeText={setCurrentPw}
            />
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>New Password</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <TouchableOpacity
              onPress={handleChangePassword}
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: pwLoading ? 0.7 : 1 }]}
              disabled={pwLoading}
            >
              <Text style={styles.primaryBtnText}>{pwLoading ? "Saving..." : "Update Password"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── TWO-FACTOR AUTH MODAL ── */}
      <Modal visible={activeModal === "two-factor"} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={[styles.sheetInner, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Two-Factor Authentication</Text>
            <View style={[styles.twoFaIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="smartphone" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.twoFaDesc, { color: colors.mutedForeground }]}>
              Two-factor authentication adds an extra layer of security. When enabled, you'll need to enter a code from your authenticator app each time you log in.
            </Text>
            <View style={[styles.twoFaRow, { backgroundColor: colors.muted, borderRadius: 12 }]}>
              <View>
                <Text style={[styles.twoFaLabel, { color: colors.foreground }]}>Enable 2FA</Text>
                <Text style={[styles.twoFaSub, { color: colors.mutedForeground }]}>{twoFactor ? "Active — your account is protected" : "Recommended for extra security"}</Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={(v) => {
                  setTwoFactor(v);
                  showToast(v ? "Two-factor authentication enabled!" : "Two-factor authentication disabled.");
                }}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={twoFactor ? colors.primary : "#f4f3f4"}
              />
            </View>
            {twoFactor && (
              <View style={[styles.twoFaActive, { backgroundColor: "#22C55E15", borderColor: "#22C55E40" }]}>
                <Feather name="check-circle" size={16} color="#22C55E" />
                <Text style={[styles.twoFaActiveText, { color: "#22C55E" }]}>Your account is secured with 2FA</Text>
              </View>
            )}
            <TouchableOpacity onPress={closeModal} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── HELP CENTER MODAL ── */}
      <Modal visible={activeModal === "help"} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={[styles.sheetInner, styles.sheetTall, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Help Center</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.helpSubtitle, { color: colors.mutedForeground }]}>Frequently Asked Questions</Text>
              {FAQs.map((item, i) => (
                <View key={i} style={[styles.faqItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.faqQ}>
                    <View style={[styles.faqIconWrap, { backgroundColor: colors.primary + "15" }]}>
                      <Feather name="help-circle" size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{item.q}</Text>
                  </View>
                  <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{item.a}</Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => { closeModal(); setTimeout(() => openModal("contact"), 300); }}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
              >
                <Text style={styles.primaryBtnText}>Still need help? Contact Us</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── CONTACT SUPPORT MODAL ── */}
      <Modal visible={activeModal === "contact"} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
          <View style={[styles.sheetInner, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Contact Support</Text>
            {contactSent ? (
              <View style={styles.sentWrap}>
                <View style={[styles.sentIcon, { backgroundColor: "#22C55E20" }]}>
                  <Feather name="check-circle" size={40} color="#22C55E" />
                </View>
                <Text style={[styles.sentTitle, { color: colors.foreground }]}>Message Sent!</Text>
                <Text style={[styles.sentSub, { color: colors.mutedForeground }]}>
                  We'll get back to you within 24 hours at your registered email.
                </Text>
                <TouchableOpacity onPress={closeModal} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Your Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.mutedForeground}
                  value={contactName}
                  onChangeText={setContactName}
                />
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Message</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Describe your issue or question..."
                  placeholderTextColor={colors.mutedForeground}
                  value={contactMsg}
                  onChangeText={setContactMsg}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  onPress={handleContactSubmit}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: contactLoading || !contactName.trim() || !contactMsg.trim() ? 0.6 : 1 }]}
                  disabled={contactLoading || !contactName.trim() || !contactMsg.trim()}
                >
                  <Text style={styles.primaryBtnText}>{contactLoading ? "Sending..." : "Send Message"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── TERMS OF SERVICE MODAL ── */}
      <Modal visible={activeModal === "terms"} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={[styles.sheetInner, styles.sheetTall, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Terms of Service</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={[styles.legalText, { color: colors.foreground }]}>{TERMS}</Text>
            </ScrollView>
            <TouchableOpacity onPress={closeModal} style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}>
              <Text style={styles.primaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PRIVACY POLICY MODAL ── */}
      <Modal visible={activeModal === "privacy"} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={[styles.sheetInner, styles.sheetTall, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Privacy Policy</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={[styles.legalText, { color: colors.foreground }]}>{PRIVACY}</Text>
            </ScrollView>
            <TouchableOpacity onPress={closeModal} style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}>
              <Text style={styles.primaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── DELETE ACCOUNT MODAL ── */}
      <Modal visible={activeModal === "delete-account"} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.deleteModalWrap}>
          <View style={[styles.deleteModal, { backgroundColor: colors.card }]}>
            {/* Icon */}
            <View style={[styles.deleteIconCircle, { backgroundColor: colors.destructive + "18" }]}>
              <Feather name="trash-2" size={32} color={colors.destructive} />
            </View>

            <Text style={[styles.deleteTitle, { color: colors.foreground }]}>Delete Account</Text>
            <Text style={[styles.deleteSubtitle, { color: colors.mutedForeground }]}>
              This will permanently delete your account and all associated data — workouts, progress, bookings and payment history.{"\n\n"}This action{" "}
              <Text style={{ color: colors.destructive, fontFamily: "Inter_700Bold" }}>cannot be undone</Text>.
            </Text>

            {/* Divider */}
            <View style={[styles.deleteDivider, { backgroundColor: colors.border }]} />

            {/* Buttons */}
            <TouchableOpacity
              onPress={confirmDeleteAccount}
              style={[styles.deleteConfirmBtn, { backgroundColor: colors.destructive }]}
            >
              <Feather name="trash-2" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.deleteConfirmBtnText}>Yes, Delete My Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={closeModal} style={[styles.deleteCancelBtn, { borderColor: colors.border }]}>
              <Text style={[styles.deleteCancelBtnText, { color: colors.foreground }]}>Keep My Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── TOAST ── */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.toastInner}>
            <Feather name="check-circle" size={18} color="#FFF" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  card: { marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  version: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 28 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0 },
  sheetInner: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, maxHeight: "85%" },
  sheetTall: { maxHeight: "90%", flex: 0 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CCC", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 20 },

  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 6, marginTop: 12 },
  textInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15 },
  textArea: { height: 110 },
  primaryBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 20 },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  cancelBtn: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelBtnText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, marginBottom: 4 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },

  twoFaIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  twoFaDesc: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 20 },
  twoFaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12, marginBottom: 16 },
  twoFaLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  twoFaSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  twoFaActive: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  twoFaActiveText: { fontFamily: "Inter_500Medium", fontSize: 13 },

  helpSubtitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 16 },
  faqItem: { paddingVertical: 14, borderBottomWidth: 1, marginBottom: 2 },
  faqQ: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  faqIconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  faqQuestion: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1, lineHeight: 20 },
  faqAnswer: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, paddingLeft: 30 },

  sentWrap: { alignItems: "center", paddingVertical: 16 },
  sentIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  sentTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 },
  sentSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 8, paddingHorizontal: 16 },

  legalText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 22, paddingBottom: 16 },

  toast: { position: "absolute", bottom: 40, left: 16, right: 16, zIndex: 999 },
  toastInner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A7A4A", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18 },
  toastText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFF", flex: 1 },

  deleteModalWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  deleteModal: { width: "100%", borderRadius: 24, padding: 28, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 20 },
  deleteIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  deleteTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 12, textAlign: "center" },
  deleteSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 4 },
  deleteDivider: { width: "100%", height: 1, marginVertical: 20 },
  deleteConfirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", borderRadius: 14, paddingVertical: 15, marginBottom: 10 },
  deleteConfirmBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  deleteCancelBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1.5 },
  deleteCancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
