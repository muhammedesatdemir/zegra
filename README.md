## 🇹🇷 Turkish

For the Turkish version of this document, see [README.tr.md](README.tr.md)

---

# Vardiya Planı (Zekra)

A local-first React Native / Expo mobile application for shift workers.
The app helps a single user see, plan and edit their personal shift rotation
on a monthly calendar. All data is stored locally on the device; there is no
login, no cloud sync, and no backend.

The repository root contains planning documents and an example screenshot.
The actual application source lives in [vardiya-plani/](vardiya-plani/).

---

## Overview

**What it does**

- Shows the user's shift for today on the home screen ("am I on morning,
  evening, night or off today?") together with a 7-day preview and a small
  "smart insight" line (e.g. consecutive working days, next off day).
- Generates a month of shift assignments from a cyclic template
  (e.g. `OFF1, OFF2, 0715, 0715, 1523, 1523, 2307, 2307`) with correct
  cycle continuity across month boundaries.
- Lets the user revise an arbitrary date range either with a single shift
  or by re-applying a template.
- Lets the user manually edit a single day: change shift, override start/end
  time for that one day, add a note, and mark the day as "locked" so
  generation/revision will skip it.
- Lets the user manage program templates (4 system defaults are shipped as
  `BYG-A1`, `BYG-B1`, `BYG-C1`, `BYG-D1`; users can add, edit and delete
  templates).
- Supports light and dark theme, Turkish UI and Turkish-aware string
  handling (`i/İ/ı/I`, months, weekdays).
- Exports the current plan as a UTF-8 CSV file that opens in Excel, and
  shares it via the system share sheet (`expo-sharing`).
- Supports wiping all local data back to defaults.

**Scope**

- Single-user, single-device, offline.
- Turkish UI (labels, month/weekday names, CSV headers are in Turkish).
- Targets Android and iOS through Expo; a web target is declared in the
  Expo config but is not the primary use case.
- Explicitly not included in the current code: authentication, accounts,
  cloud sync, team management, OCR, AI/ML, or any network I/O for app data.

---

## Features

The following features are present in the source tree.

### Home screen (`app/(tabs)/index.tsx`)
- "Today's shift" hero card (`TodayShiftCard`) with formatted Turkish date.
- 7-day upcoming strip (`UpcomingDays`).
- Smart insight line (`SmartInsight`) that shows one of:
  - N consecutive working days,
  - "Next off in X days" when an off day is near,
  - "Next shift: <day label>" when today is off.
- Two quick-action buttons: go to calendar, generate a new plan.

### Calendar screen (`app/(tabs)/calendar.tsx`)
- Month grid with Turkish weekday headers (Mon-first, via a day-index
  adjustment in the grid builder).
- Previous/next month navigation and a "today" shortcut
  (`goToPreviousMonth`, `goToNextMonth`, `goToToday`).
- Each cell (`DayCell`) shows shift color and short name; tapping a cell
  navigates to the day edit screen (`/day/[date]`).
- Action footer with a "Generate" button.

### Day edit screen (`app/day/[date].tsx`)
- Validates the `date` route parameter against the ISO `YYYY-MM-DD`
  format before rendering.
- Lets the user pick a shift from the visible shift types (the internal
  `OFF1`/`OFF2` cycle variants are hidden; a single "Off" option is shown).
- Optional per-day start/end time override (`customStartTime`,
  `customEndTime`) normalized through `normalizeCustomTime`.
- Note field (free text).
- "Protected" toggle that maps to `isLocked` on the planned day.
- Delete action that removes the day from storage.

### Generate month (`app/generate.tsx`)
- Picks a target month and a start point (`month_start` or `today`).
- Range presets: this month, next 3 months, next 6 months, until year end.
- Starts from the selected template; users can preview how the template
  will look in human terms (e.g. "2 sabah, 2 öğle, 2 gece, 2 izin").
- Uses the scheduling engine's preview to show how many days will be
  generated vs. skipped (due to locked/manual protection).

### Revise range (`app/revise.tsx`)
- Select an arbitrary start/end date from an in-screen month picker.
- Two modes:
  - `single_shift`: fill the range with one shift code.
  - `from_template`: regenerate the range from a chosen template.
- Per-operation toggles for `overrideLocked` and `overrideManual`.

### Templates (`app/templates/index.tsx`, `app/templates/[id].tsx`)
- List all templates (defaults + user-created) with a friendly summary of
  their pattern and mark the active one.
- Detail screen to edit a template's name, cycle length and the ordered
  list of shift codes; also create new templates and delete user templates.

### Settings (`app/(tabs)/settings.tsx`)
- Theme toggle: Light / Dark.
- Jump to the templates screen (shows the currently active template).
- **Verileri Dışa Aktar** — generates a UTF-8 BOM CSV
  (`zekra-vardiya-YYYY-MM-DD.csv`) with columns:
  Tarih, Gün, Vardiya, Saat Başlangıç, Saat Bitiş, Not, Korumalı.
  The file is written to the app cache directory and opened through the
  OS share sheet via `expo-sharing`.
- **Tüm Verileri Sil** — confirms and calls `clearAllData()` on the
  repository, then re-seeds defaults.
- About section with version string (`1.0.0`) and credits.

### Shift types (system defaults in `src/constants/shifts.ts`)
Five user-visible shift types plus two internal OFF variants:

| Code   | Name  | Time        | Working | Overnight |
|--------|-------|-------------|---------|-----------|
| 0715   | Sabah | 07:00–15:00 | yes     | no        |
| 1523   | Öğle  | 15:00–23:00 | yes     | no        |
| 2307   | Gece  | 23:00–07:00 | yes     | yes       |
| OFF    | Off   | —           | no      | no        |
| OFF1   | Off   | —           | no      | no        |
| OFF2   | Off   | —           | no      | no        |

`OFF1` and `OFF2` are stored as distinct codes so the cycle can
differentiate between the first and second off-day in a rotation, but the
UI collapses them into a single "Off" entry (via `isOffCode`).

### Default program templates (`DEFAULT_TEMPLATES`)
All four have `cycleLength: 8`:

- **BYG-A1** — `OFF1, OFF2, 0715, 0715, 1523, 1523, 2307, 2307`
- **BYG-B1** — `2307, OFF1, OFF2, 0715, 0715, 1523, 1523, 2307`
- **BYG-C1** — `OFF2, 0715, 0715, 1523, 1523, 2307, 2307, OFF1`
- **BYG-D1** — `0715, 1523, 1523, 2307, 2307, OFF1, OFF2, 0715`

`BYG-A1` is the active template on first run.

### Scheduling engine (`src/services/schedulingEngine.ts`)
- `generateDays` — produces planned days for a date range, honouring
  `preserveLocked` and `preserveManual` protection flags.
- `generateSchedule` — wraps `generateDays` with a result object
  (`success / daysGenerated / daysSkipped / errors`).
- `calculatePhaseForNewMonth` — computes the starting cycle offset for a
  new month based on the previous day's stored `cycleIndex`, with a
  fallback that looks up the last shift code inside the template.
- `calculatePhaseForAlignment` — solves for the phase offset that would
  place a target shift code on a target date (used for onboarding-style
  alignment).
- `reviseRange` — implements the two revision modes described above,
  with per-day `overrideLocked` / `overrideManual` checks.
- `previewGeneration` / `previewRevision` — return statistics for the
  affected range without mutating storage.
- `isOvernightShiftByTime` / `formatOvernightShiftDisplay` — helpers for
  overnight shifts.

Domain rules encoded in the engine:
- Overnight shifts belong to the **start** date (e.g. a 23:00–07:00
  shift on March 3 is stored on March 3, not March 4).
- Locked days are never touched by auto operations; manual days are
  preserved by default.
- Cycle continuity across months is driven by `cycleIndex`, which is
  saved on every generated/revised day.

### Persistence (`src/repositories/`)
- `IScheduleRepository` (`types.ts`) — a fully synchronous repository
  interface covering planned days, shift types, templates, settings, and
  data management (`exportAllData`, `clearAllData`, `initializeDefaults`).
- `FileRepository` (`fileRepository.ts`) — production implementation
  using `expo-file-system` (v55 new API: `File` / `Paths`). It keeps an
  in-memory cache and writes the entire state as one JSON file at
  `Paths.document/vardiya-plani-data.json`. First access triggers a
  synchronous `file.textSync()` read so the store is already populated
  before React renders. A global-key singleton survives Metro hot reload.
- `MemoryRepository` (`memoryRepository.ts`) — a non-persistent
  implementation with the same interface, used by unit tests and
  available via `createTestRepository()`.
- `index.ts` wires `getRepository()` to `getFileRepository()` for the
  app; tests use the memory variant directly.

The stored JSON has a `version: 1` field for forward compatibility; no
migration code is currently required.

### State management (`src/stores/scheduleStore.ts`)
- Zustand store that is **hydrated synchronously at module load** from
  the file repository, so the first render already has shifts, templates,
  planned days and settings.
- Exposes CRUD actions for planned days, shift types, templates and
  settings, plus `generateMonth`, `reviseRange`, `exportData`,
  `clearAllData`, and UI navigation helpers (`goToPreviousMonth`,
  `goToNextMonth`, `goToToday`, `setSelectedDate`, `setViewMonth`).
- Selectors: `selectTodayShift`, `selectActiveTemplate`, `selectShiftType`,
  `selectViewMonthDays`.

### Theme (`src/context/ThemeContext.tsx`)
- `ThemeProvider` reads `settings.theme` from the store and exposes a
  `ThemeColors` object plus an `isDark` flag through `useTheme()`.
- Two palettes (`lightTheme`, `darkTheme`) with semantic color slots
  (background, surface, text, primary, danger, warning, etc.).

### Splash lifecycle (`src/utils/splashController.ts`, `app/_layout.tsx`)
- `preventAutoHide()` runs at module evaluation time, before React
  mounts, to freeze the native splash screen.
- The first visible screen (home) calls `notifyFirstScreenReady()` from
  its `onLayout`; one animation-frame tick later the splash is dismissed.
- A 4-second watchdog in the root layout guarantees the splash is hidden
  even if the first screen fails to signal readiness.
- `startupMark()` from `src/utils/startupTimer.ts` records named
  timestamps throughout the startup path.

### Turkish handling (`src/utils/turkish.ts`, `src/utils/date.ts`)
- `toUpperTR` / `toLowerTR` / `compareTR` use the `tr-TR` locale so
  `i/İ/ı/I` case mapping is correct.
- `includesTR` / `startsWithTR` are Turkish-aware substring/prefix
  helpers.
- `TURKISH_MONTHS`, `TURKISH_WEEKDAYS`, `TURKISH_WEEKDAYS_MONDAY_START`
  and `getMonthNameTR` / `getWeekdayNameTR` provide localized names.
- All date formatting goes through `date-fns` with the `tr` locale
  (`formatDateTR`, `formatDateShortTR`, `formatMonthYearTR`,
  `formatWeekdayTR`).

### Export format
CSV with UTF-8 BOM and Turkish-localized column headers; quoting is
applied to notes so embedded commas/quotes do not break parsing. The
filename uses the local date (not UTC) so that "today" matches the user's
timezone.

### Tests
- `src/services/schedulingEngine.test.ts` and
  `src/repositories/fileRepository.test.ts` and
  `src/utils/turkish.test.ts` are implemented with Vitest
  (`environment: 'node'`). `FileRepository` is tested against the
  in-memory path through the shared interface.

---

## Project Structure

```
zegra/
├─ README.md                        # this file
├─ README.tr.md                     # Turkish version
├─ vardiya-plani-v1-final.md        # original planning doc (Turkish)
├─ eski-planlar/                    # earlier planning drafts (Turkish)
├─ komut.txt                        # ad-hoc Expo / Gradle command notes
├─ ornek-program.jpeg               # reference screenshot
├─ Kayit1.mp4                       # demo recording
├─ Çalışma Programı 2026.xlsx       # source work schedule (Excel)
└─ vardiya-plani/                   # the application
   ├─ app/                          # expo-router routes
   │  ├─ _layout.tsx                # root Stack + theme + splash wiring
   │  ├─ (tabs)/                    # bottom-tab group
   │  │  ├─ _layout.tsx             # Home / Takvim / Ayarlar tabs
   │  │  ├─ index.tsx               # home screen
   │  │  ├─ calendar.tsx            # month calendar
   │  │  └─ settings.tsx            # settings + CSV export + wipe
   │  ├─ day/[date].tsx             # single-day edit (modal)
   │  ├─ generate.tsx               # generate a month from template
   │  ├─ revise.tsx                 # revise a date range
   │  └─ templates/
   │     ├─ index.tsx               # template list
   │     └─ [id].tsx                # template detail / edit
   ├─ src/
   │  ├─ components/
   │  │  ├─ calendar/               # CalendarHeader, Grid, DayCell, Actions
   │  │  ├─ home/                   # TodayShiftCard, UpcomingDays,
   │  │  │                          #   QuickActions, SmartInsight
   │  │  └─ ui/                     # PressableScale
   │  ├─ constants/shifts.ts        # default shift types + templates
   │  ├─ context/ThemeContext.tsx   # light/dark theme
   │  ├─ repositories/              # IScheduleRepository, File + Memory
   │  ├─ services/schedulingEngine.ts
   │  ├─ stores/scheduleStore.ts    # Zustand store (module-load hydration)
   │  ├─ types/index.ts             # domain types
   │  └─ utils/                     # date, turkish, splashController,
   │                                #   startupTimer, shiftTime
   ├─ assets/                       # icons, splash
   ├─ app.json                      # Expo config (name, icons, plugins)
   ├─ eas.json                      # EAS build profiles
   ├─ babel.config.js
   ├─ tsconfig.json                 # strict TS, @/* → src/*
   ├─ vitest.config.ts              # node env, @ alias
   ├─ package.json
   └─ android-sdk-setup-note.md     # Turkish note on Android SDK setup
```

---

## Technologies Used

Declared in [vardiya-plani/package.json](vardiya-plani/package.json):

- **Runtime / UI** — React 19.2.4, React Native 0.83.2, Expo SDK 55
  (`expo`, `expo-router`, `expo-splash-screen`, `expo-status-bar`,
  `expo-linear-gradient`, `expo-linking`, `expo-localization`,
  `expo-constants`, `expo-dev-client`).
- **Navigation** — `expo-router` (file-based, typed routes enabled via
  `experiments.typedRoutes`) and `@react-navigation/native`.
- **State** — `zustand` ^5 (single store, `scheduleStore`).
- **Persistence** — `expo-file-system` v55 using the new
  `File` / `Paths` API (`textSync` / `write`), single JSON file.
- **Dates** — `date-fns` with the Turkish (`tr`) locale.
- **Safe area / screens** — `react-native-safe-area-context`,
  `react-native-screens`.
- **Export / sharing** — `expo-sharing` for the CSV share sheet.
- **New architecture** — `newArchEnabled: true` in `app.json`.
- **Language / build** — TypeScript ~5.9 (strict, `noUncheckedIndexedAccess`,
  `baseUrl: "."`, `@/*` → `src/*`), `babel-preset-expo`.
- **Testing** — Vitest ^4 with the Node environment.
- **Distribution** — EAS Build profiles for `development`, `preview`,
  `production` (app bundle), and `production-apk` (see `eas.json`).

Android package / iOS bundle identifier: `com.vardiyaplani.app`.
Expo project ID: `9db300d9-669f-474f-98cf-4d9184605880`.

---

## Installation

All commands are run from `vardiya-plani/`.

```bash
cd vardiya-plani
npm install
```

Requirements (as declared in `eas.json` for cloud builds):
- Node 22.14.0 for EAS builds. `package.json` does not pin a Node version
  locally, but a recent LTS (18+) is expected by Expo SDK 55.
- Expo CLI is invoked through `npx expo` / `npx eas`.
- For native Android builds: Android SDK installed; see
  [vardiya-plani/android-sdk-setup-note.md](vardiya-plani/android-sdk-setup-note.md)
  (Turkish) for `local.properties` and `ANDROID_HOME` setup.

---

## Usage

Scripts declared in [vardiya-plani/package.json](vardiya-plani/package.json):

```bash
# Development
npm run start                 # expo start (Metro dev server)
npm run android               # expo run:android (local native build)
npm run ios                   # expo run:ios
npm run web                   # expo start --web

# Tests
npm run test                  # vitest (watch)
npm run test:run              # vitest run (single pass)

# EAS cloud builds
npm run build:android:preview     # internal APK
npm run build:android:prod        # Play Store app bundle
npm run build:android:prod-apk    # production APK
npm run build:ios:preview         # internal iOS
npm run build:ios:prod            # App Store iOS
npm run build:all:preview         # both platforms, preview profile
```

Basic in-app flow once launched:

1. On first start, `BYG-A1` is the active template and there are no
   planned days; the home screen shows the "create plan" CTA.
2. Tap **Plan Oluştur** to open the Generate screen, pick a range
   preset and a start point, then confirm — the month gets filled.
3. The Calendar tab shows the month in a grid; tapping any day opens the
   day edit modal.
4. Use the Revise screen for range changes, the Templates screen to
   manage templates, and Settings to export CSV, switch theme, or wipe
   everything.

---

## Configuration

- **Expo app config** — [vardiya-plani/app.json](vardiya-plani/app.json):
  app name `Vardiya Planı`, slug `vardiya-plani`, scheme
  `vardiyaplani`, portrait-only, new architecture enabled, adaptive icon
  background `#0B1026`, splash-screen plugin configured with
  `assets/icon2.png`, Expo project ID embedded in `extra.eas.projectId`.
- **EAS build profiles** — [vardiya-plani/eas.json](vardiya-plani/eas.json)
  — `development` (developer client, internal), `preview` (internal APK /
  internal iOS), `production` (app bundle / store), `production-apk`
  (APK variant of production). Node 22.14.0 is enforced at build time and
  `NPM_CONFIG_LEGACY_PEER_DEPS=true` is set in the `base` env.
- **TypeScript** — strict mode, `noUncheckedIndexedAccess`, path alias
  `@/*` → `src/*`
  ([vardiya-plani/tsconfig.json](vardiya-plani/tsconfig.json)).
- **Vitest** — `environment: 'node'`, `@` alias to `src/`
  ([vardiya-plani/vitest.config.ts](vardiya-plani/vitest.config.ts)).
- **App settings** (runtime, stored locally; see
  [vardiya-plani/src/types/index.ts](vardiya-plani/src/types/index.ts)):
  - `activeTemplateId`
  - `weekStartsOnMonday` (default `true`)
  - `theme` (`light` | `dark`)
  - `showOffVariants` (whether `OFF1`/`OFF2` are displayed separately; off
    by default — the UI collapses them into one "Off")
  - `onboardingDone`

There are no environment variables, `.env` files, or remote endpoints
involved at runtime.

---

## Architecture / Core Components

Layered, one-way data flow:

```
              React screens & components  (app/ + src/components/)
                              │
                              ▼
                  Zustand store — scheduleStore
                  (src/stores/scheduleStore.ts)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  Scheduling engine     Repository (sync)    Domain types
  (pure functions)      IScheduleRepository  (src/types)
  src/services/…        src/repositories/…
                              │
                              ▼
                    FileRepository (JSON)
                    expo-file-system v55
                    Paths.document/vardiya-plani-data.json
```

- **Screens** read data from the store with Zustand selectors and
  dispatch actions; they never talk to the repository directly.
- **Store** is the single source of truth in memory. Every mutating
  action also calls the repository so the change is persisted
  immediately.
- **Scheduling engine** is a set of pure functions; it is called both
  by the store (when generating/revising) and directly by tests.
- **Repository** is an interface with two implementations. The
  production wire-up uses `FileRepository`; `MemoryRepository` exists
  for tests and for running in environments without the file system.
- **Theme** is driven by a tiny React context that subscribes to
  `settings.theme` inside the store, so theme changes are immediate
  and persistent.

### Domain model (`src/types/index.ts`)

- `ShiftType` — `id, code, name, shortName, color, startTime, endTime,
  isWorking, isOvernight, isEditable`.
- `ProgramTemplate` — `id, name, cycleLength, steps[], isActive,
  isDefault`.
- `PlannedDay` — `date (ISO), shiftCode, isLocked, source
  ('generated' | 'manual' | 'revised'), templateId, note, cycleIndex?,
  customStartTime?, customEndTime?`.
- `AppSettings` — `activeTemplateId, weekStartsOnMonday, theme,
  showOffVariants, onboardingDone`.
- `GenerateOptions` / `GenerateResult` / `RevisionOptions` drive the
  engine.
- `MonthlySummary` / `ShiftCount` are defined for monthly aggregation.

---

## Data Flow / Processing Flow / Runtime Flow

### Cold start

1. `scheduleStore.ts` is imported — at module evaluation, it calls
   `getRepository()`, which returns the `FileRepository` singleton.
2. `FileRepository.load()` runs **synchronously** via `file.textSync()`
   and populates in-memory arrays/records; `initializeDefaults()` seeds
   default shift types/templates if the file is empty.
3. Initial values flow into `useScheduleStore`, so every selector has
   real data on the first render.
4. `app/_layout.tsx` calls `preventAutoHide()` at module load; the root
   layout starts a 4s splash watchdog.
5. The first screen (`app/(tabs)/index.tsx`) reports `onLayout`, which
   calls `notifyFirstScreenReady()`, which dismisses the native splash
   one animation frame later.

### Generating a month

1. User opens Generate, picks template, start point and range.
2. The store's `generateMonth` resolves the active template, derives a
   `phaseOffset` via `calculatePhaseForNewMonth` using the previous
   day's stored `cycleIndex` (falling back to shift-code lookup only if
   no cycle index is known).
3. `generateDays` walks the date range, skipping days where
   `preserveLocked && isLocked` or `preserveManual && source='manual'`;
   for each remaining date it writes a `PlannedDay` with
   `source: 'generated'` and `cycleIndex`.
4. `FileRepository.setPlannedDays` updates the cache and writes the
   whole JSON file; the store updates its own `plannedDays` map.

### Revising a range

1. User selects a range and a mode (`single_shift` or
   `from_template`), with toggles for overriding locked/manual days.
2. `reviseRange` produces new `PlannedDay` objects with
   `source: 'revised'`, optionally preserving existing `note` and
   `cycleIndex`.
3. Results are persisted and reflected in the store.

### Editing one day

1. Day edit screen validates the `:date` route param.
2. Changes are saved through `setPlannedDay(day)`, which marks the day
   as `source: 'manual'` (when created from this screen) and optionally
   `isLocked: true`; `deleteDay` removes it.
3. Custom per-day start/end times live on the `PlannedDay` itself
   (`customStartTime`, `customEndTime`), not on the shift type.

### Exporting CSV

1. Settings → Verileri Dışa Aktar.
2. `generateExcelContent()` assembles a BOM-prefixed CSV with Turkish
   headers, localized weekday names, and quoted notes.
3. The file is written to `Paths.cache/zekra-vardiya-<local-date>.csv`
   and displayed by `Sharing.shareAsync`.

### Overnight shift rule

A shift is overnight iff its `startHour > endHour` (checked by
`isOvernightShiftByTime`). Overnight shifts are always anchored to the
**start** date in storage; the UI renders an end-time annotation through
`formatOvernightShiftDisplay` ("<name> (<end>'e kadar)").

---

## Limitations / Current State

- **Local only.** All data lives in a single JSON file at
  `Paths.document/vardiya-plani-data.json`. There is no cloud sync,
  import, or multi-device support. "Dışa Aktar" produces a CSV; "Tüm
  Verileri Sil" wipes and re-seeds defaults.
- **Turkish UI.** Labels, CSV headers, month/weekday names, and strings
  like "Bugün", "Yarın", "Sonraki mesai" are in Turkish. There is no
  runtime locale switch beyond the system locale used by Intl.
- **OFF1 / OFF2 as internals.** These exist to keep the rotation cycle
  distinguishable but are hidden from the day-edit picker; the active
  UI shows a single "Off" entry. `showOffVariants` is declared in
  settings but no UI surface toggles it in the current screens.
- **Defaults cannot always be removed.** `DEFAULT_SHIFT_TYPES` and
  `DEFAULT_TEMPLATES` are re-seeded by `initializeDefaults()` when the
  respective list is empty. Deleting a user-created template works;
  wiping defaults is done via "Tüm Verileri Sil" (which restores them).
- **No onboarding flow.** `settings.onboardingDone` exists in the type
  and default settings but no onboarding screen is wired up in the
  current routes.
- **Hooks folder is empty.** `src/hooks/` exists but contains no files.
- **Week start.** `settings.weekStartsOnMonday` defaults to `true` and
  the calendar is rendered Monday-first by the month-grid builder; there
  is no in-UI toggle that changes this at runtime.
- **Native build prerequisites.** For `expo run:android`, the Android
  SDK must be configured (see
  [vardiya-plani/android-sdk-setup-note.md](vardiya-plani/android-sdk-setup-note.md)).
- **Repository root contents.** The root also holds planning documents
  (Turkish), a reference screenshot (`ornek-program.jpeg`), a demo
  recording (`Kayit1.mp4`), and the source Excel schedule that inspired
  the default shift types (`Çalışma Programı 2026.xlsx`). The
  application itself is entirely contained within
  [vardiya-plani/](vardiya-plani/).

---

## Notes

- "Zekra" is the product/brand name shown in the app header and in the
  About section of Settings; the package / bundle identifier is
  `com.vardiyaplani.app` and the displayed app name is "Vardiya Planı".
- The app targets the **new React Native architecture**
  (`newArchEnabled: true` in `app.json`) with React 19.2 and RN 0.83.
- Store hydration is synchronous on purpose: the store reads the file
  at module load so that the first render is already populated and the
  native splash can be dismissed as soon as the first screen paints.
- The `Kayit1.mp4` file at the repository root is a demo capture and is
  unrelated to the build; `komut.txt` contains short command notes
  (`expo prebuild`, `gradlew assembleDebug`, `eas build` variants) kept
  by the author.
