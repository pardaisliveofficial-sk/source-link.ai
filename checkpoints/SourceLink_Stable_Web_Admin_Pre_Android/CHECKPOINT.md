# SourceLink.ai - Stable Web + Admin - Pre Android Checkpoint

**Checkpoint Name:** `SourceLink.ai - Stable Web + Admin - Pre Android`  
**Date & Time:** August 11, 2026 (2026-08-11T01:09:15-07:00)  
**Version Identifier:** `v1.0.0-stable-pre-android`  
**Status:** Verified & Stable (All Build & Lint Checks Passed)

---

## 1. System Overview & Scope Preserved

This checkpoint captures the fully operational, production-ready web application and admin portal for **SourceLink.ai** before starting any Android native conversion or modifications.

### Preserved Subsystems & Functionality:
1. **Auth & User Management:**
   - **Auth First Screen:** Landing view requiring Sign Up / Log In before app access.
   - **User Accounts:** Full registration, password hashing, persistent sessions, and local storage fallback.
   - **Mandatory Email Verification:** Email verification barrier with verification code generation and resend functionality.
2. **Admin Portal:**
   - **Separate Admin Authentication:** Secured at `/api/admin/auth/login`.
   - **Strict Allowlist Enforcement:** 4 super admin accounts:
     - `saifkhokhar657@gmail.com`
     - `sa098086@gmail.com`
     - `pardaisliveofficial@gmail.com`
     - `janejahan84@gmail.com`
   - **Admin Management Features:** User monitoring, account suspension/reactivation, SaaS plans & pricing controls, discount voucher generation, and system usage logs.
3. **GitHub Sync Engine & Deployment:**
   - **GitHub Authentication:** Support for Personal Access Tokens (PAT) with `repo` scope and GitHub OAuth integration.
   - **Repository & Branch Operations:** Real-time fetching of GitHub repositories, branches, and commit histories.
   - **ZIP File Import & Processing:** Full JSZip extraction with nested directory traversal and `.gitignore` pattern matching.
   - **Diff & Conflict Engine:** AST-level diff computation categorizing files into `ADDED`, `MODIFIED`, `DELETED`, and `UNCHANGED`.
   - **Selective Commit & Push:** Selective file pushing directly to GitHub with commit message customizer, conflict resolution, commit SHA generation, and direct GitHub links.
   - **Sync History:** Historical logging of all pushes and deployments per user.
4. **SaaS Plans & Commercial Model:**
   - Tiered subscription plans (Free, Pro, Enterprise) with active file limit enforcement, custom pricing, and discount vouchers.

---

## 2. Environment Variables & Production Configuration

```env
# Production Server Configuration
PORT=3000
NODE_ENV=production

# Security & Sessions
SESSION_SECRET=sourcelink_secure_session_secret_2026

# Admin Access Control
ADMIN_EMAILS=saifkhokhar657@gmail.com,sa098086@gmail.com,pardaisliveofficial@gmail.com,janejahan84@gmail.com

# GitHub Integration (Optional OAuth client credentials; PAT supported directly)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## 3. Database Schema Version (`v1.2`)

The application utilizes a persistent server-side state engine with resilient client-side storage fallbacks.

### Schemas:
- **`users`**: `{ id, name, email, passwordHash, authProvider, plan, status, emailVerified, verificationCode, githubToken, githubUsername, createdAt, lastLoginAt }`
- **`admins`**: `{ id, name, email, role, status, lastLoginAt }`
- **`plans`**: `{ id, name, priceMonthly, priceYearly, fileLimit, syncFrequency, customBranding, active }`
- **`discounts`**: `{ id, code, percentage, validUntil, maxRedemptions, currentRedemptions }`
- **`syncHistories`**: `{ id, userId, repoName, branch, filesChanged, commitSha, status, timestamp }`

---

## 4. Checkpoint Restoration Procedure

To restore this exact working state at any time:

1. Copy all contents from `/checkpoints/SourceLink_Stable_Web_Admin_Pre_Android/` into the root directory:
   ```bash
   cp -r /checkpoints/SourceLink_Stable_Web_Admin_Pre_Android/* /
   ```
2. Verify dependencies and run linter:
   ```bash
   npm run lint
   ```
3. Compile the application to ensure clean compilation:
   ```bash
   npm run build
   ```
4. Restart the development server.

---

## 5. Verification Log

- **Linting (`tsc --noEmit`):** ✅ PASSED (0 errors)
- **Compilation (`npm run build`):** ✅ PASSED (0 errors)
- **API Health Check (`/api/health`):** ✅ 200 OK
- **User Auth API (`/api/auth/register`, `/api/auth/login`):** ✅ 200 OK
- **Admin Auth API (`/api/admin/auth/login`):** ✅ 200 OK (Allowed emails succeeded, unauthorized emails returned 403 Forbidden)
