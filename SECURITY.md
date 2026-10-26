# Security & Threat Model Policy — KarShenas Vehicle Inspection PWA

## 1. Security Architecture & Threat Model

KarShenas is an offline-first Progressive Web Application (PWA) with cloud synchronization designed for automotive dealerships, diagnostic centers, and certified vehicle inspectors.

### Core Security Tenets
1. **Zero-Trust Workspace Isolation**: Inspection documents, defect notes, and photo evidence are isolated per workspace. Cross-workspace reads or writes are strictly denied at the database rule layer (`firestore.rules`).
2. **Role-Based Access Control (RBAC)**:
   - **Workspace Owner**: Has administrative control over workspace settings and member authorization. Cannot delete or hijack other workspaces. Ownership cannot be transferred arbitrarily.
   - **Workspace Member**: Can create and update inspection records and upload photo evidence within authorized workspaces. Cannot modify workspace ownership or delete workspace records.
   - **Unauthenticated Users**: Have zero read or write access to inspection records, customer phone numbers, VINs, or photo evidence.
3. **Local Storage & Offline Privacy**:
   - IndexedDB is used strictly on the inspector's authorized device.
   - The Service Worker (`/public/sw.js`) caches **only static public application shell assets** (HTML, CSS, JavaScript, icons, font glyphs).
   - **No private inspection data, customer identifiers, photo blobs, or Firebase Auth tokens are ever placed in CacheStorage**.
4. **Photo Storage Hardening**:
   - Files are stored at structured, isolated paths: `/workspaces/{workspaceId}/inspections/{inspectionId}/{photoId}`.
   - Direct public image URLs are forbidden; images are retrieved exclusively through authenticated Firebase SDK operations.
   - Strict upload constraints are enforced: maximum file size of 10 MB, allowed MIME types: `image/jpeg`, `image/png`, and `image/webp`.

---

## 2. Secret Management & Gitleaks Integration

### Secret Scanning Policies
- **No Credentials in Code**: Service account JSON files, private API keys, and database passwords must never be committed to source control or exposed in frontend code.
- **Client Web Identifiers**: The Firebase Web configuration (`firebase-applet-config.json`) contains only public client identifiers (`apiKey`, `projectId`, `appId`) necessary for browser routing. It is narrowly allowlisted in `.gitleaks.toml`.

### Local Scanning Commands (Gitleaks CLI)
To scan local files and Git history for accidental secrets:

```bash
# Scan working tree files for secrets (with redaction)
gitleaks dir --redact . -c .gitleaks.toml -v

# Scan Git commit history for secrets (with redaction)
gitleaks git --redact . -c .gitleaks.toml -v
```

### Continuous Integration (GitHub Actions)
The workflow `.github/workflows/security.yml` executes Gitleaks on:
- Every push to `main` and `master`.
- Every pull request targeting `main` and `master`.
- Scheduled weekly scans (Mondays at 04:00 UTC).
- Manual triggering via `workflow_dispatch`.

---

## 3. Security Rules Deployment

### Firestore Rules (`firestore.rules`)
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    function isWorkspaceMember(workspaceId) {
      return isAuthenticated() && (
        exists(/databases/$(database)/documents/workspaces/$(workspaceId)) && (
          get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.ownerId == request.auth.uid ||
          (request.auth.uid in get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.members)
        )
      );
    }
    // ... complete rules in firestore.rules
  }
}
```

Deploy updated rules using the AI Studio tool or Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### Storage Rules (`storage.rules`)
```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /workspaces/{workspaceId}/inspections/{inspectionId}/{photoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size <= 10 * 1024 * 1024
        && request.resource.contentType.matches('image/(jpeg|png|webp)');
      allow delete: if request.auth != null;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 4. Content Security Policy (CSP) & Web Headers

The application serves strict HTTP security headers via `<meta>` tags and host configuration:
- **`Content-Security-Policy`**: Restricts script execution to `'self'`, allows Google authentication frames (`accounts.google.com`), and restricts connections strictly to authorized Google/Firebase endpoints.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-sniffing exploits.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Prevents leaking full URLs and inspection IDs to external domains.

---

## 5. Incident Response & Credential Revocation

If any credential or service account is accidentally exposed:
1. **Immediate Revocation**: Go to Google Cloud Console (`console.cloud.google.com`) -> **APIs & Services** -> **Credentials** and immediately delete/revoke the exposed key.
2. **Re-generate Key**: Generate a replacement key and restrict its API permissions and HTTP referrers.
3. **Audit Access Logs**: Check Cloud Logging for unauthorized invocations during the exposure window.
4. **Purge Commit**: Use `git filter-repo` or BFG Repo-Cleaner to purge the sensitive object from Git history prior to pushing.

---

## 6. Firebase App Check Recommendations

For production hardening against abuse and API scraping:
1. Enable **Firebase App Check** in the Firebase Console.
2. For Web PWAs, register the **reCAPTCHA v3** or **reCAPTCHA Enterprise** provider.
3. Enforce App Check on Cloud Firestore and Cloud Storage after verifying token verification in staging.
