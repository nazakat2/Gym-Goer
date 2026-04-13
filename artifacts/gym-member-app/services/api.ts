import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    method: string = "GET",
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>("/auth/login", "POST", { email, password });
  }

  async sendSignupOtp(name: string, email: string, password: string, phone: string) {
    return this.request("/auth/send-signup-otp", "POST", { name, email, password, phone });
  }

  async signup(name: string, email: string, password: string, phone: string, otp?: string) {
    return this.request<{ token: string; user: any }>("/auth/signup", "POST", { name, email, password, phone, otp });
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", "POST", { email });
  }

  async verifyResetCode(email: string, code: string) {
    return this.request("/auth/verify-reset-code", "POST", { email, code });
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return this.request("/auth/reset-password", "POST", { email, code, newPassword });
  }

  // Profile
  async getProfile() {
    return this.request<any>("/profile");
  }

  async updateProfile(data: any) {
    return this.request<any>("/profile", "PUT", data);
  }

  async getAvatar() {
    return this.request<{ avatar: string }>("/profile/avatar");
  }

  // Membership
  async getMembership() {
    return this.request<any>("/membership");
  }

  // Attendance
  async getAttendance(month?: string) {
    const q = month ? `?month=${month}` : "";
    return this.request<any[]>(`/attendance${q}`);
  }

  async checkIn() {
    return this.request("/attendance/checkin", "POST");
  }

  // Workout Plans
  async getWorkoutPlans() {
    return this.request<any[]>("/workout-plans");
  }

  async getWorkoutPlan(id: string) {
    return this.request<any>(`/workout-plans/${id}`);
  }

  // Diet Plans
  async getDietPlans() {
    return this.request<any[]>("/diet-plans");
  }

  async getDietPlan(id: string) {
    return this.request<any>(`/diet-plans/${id}`);
  }

  // Classes
  async getClasses() {
    return this.request<any[]>("/classes");
  }

  async bookClass(classId: string) {
    return this.request("/classes/book", "POST", { classId });
  }

  async cancelBooking(bookingId: string) {
    return this.request(`/classes/bookings/${bookingId}`, "DELETE");
  }

  async getMyBookings() {
    return this.request<any[]>("/classes/bookings");
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>("/notifications");
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, "PUT");
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/read-all", "PUT");
  }

  // Progress
  async getProgress() {
    return this.request<any[]>("/progress");
  }

  async addProgress(data: any) {
    return this.request("/progress", "POST", data);
  }

  // Payments
  async getPayments() {
    return this.request<any[]>("/payments");
  }

  // Messages / Trainer
  async getMessages() {
    return this.request<any[]>("/messages");
  }

  async sendMessage(trainerId: string, message: string) {
    return this.request("/messages", "POST", { trainerId, message });
  }

  async contactSupport(name: string, message: string) {
    return this.request("/support/contact", "POST", { name, message });
  }
}

export const apiService = new ApiService();
