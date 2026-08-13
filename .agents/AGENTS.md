# ESchedular26 Authentication & Routing Rules

- **Default Root Route (`/`)**:
  - Unauthenticated / guest access opens **Home Dashboard** directly.
  - Does NOT force-redirect unauthenticated users to `/login`.

- **Admin Login Portal (`/login`)**:
  - Single unified login form titled **Admin Login**.
  - Authentication strictly validates BOTH matching Username AND Password pairs for all logins.
  - Credentials guide rendered on screen:
    - **Full Admin**: Username `admin` | Password `987321` (or `987`) -> Redirects to `/admin`
    - **Lab Admin**: Username `labadmin` | Password `654` -> Redirects to `/lab-tracker?tab=leader` (Mark Attendance Portal)

- **Lab Admin Access Controls**:
  - `activeTab === 'leader'` is the default tab for `lab_admin` role.
  - In `LabTrackerPage.jsx`, the `Admin Analytics` tab is only visible to `isAdmin` or `isLabAdmin`.
  - Lab Admins have **Read-Only** access to Admin Analytics; system reset operations are restricted to `isAdmin`.
