export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getDayName(dateStr: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(dateStr).getDay()];
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calcProgress(enrolled: number, capacity: number): number {
  return capacity > 0 ? enrolled / capacity : 0;
}
