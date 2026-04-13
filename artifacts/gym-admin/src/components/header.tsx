import { Menu, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Activity,
  CalendarCheck,
  Briefcase,
  Receipt,
  ShoppingCart,
  Package,
  Wallet,
  Settings,
  FileBarChart,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/measurements", label: "Measurements", icon: Activity },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/employees", label: "Employees", icon: Briefcase },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/sales", label: "POS & Sales", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/users", label: "Admin Users", icon: Shield },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/business", label: "Business Settings", icon: Settings },
];

export function Header() {
  const [location] = useLocation();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 text-primary">
              <Activity className="h-6 w-6" />
              <span className="">GymAdmin</span>
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                    isActive ? "bg-muted text-foreground" : ""
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Breadcrumb or search could go here */}
      </div>
      <div className="flex items-center gap-4">
        <Link href="/notifications">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-destructive"></span>
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </Link>
        <Button variant="outline" size="icon" className="rounded-full">
          <UserCircle className="h-5 w-5" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </div>
    </header>
  );
}
