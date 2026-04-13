# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Products

### 1. Gym Member App (Mobile)
- **Path**: `artifacts/gym-member-app/`
- **Tech**: Expo React Native
- **Theme**: Dark red `#E31C25`, dark splash `#0D0D0D`
- **Auth**: JWT (email/OTP flow), `getOrCreateUserByEmail()`
- **Email**: Nodemailer + Gmail SMTP (`mrsarimofficial@gmail.com`, `EMAIL_PASS` secret)
- **Features**: 18+ screens — splash, onboarding, auth, dashboard, workouts, diet, class booking, progress, trainer chat, profile, settings
- **Key patterns**: Web iframe — use Modals not `Alert.alert`; image picker must call `launchImageLibraryAsync()` directly from tap handler

### 2. Gym Management System (Admin Panel)
- **Path**: `artifacts/gym-admin/`
- **Tech**: React + Vite, shadcn/ui, Tailwind CSS
- **Preview**: `/gym-admin/`
- **Theme**: `#E31C25` primary on clean white/light gray admin theme
- **Modules (all functional)**:
  - Dashboard — stats cards, revenue chart, membership breakdown pie, recent activity feed
  - Members — list, add, view detail, delete; search/filter
  - Measurements — record body measurements per member
  - Attendance — daily log, manual check-in, today stats
  - Employees — list, add, edit, delete staff/trainers
  - Billing — invoice list, mark paid, create invoice
  - Inventory — products/supplements with low-stock alerts
  - Accounts & Vouchers — chart of accounts + debit/credit vouchers
  - Reports — revenue trend, attendance chart, financial summary
  - Admin Users — view system users and permissions
  - Notifications — read/mark-read with type icons
  - Business Settings — gym info, membership fees, operating hours
  - POS & Sales — full two-tab UI: POS Terminal (cart, member search, discount, 4 payment methods, receipt) + Sales History (collect payment, refunds)
  - Mobile Content — control all mobile app screens from admin (5 tabs below)
    - Announcements — banners shown on member home screen (type: info/promo/warning, active toggle)
    - Classes — full schedule management (add/edit/delete, capacity, instructor, location)
    - Workout Plans — create plans with exercises (sets/reps/rest), toggle active
    - Diet Plans — create plans with meals (macros, food items, calories per meal)
    - Onboarding Slides — edit title/subtitle/description for each of the 3 intro slides

### API Server
- **Path**: `artifacts/api-server/`
- **Routes**: `gym.ts` (member app), `gym-admin.ts` (admin panel)
- **Route order**: gymAdminRouter BEFORE gymRouter (avoids auth middleware conflicts on shared paths like /attendance)
- **DB Tables**: members, measurements, attendance, employees, invoices, suppliers, products, sales, pos_orders, pos_order_items, accounts, vouchers, admin_users, admin_notifications, business_settings, app_announcements, app_classes, app_class_bookings, app_workout_plans, app_workout_exercises, app_diet_plans, app_diet_meals, app_onboarding_slides
- **Admin content routes**: `/app-content/*` — full CRUD for all mobile app content
- **Mobile content routes**: `/announcements`, `/onboarding-slides`, `/workout-plans`, `/diet-plans`, `/classes` — serve real DB data to mobile app
- **Seed data**: 6 members, 3 employees, 2 suppliers, 5 products, 5 invoices, 7 attendance records, 5 accounts, 4 notifications, 2 admin users, 3 announcements, 5 classes, 2 workout plans (10 exercises), 2 diet plans (8 meals), 3 onboarding slides
