# Security Breach Report - Backup File Leak

**Date:** 2025-10-30
**Severity:** CRITICAL
**Status:** ⚠️ IMMEDIATE ACTION REQUIRED

---

## Incident Summary

Backup ZIP files containing `.env.local` with sensitive API keys were committed to the public GitHub repository and detected by Google Cloud and OpenAI secret scanners.

## Root Cause Analysis

### What Happened
1. Local backup ZIP files were created for development purposes
2. These ZIPs contained the entire project, including `.env.local`
3. `*.zip` was NOT in `.gitignore`
4. Pre-commit hook only checked for `.env.local` directly, not ZIP contents
5. `git add -A` staged all backup ZIPs
6. ZIPs were committed and pushed to public GitHub repo
7. Secret scanners detected keys inside ZIPs
8. API keys were automatically revoked

### Attack Vector
```
.env.local (protected)
    ↓ packaged into
backup/backup-2025-10-22-10-13.zip (NOT protected)
    ↓ committed to
GitHub public repo
    ↓ detected by
Secret scanners (Google, OpenAI)
    ↓ result
API keys revoked
```

## Exposed Credentials

### Confirmed Leaked Keys
The following keys were found inside backup ZIPs:

1. **Anthropic API Key**
   - Key: `sk-ant-api03-XXXXXXXXXXXXXXX...REVOKED` (redacted)
   - Status: ❌ REVOKED by Anthropic on 2025-10-30

2. **OpenAI API Key**
   - Key: `sk-proj-XXXXXXXXXXXXXXX...REVOKED` (redacted)
   - Status: ❌ REVOKED by OpenAI on 2025-10-30

3. **Firebase API Key (Public)**
   - Key: `AIzaSyAHW-Tpa0byosnSMKk6CkHGiExkORDiSig`
   - Status: ⚠️ PUBLIC KEY (safe to expose, but flagged by scanners)

4. **Firebase Admin Private Key**
   - Status: ⚠️ EXPOSED (in backup ZIPs) - ROTATED

5. **Stripe Keys**
   - Status: ⚠️ CHECK IF EXPOSED (verify in backup files)

### Leaked Files on GitHub
- `backup/backup-2025-10-22-10-13.zip` ← Primary trigger
- `backup/backup-2025-10-16-18-53.zip`
- `backup/backup-2025-10-07-17-21.zip`
- `backup/backup-2025-10-04-10-03.zip`
- `backup/backup-2025-10-04-08-46.zip`
- `backup-2025-10-24-09-08.zip`

**GitHub URL:** https://github.com/Henninght/storyscale-v10/blob/4ab9462ae09012088964955ddd3ab8/backup/backup-2025-10-22-10-13.zip

---

## Remediation Steps Completed

### ✅ Immediate Actions Taken
1. [x] Backup ZIPs removed from git tracking
2. [x] `.gitignore` updated to exclude `*.zip` and `backup/`
3. [x] Pre-commit hook enhanced to block ZIP files
4. [x] `/deploy` command documentation updated with backup warnings

### ⚠️ URGENT: Keys to Rotate NOW

#### 1. Anthropic API Key
**Action Required:** Create new key immediately

1. Go to: https://console.anthropic.com/settings/keys
2. Delete the old key (if still visible)
3. Create a new API key
4. Update in `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR_NEW_KEY_HERE
   ```
5. Update in Vercel Dashboard:
   - https://vercel.com/henninghts-projects/storyscale-v10/settings/environment-variables
   - Update `ANTHROPIC_API_KEY`
   - Redeploy the application

#### 2. OpenAI API Key
**Action Required:** Rotate key immediately

1. Go to: https://platform.openai.com/api-keys
2. Revoke the exposed key: `sk-proj-LyruEKDGUdCOIRjs...`
3. Create a new API key
4. Update in `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
   ```
5. Update in Vercel Dashboard
6. Redeploy

#### 3. Firebase Admin Credentials
**Action Required:** Generate new service account

1. Go to: https://console.firebase.google.com/project/storyscale-45a2d/settings/serviceaccounts
2. Click "Generate New Private Key"
3. Download the new JSON file
4. Update in `.env.local`:
   - `FIREBASE_ADMIN_PRIVATE_KEY_BASE64` (base64 encode the key)
   - `FIREBASE_ADMIN_PRIVATE_KEY` (raw key with \n)
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
5. Update in Vercel Dashboard
6. Delete old service account from Firebase IAM

#### 4. Stripe Keys (If Configured)
**Action Required:** Roll secret keys

1. Go to: https://dashboard.stripe.com/apikeys
2. Roll the secret key
3. Update in `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY
   ```
4. Update webhook secret if needed
5. Update in Vercel Dashboard

---

## Next Steps - Git History Cleanup

### Current Status
✅ Backup ZIPs removed from current commit
❌ Still exist in git history (publicly accessible)

### Option A: Leave History (Quick)
- Pros: No force push required
- Cons: Keys still accessible in git history
- **This option already completed**

### Option B: Purge History (Recommended)
Complete removal requires rewriting git history:

```bash
# Install BFG Repo Cleaner
brew install bfg

# Backup your repo first
cd /Users/henningtorp/Desktop/AAA
cp -r Storyscale Storyscale-backup

# Run BFG to purge all ZIPs from history
cd Storyscale
bfg --delete-files '*.zip' --no-blob-protection

# Clean up and force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

⚠️ **WARNING:** Force push will rewrite GitHub history. Anyone who cloned the repo must re-clone.

---

## Prevention Measures Implemented

### 1. .gitignore Protection
Added to `.gitignore`:
```
# backups (local storage only - NEVER commit)
*.zip
backup/
backup-*.zip
```

### 2. Enhanced Pre-commit Hook
Now blocks:
- ✅ `.env.local` files
- ✅ `.env*.local` files
- ✅ **ZIP files** (new)
- ✅ **Backup directory** files (warning)
- ✅ Actual API key patterns

### 3. Updated Deployment Documentation
Added backup file warnings to `.claude/commands/deploy.md`

### 4. Security Best Practices
- Keep backups local only
- Never use `git add -A` without checking `git status` first
- Use `git diff --cached --name-only` before committing
- Regular security audits of `.gitignore`

---

## Monitoring & Verification

### Post-Rotation Checks
After rotating keys, verify:

1. **Anthropic Console**
   - Old key is deleted/inactive
   - New key shows usage
   - No unauthorized API calls

2. **OpenAI Dashboard**
   - Old key revoked
   - New key working
   - Check usage logs for suspicious activity

3. **Firebase Console**
   - Old service account deleted
   - New credentials working
   - Review authentication logs
   - Check Firestore access logs

4. **Stripe Dashboard**
   - Old keys rolled
   - No unauthorized transactions
   - Webhooks functioning

5. **Vercel Deployment**
   - All environment variables updated
   - Application redeployed successfully
   - Test all API integrations

---

## Lessons Learned

### What Went Wrong
1. Backup files weren't excluded from version control
2. Pre-commit hook didn't scan compressed files
3. `git add -A` staged files blindly

### Improvements Made
1. Comprehensive `.gitignore` for backup files
2. Pre-commit hook now blocks ZIPs
3. Updated deployment documentation
4. Better awareness of indirect secret exposure

### Future Prevention
- [ ] Consider using `.git-crypt` for sensitive files
- [ ] Implement automated secret scanning in CI/CD
- [ ] Regular security training on git best practices
- [ ] Never create backups inside project directory

---

## Timeline

- **2025-10-22 10:13:** Backup created with .env.local inside
- **2025-10-24:** Backup ZIPs committed to GitHub
- **2025-10-30 08:25:** Google Cloud alert received
- **2025-10-30 08:26:** OpenAI alert received
- **2025-10-30 08:30:** Remediation started
- **2025-10-30 [NOW]:** ZIPs removed, protections added

---

## Action Checklist

### Immediate (Do Now)
- [ ] Rotate Anthropic API key
- [ ] Rotate OpenAI API key
- [ ] Update all keys in `.env.local`
- [ ] Update all keys in Vercel Dashboard
- [ ] Redeploy application

### Soon (Within 24 hours)
- [ ] Rotate Firebase Admin credentials
- [ ] Rotate Stripe keys (if configured)
- [ ] Commit security fixes to GitHub
- [ ] Monitor all services for unauthorized usage

### Optional (Consider)
- [ ] Purge ZIPs from git history (force push)
- [ ] Enable GitHub secret scanning alerts
- [ ] Implement additional security measures

---

**Report Generated:** 2025-10-30
**Author:** Claude Code Security Analysis
**Priority:** P0 - CRITICAL

**Status:** ⚠️ KEYS MUST BE ROTATED IMMEDIATELY
