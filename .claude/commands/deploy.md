# Deploy to Production

Deploy the application to Vercel with full safety checks.

## Workflow

1. **Pre-deployment Security Checks**
   - Verify .env.local is NOT staged for commit
   - Verify .env.local is in .gitignore
   - **Verify NO backup ZIP files are staged** (can contain .env.local)
   - Check for any accidentally committed secrets
   - Scan staged files for actual API key values
   - Ensure backup/ directory files don't contain sensitive data

2. **Git Commit & Push**
   - Stage all changes: `git add -A`
   - Commit with descriptive message
   - Push to GitHub: `git push origin main`
   - Automatic Vercel deployment triggers

3. **Post-deployment Verification**
   - Confirm deployment succeeded
   - Check live URL: https://storyscale-v10.vercel.app
   - Verify environment variables in Vercel dashboard
   - Monitor deployment logs for errors

## Safety Features

**Multi-Layer Protection:**
- ✅ `.gitignore` excludes `.env.local`, `.env*.local`, and backup files
- ✅ **Pre-commit hook** (`.husky/pre-commit`) automatically blocks:
  - `.env.local` files
  - Any `.env*.local` files
  - **ZIP files** (can contain .env.local)
  - **Backup directory** files (warns if detected)
  - Actual API key values (sk-ant-, sk_live_, sk_test_)
- ✅ Clear error messages with fix instructions
- ✅ Will ABORT commit if any secrets detected

**⚠️ CRITICAL: Backup Files**
- NEVER commit backup ZIP files - they can contain .env.local
- Keep backups local only (already excluded in .gitignore)
- If you created backups, ensure they're not staged for commit

**If .env.local is accidentally staged:**
```bash
git restore --staged .env.local
```

## Commands

### Full Deployment
```bash
git add -A
git commit -m "Your commit message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

### Quick Deploy (current changes)
```bash
git add -A && git commit -m "Deploy updates" && git push origin main
```

### Check What Will Be Committed
```bash
git status
git diff --cached --name-only
```

## Emergency: Remove Committed Secrets

If secrets were accidentally committed:

1. **Remove from staging:**
   ```bash
   git restore --staged .env.local
   git restore --staged *.zip
   ```

2. **Remove from last commit:**
   ```bash
   git reset --soft HEAD~1
   git restore --staged .env.local
   git restore --staged *.zip
   git commit -m "Your commit message"
   ```

3. **Remove backup ZIPs from git:**
   ```bash
   git rm backup/*.zip backup-*.zip
   git commit -m "security: Remove backup files containing secrets"
   ```

4. **Rotate ALL exposed keys immediately:**
   - See `SECURITY_INCIDENT.md` for detailed instructions
   - Anthropic API key
   - OpenAI API key
   - Stripe keys
   - Firebase Admin credentials

## Vercel Dashboard

- **Project URL:** https://vercel.com/henninghts-projects/storyscale-v10
- **Live URL:** https://storyscale-v10.vercel.app
- **GitHub:** https://github.com/Henninght/storyscale-v10

## Environment Variables to Configure

Ensure these are set in Vercel:
- `ANTHROPIC_API_KEY`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- All `NEXT_PUBLIC_*` variables (from Firebase, Stripe)

## Usage

Use this command when you're ready to deploy your changes to production. The pre-commit hook will automatically run security checks before allowing the commit.
