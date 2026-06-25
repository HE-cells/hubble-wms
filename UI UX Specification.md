> **Design-only reference.** For build state, RBAC, and implementation record, see [`HE_interactive_timesheet_plan.md`](HE_interactive_timesheet_plan.md). For WMS functional specs see [`HE_WMS_Specification.md`](HE_WMS_Specification.md); for canonical names + CSS selectors of every UI element see `UI_NAMING_REFERENCE.html`.
> *(Updated 2026-06-11: §2.1 WMS nav, §5 WMS view specs, §6 WMS shared patterns added.)*

# UI/UX Specification: Time Tracking Web Application + WMS

## 1. Global Design System

### 1.1 Color Palette (Approximate)
The application utilizes a strict dark theme with high-contrast accent colors for interactive elements.
* **Backgrounds:**
    * Sidebar Background: `#1c2026`
    * Main Content Background: `#242930`
    * Card/Component/Modal Background: `#2c323a`
    * Input Field Background: `#1c2026` (inset shadow or darker fill)
    * Modal Overlay Backdrop: Semi-transparent black/dark slate.
* **Typography:**
    * Primary Text: `#e4eaee` (Off-white)
    * Secondary/Muted Text: `#8b97a2` (Medium gray)
* **Accents & Action states:**
    * Primary Action (Buttons, active states, active text links): `#03a9f4` (Cyan)
    * Borders/Dividers: `#3a444e`
* **Data Visualization & Project Tags:**
    * Purple: `#9c27b0`
    * Green: `#4caf50`
    * Magenta: `#e91e63`
    * Orange: `#ff9800`

### 1.2 Typography & Spacing
* **Font Family:** Clean sans-serif (e.g., Roboto, Inter).
* **Weights:** Regular (400) for body text; Medium/Semi-bold (500/600) for headers, names, and totals.
* **Layout Structure:** * Fixed Left Sidebar (~250px wide).
    * Sticky Top Bar for context-specific actions, filters, and user account controls.
    * Scrollable Main Content Area.

---

## 2. Global Navigation Hierarchy

### 2.1 Left Sidebar
* **Brand Header:** "TIMESHEET" (Top left, standard text logo)
* **Primary Views:**
    * Time Tracker (Clock Icon)
    * Calendar (Calendar Icon)
* **ANALYZE (Category Header)**
    * Dashboard (4 Squares Icon)
    * Reports (Bar Chart Icon) - *Includes a right-pointing collapse/expand arrow*
* **MANAGE (Category Header)**
    * Projects (Document Icon)
    * Team (People Icon)
    * Clients (Person Outline Icon)
    * Tags (Tag Icon)
* **Footer:** "SHOW MORE" ↔ "SHOW LESS" toggle (expand arrow rotates). Reveals the hidden **WMS** nav section.
* **WMS (Category Header, hidden behind SHOW MORE)** — all WMS pages live here, never under MANAGE:
    * Employees (People Icon) — `#employees`
    * Leave & Holidays (Calendar-check Icon) — `#holidays`
    * Notifications (Bell Icon) — `#requests` *(file is `requests.js`; the page is called "Notifications")*
    * Expense & Travel (Receipt Icon) — `#expenses`, badge `badge-expenses`
    * Evaluation (Clipboard-check Icon) — `#evaluation`, badge `badge-evaluation`
    * Documents (Clipboard-list Icon) — `#documents`, badge `badge-documents`
* **Nav badges:** WMS items show count badges (pending approvals for admin/manager; unseen decisions for employees). Counts are role-scoped and cleared via `localStorage` seen-keys on first view.

### 2.2 Top Right Global Actions
* **User Profile Avatar:** A square avatar with rounded corners (e.g., blue background with white initials). 
* **Avatar Dropdown Menu:** Clicking the avatar reveals a floating menu with the following options:
    * Profile
    * Workspace settings
    * Preferences
    * Log out

---

## 3. View Specifications

### 3.1 Time Tracker View
* **Top Bar (Quick Input Form):**
    * Text Input: "What have you worked on?"
    * Action Link: "+ Task @Project" (Cyan text)
    * Icons: Tag, Billable ($).
    * Time Controls: Start/End time inputs (e.g., `10:13 - 10:13`), Date Picker, Duration Display.
    * Primary Button: "ADD" (Solid Cyan).
* **Data List:**
    * Grouped by day (e.g., "Today", "Yesterday") with a daily total in the sub-header.
    * Row structure: Task description, Project Tag (colored dot + text), Icons (Tag, Billable), Time range, Calendar icon, Duration, Play button (resume), 3-dot options menu.

### 3.2 Timesheet View
* **Top Bar:** "Teammates" dropdown, List toggle icon, Week date picker, `< >` navigation.
* **Matrix Grid:**
    * Y-Axis: Project/Task names.
    * X-Axis: Days of the week (Mo - Su) + "Total" column.
    * Footer Row: Grand totals per day.
    * Action Buttons (Bottom): "+ Add new row", "Copy last week", "Save as template".

### 3.3 Calendar View
* **Top Bar:** View toggles [CALENDAR | Week | Day], Settings gear, "Teammates" dropdown, Date range.
* **Grid:** Time of day on Y-axis (01:00, 02:00, etc.), Days on X-axis. Zoom controls `[-][+]` in the top left corner of the grid.

### 3.4 Dashboard View
* **Top Bar:** "Dashboard" title, "Project" dropdown, "Only me" dropdown, Date picker.
* **Layout:**
    * **Top:** 3 KPI Cards ("Total time", "Top Project", "Top Client").
    * **Middle:** Stacked Bar Chart (Hours vs. Days).
    * **Bottom Left:** Donut Chart of time per project.
    * **Bottom Middle:** Legend for Donut Chart (Name, Hours, Percentage).
    * **Bottom Right:** List of "Most tracked activities".

### 3.5 Reports View
* **Top Bar:** Filter dropdowns (Team, Client, Project, Task, Tag, Status, Description) and a cyan "APPLY FILTER" button.
* **Summary Bar:** Total, Billable, Amount (THB). Export/Print options.
* **Content:**
    * Stacked Bar Chart.
    * Table Grouping controls (e.g., Group by: Project, Description).
    * Data Table columns: TITLE, DURATION, AMOUNT.
    * Accompanying Donut Chart for the table data.

### 3.6 Projects View
* **Top Bar:** "Projects" title, "CREATE NEW PROJECT" button (Cyan).
* **Filter Bar:** Active, Client, Access, Billing dropdowns. Search input.
* **Data Table:** Checkbox, NAME, CLIENT, TRACKED, AMOUNT, PROGRESS, ACCESS, Favorite Star, Options.

### 3.7 Team View
* **Top Bar:** Title, Tabs [MEMBERS | GROUPS | REMINDERS], "ADD NEW MEMBER" button (Cyan).
* **Filter Bar:** All, Billable rate, Role, Group dropdowns. Search input.
* **Data Table:** Checkbox, NAME, EMAIL, BILLABLE RATE (THB) with a "Change" link, ROLE (Cyan badges for Admin/Owner, text link for '+ Role'), GROUP dropdown, Options (3-dot menu).

### 3.8 Clients View
* **Top Bar:** Title "Clients".
* **Filter Bar:** "Show active" dropdown, Search input. Quick add form ("Add new Client" text input + Cyan "ADD" button).
* **Data Table:** Checkbox, NAME, ADDRESS, CURRENCY (e.g., THB), Edit Icon (Pencil), Options (3-dot).

---

## 4. Modals, Overlays & Settings

### 4.1 Edit Profile Modal (Triggered from Team View)
* **Container:** Centered modal box with `#2c323a` background over a dark backdrop.
* **Header:** Title "Edit profile" and 'X' close icon. Divider line below.
* **Profile Overview Identity:** Large Avatar, Name (Bold), Email, Helper Text ("User log-in credentials...").
* **Form Sections:**
    * Week start (Dropdown)
    * Working days (Day selector buttons, active in cyan)
    * Daily work capacity (Number input + "hours per day")
* **Footer Actions:** "Cancel" (text button) and "SAVE" (Solid cyan button).

### 4.2 Preferences / Account Settings View
* **Layout:** A centered, wide modal or dedicated page over the dark backdrop. Features a left-aligned vertical title and horizontal navigation tabs below the title area.
* **Header:** Title "Preferences" with an 'X' close icon in the top right corner.
* **Navigation Tabs:** [ General | Timesheet | Format | Apps ]

**Tab: General**
* **Section: Profile info**
    * **Inputs:** Name (text input), Email (text input), Job title (text input).
    * **Static Display:** Access role (text indicating current role, e.g., "System Admin").
* **Footer Action:** "SAVE" (Solid cyan button, right-aligned).

**Tab: Format**
* **Section: Date and time format**
    * **Inputs (All Dropdowns):**
        * Start of the week (e.g., Monday)
        * Date format (e.g., dd/mm/yyyy)
        * Time format (e.g., 24-hour)
        * Duration format (e.g., h:mm)
* **Footer Action:** "SAVE" (Solid cyan button, right-aligned).

---

## 5. WMS View Specifications

> The WMS (Workforce Management System) pages live behind the sidebar "SHOW MORE" toggle. They reuse the global design system (§1) plus the shared WMS patterns in §6. Canonical names and CSS selectors for every block below are catalogued in `UI_NAMING_REFERENCE.html`; functional specs are in `HE_WMS_Specification.md`.

### 5.1 Employees View (`#employees` · `employees.js`)
* **Top Bar:** Title "Employees", ⓘ info button (opens the Employee ID Structure modal explaining the `DD-T-NNN-CC` format), "ADD EMPLOYEE" button (Cyan, admin only).
* **Filter Bar:** Status dropdown, Department dropdown, Search input.
* **Data Table:** EMPLOYEE ID, NAME, DEPARTMENT, TYPE, JOB TITLE, STATUS, Actions.
* **Employee Dialog:** Multi-tab modal — Personal · Employment · Compensation · Documents · Skills. Includes a "Linked User Account" section (admin links a Google account to the employee record). Job title is a dropdown with predefined list + "Add new title…".

### 5.2 Leave & Holidays View (`#holidays` · `holidays.js`)
* **Primary Tabs:** [ HOLIDAYS | MY LEAVE | TEAM LEAVE | POLICY ] — TEAM LEAVE is admin/manager only. Tab state persists across hard refresh (`sessionStorage`).
* **HOLIDAYS:** Year selector (`<select>` + ghost-styled ‹ › buttons), Calendar/List view toggle, holiday grid + sidebar list, Add/Edit Holiday dialog (admin).
* **MY LEAVE — sub-tabs:** [ Leave | Flex | My Balance ]
    * **Leave:** Submit form (Type, From, To, Full/Half day, Notes) + per-type balance cards + own history with rejection reasons and "Show past" toggle. Date pickers block weekends (snap to next weekday + guard toast).
    * **Flex:** Sub-tabs Flex Swap / Work From Home; substitute-date picker blocks weekends.
    * **My Balance:** Per-leave-type balance cards (allocated − used).
* **TEAM LEAVE — sub-tabs:** [ Team Leave | Team Flex | Approvals | Team Balance ]
    * Team Leave / Team Flex: employee selector (shared `empSelect` datalist with clear ✕) + submit-on-behalf + history.
    * **Approvals:** Sub-views PENDING · SCHEDULE · HISTORY. Approve / Reject (modal with context line + reason) / Override (status modal). Edit opens a pre-filled modal with "Save & Approve" for admins.
    * Team Balance: employee selector + balance cards.
* **POLICY:** Full leave-policy document (entitlements, rules).

### 5.3 Notifications View (`#requests` · `requests.js`)
* **RECENT NOTIFICATIONS block (top, all users):** Dismissable cards (✕) for the user's own approved/rejected requests (leave, flex, name change, job title), 3-day window.
* **MY PENDING REQUESTS:** Own pending name-change / job-title-change requests, each with a Cancel button.
* **Admin Tabs:** [ DELETION | PROFILE CHANGES | LEAVE REQUESTS ] with count badges.
    * DELETION: pending entity-deletion requests (Approve & Delete / Reject / Cancel).
    * PROFILE CHANGES: Name Changes + Job Title Changes combined (two sub-sections).
    * LEAVE REQUESTS: read-only all-leave-requests table.
* **Non-admin:** Own leave requests table below the notification cards.

### 5.4 Expense & Travel View (`#expenses` · `expenses.js`)
* **Model:** Single petty-cash float ledger (top-ups in / expenses out, project-tagged) + hybrid travel (mileage auto-calc + trip pre-approval). 2-tier approval: manager → finance(admin).
* **Primary Tabs:** [ MY EXPENSES | MY TRAVEL | APPROVALS | PETTY CASH | REPORT ] — APPROVALS = admin/manager; PETTY CASH + REPORT = admin only. Tab state persists across hard refresh.
* **MY EXPENSES:** Submit form (Date, Category, Project/Purpose *required*, Amount, Currency with FX auto-convert toast, Receipt URL, Note) + own history ("Show past" toggle, NEW chip on unseen decisions, Cancel button on pending rows). Office categories lock Project to "Hubble Engineering Office".
* **MY TRAVEL — sub-tabs:** [ MILEAGE CLAIM | TRIP REQUEST ]
    * Mileage: Travel Type selector (Personal Vehicle | Public Transport); vehicle sub-select (Car ฿10/km, Motorcycle ฿6/km); one-way/round-trip route boxes (2 or 3, "+ Add stop"); live reimbursement + depreciation preview. Public transport = full fare reimbursed.
    * Trip Request: pre-approval form (destination, dates, purpose, project *required*, estimated cost + currency, covers-checklist). Approved trips get `TR-YYYYMM-NNNN` reference; post-trip settlement flow.
* **APPROVALS:** Sub-tabs PENDING · HISTORY (all statuses). Approve / Reject (modal) / Edit (pre-filled modal with "Save & Approve") / Override (status-dropdown modal, HISTORY).
* **PETTY CASH:** Negative-balance banner with one-click suggested top-up, Record Top-up form (Source + Project required; office sources lock project), running balance card (IN green / OUT red / CLOSING green-or-red), Payment Details panel (per-employee expandable cards, per-item + per-employee + Mark-All "Mark paid"), All Transactions table, Setup (vehicle per-km rates, categories, monthly top-up amount, PT daily rate ฿550).
* **REPORT — sub-tabs:** [ MONTHLY | WEEKLY ] (max-width 860px, stacked tables)
    * Monthly (full-time): by-project + by-person totals, opening/closing balance, advances-to-reimburse section, holiday-aware 14th-deadline banner (blue → orange ≤5d → red ≤2d).
    * Weekly (PT/outsource): defaults to last completed week; per-worker sessions (½-days) × rate, payout-Monday banner, "Post Wages to Ledger" review modal.

### 5.5 Evaluation View (`#evaluation` · `evaluation.js`)
* **Workflow:** self-assessment → manager review → admin publishes final rating (1–5). Stage visibility enforced at DB level (employee never sees manager rows pre-publish).
* **Primary Tabs:** [ MY EVALUATION | TEAM REVIEW | MANAGE ] — TEAM REVIEW = manager/admin; MANAGE = admin only.
* **MY EVALUATION:** Evaluation cards (Start / Edit / View by stage) → self-assessment form: bilingual survey intro, auto-filled personal header, timesheet KPI panel (attendance, billable hours, utilization, project mix), 5-point bilingual rating legend (EN before TH), 5 sections from the question bank (28 questions: achievements ×3 text, 12 skill ratings, development, feedback, overall), Save Draft / Submit (confirm modal + required-field check). Editable until the manager submits. Published view = self-vs-manager rating columns + manager comments + final-rating banner.
* **TEAM REVIEW:** Team evaluations table → review form (self answers read-only, manager rating column, 3 comment paragraphs, Save Draft / Submit Review).
* **MANAGE — sub-tabs:** [ CYCLES | ASSIGNMENTS ]
    * CYCLES: cycle CRUD (annual/probation/custom; H1/H2 preset buttons — Mid-Year deadline 30 Jun, Year-End 31 Dec; KPI period; open/close).
    * ASSIGNMENTS: per-cycle table, bulk Assign Employees modal (select-all), Publish modal (self-vs-manager averages + final rating), Reopen modal.
* **Read-only answers:** picked rating shown as a highlighted accent chip with its label before the score chips ("Excellent · 1 2 3 4 [5]"); free-text answers in a readable panel (surface-2 background, accent left border).

### 5.6 Documents View (`#documents` · `documents.js`)
* **Tabs:** MY DOCUMENTS (issued own documents; draft rows hidden from employee users) · TEAM DOCUMENTS (admin/manager generated-document cards for direct reports/all staff, including drafts; View, Print/Save-PDF via `window.print()` using print-to-fit A4 portrait output; print is blocked if required merge fields remain unresolved; status actions draft → generated → sent → signed) · GENERATE (admin/manager: employee picker → template card grid → custom fields → required-field warning for all non-optional blank merge fields used by the selected template → resolved preview → Save Draft; blank standalone `custom.note` blocks are hidden) · TEMPLATES (admin: HTML template editor with sample preview + versioning). 8 document types, `{{group.field}}` merge engine, unseen generated-document badge `badge-documents`.

---

## 6. WMS Shared Patterns

* **Employee Selector (`empSelect` component):** `<input list>` datalist wrapped in `.emp-select-wrap` with an overlaid `.emp-clear-btn` ✕. Used on every employee picker (team tabs, admin pickers on all 5 time pages). Never build a custom one.
* **Week / Period Selector (`weekNav` component):** ‹ › buttons, clickable label opening the native date picker (snaps to Monday), muted ISO "Wk N" suffix; optional "This week / Show all" for filter pages. Project default for any week navigation.
* **Modal Pattern:** `.modal-backdrop > .modal[.modal-lg] > .modal-header / .modal-body / .modal-footer`, appended to `document.body`; closes on ✕, Cancel, and backdrop click. Reject/Override prompts are always modals, never `prompt()`.
* **Buttons:** Primary = solid cyan `.btn-primary`; secondary = `.btn.btn-ghost` (never bare `.btn` — it has no background); destructive = `.btn-danger`. Themed inputs require an explicit `type` attribute or they fall back to UA white.
* **Status Chips / Badges:** pending (amber) · approved/signed (green) · rejected (red) · cancelled (gray) · NEW chip + green row highlight for unseen decisions.
* **Tables with actions:** `.row-actions` / `.table-actions` — `flex, nowrap`, always visible (no opacity tricks).
* **Toasts:** bottom-right `.toast` stack via `window.showToast(msg, type)`; 10s auto-dismiss + ✕; error = red left border, success = green. Distinct from the Notifications page.
* **Tab-state persistence:** complex tabbed pages save tab state to `sessionStorage` (`exp_tab_state`, `hl_tab_state`, `eval_tab_state`) with role guards on restore.
