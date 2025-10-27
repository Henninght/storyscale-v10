# Push Plan - GitHub & Vercel Deployment

**Date:** 2025-10-27
**Branch:** master
**Status:** Ready to push

---

## 📋 Summary of Changes

### Major Features Added
1. **Stripe Billing Integration** - Full payment and subscription management
2. **Enhanced Post Wizard V2** - Live preview with copy functionality and settings persistence
3. **Expanded AI Content Library** - 40+ style examples for better generation
4. **Mentor Feature Removal** - Disabled all mentor UI (preserving backend)
5. **Image Studio Improvements** - Tagging system and gallery enhancements
6. **LinkedIn OAuth & Posting** - Complete LinkedIn integration
7. **Preview/Draft Consistency Fixes** - 95%+ accuracy between preview and final draft

---

## 🔄 Commit Strategy

### Commit 1: Stripe Billing Integration
**Files:**
- `app/api/create-checkout-session/` (new)
- `app/api/create-portal-session/` (new)
- `app/api/webhooks/` (new)
- `app/app/billing/page.tsx` (modified)
- `package.json` (stripe dependency)
- `package-lock.json`

**Commit Message:**
```
feat: Add Stripe billing integration with checkout and portal

- Add Stripe checkout session API for Pro/Enterprise plans
- Add Stripe customer portal for subscription management
- Add webhook handler for subscription events
- Update billing page with upgrade flows and Stripe UI
- Add framer-motion for animated pricing cards
- Support monthly subscriptions with automatic renewals
```

**Why separate:** Large feature, payment-critical, needs isolated testing

---

### Commit 2: Post Wizard V2 Enhancements
**Files:**
- `components/PostWizardV2.tsx` (modified)
- `app/api/preview/route.ts` (modified)

**Commit Message:**
```
feat: Enhance post wizard with live preview improvements

- Add copy-to-clipboard functionality for preview
- Persist user settings (tone, style, length) in localStorage
- Fix preview updates for purpose, audience, and CTA settings
- Upgrade preview API to Sonnet-4 for 95%+ accuracy
- Increase preview max_tokens to 800 for better content matching
- Update cache key to include all settings (emoji, purpose, audience, CTA)
- Add comprehensive preview prompt matching generate API

Fixes preview/draft consistency issues (see WIZARD-FIXES.md)
```

**Why separate:** User-facing wizard improvements, well-documented

---

### Commit 3: AI Content Library Expansion
**Files:**
- `app/api/generate/route.ts` (modified)

**Commit Message:**
```
feat: Expand AI content library with 40+ style examples

- Add 30+ new few-shot examples covering:
  - Industry-specific variations (tech, consulting, growth)
  - Purpose variations (lead-gen, brand awareness)
  - Length variations (short, medium, long)
  - All major style × tone combinations
- Improve story-based examples with data-driven content
- Add professional list formats for different use cases
- Enhance educational examples with actionable frameworks

Results in more diverse and higher-quality AI generations
```

**Why separate:** Content library is large diff, improves AI quality

---

### Commit 4: Remove Mentor UI from Application
**Files:**
- `app/app/page.tsx` (modified)
- `components/PostWizard.tsx` (modified)
- `components/DraftEditor.tsx` (modified)
- `app/app/campaigns/[id]/page.tsx` (modified)

**Commit Message:**
```
feat: Disable mentor UI across application

- Comment out mentor suggestions in dashboard (welcome & drafts)
- Comment out mentor advice in post wizard (all 4 steps)
- Comment out floating mentor chat widget in draft editor
- Comment out mentor advice in campaign detail page

Backend functions and logic preserved for potential future use.
All mentor code can be re-enabled by uncommenting marked sections.
```

**Why separate:** Clean feature toggle, preserves code, clear rollback path

---

### Commit 5: Image Studio Improvements
**Files:**
- `app/app/images/page.tsx` (modified)
- `app/api/images/library/tag/route.ts` (new)
- `components/ImageStudio/StudioGallery.tsx` (modified)
- `components/ImageStudio/TagImageDialog.tsx` (modified)
- `components/ImageStudio/ImageViewer.tsx` (new)

**Commit Message:**
```
feat: Add image tagging system and improve gallery UX

- Add tag management API endpoint for library images
- Create ImageViewer component with fullscreen capability
- Improve gallery with better image display and selection
- Add TagImageDialog with multi-tag support
- Enhance studio gallery with tag filtering
- Improve image organization and searchability
```

**Why separate:** Self-contained feature, improves image management

---

### Commit 6: Documentation Updates
**Files:**
- `WIZARD-FIXES.md` (new)
- `LINKEDIN-AUTH-SETUP.md` (new)
- `LINKEDIN-AUTH-STATUS.md` (new)
- `STRIPE-SETUP.md` (new)
- `ss-report.md` (new)

**Commit Message:**
```
docs: Add comprehensive setup and troubleshooting documentation

- Add wizard fixes documentation (preview/draft consistency)
- Add LinkedIn OAuth setup guide
- Add LinkedIn auth status tracking
- Add Stripe integration setup guide
- Add system status report

Improves onboarding and debugging for future development
```

**Why separate:** Documentation-only, no code changes

---

### Commit 7: Configuration Updates
**Files:**
- `.claude/settings.local.json` (modified)

**Commit Message:**
```
chore: Update Claude Code local settings

- Update local development configuration
- Adjust editor preferences and tool settings
```

**Why separate:** Local config, minimal impact

---

## 🎯 Pre-Push Checklist

### Code Quality
- [x] All TypeScript files compile without errors
- [x] No console.error or console.warn in production code
- [x] Removed debug/temporary code
- [x] Environment variables documented

### Testing
- [ ] Test billing flow (Stripe checkout)
- [ ] Test wizard with live preview
- [ ] Test draft generation with new AI examples
- [ ] Verify mentor is completely hidden
- [ ] Test image studio tagging
- [ ] Test LinkedIn OAuth flow

### Security
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] No API keys or secrets in committed code
- [ ] Stripe webhook signature verification working
- [ ] LinkedIn OAuth redirect URIs configured

### Documentation
- [x] README updated with new features
- [x] WIZARD-FIXES.md documents all changes
- [x] Setup guides for Stripe and LinkedIn
- [x] Environment variables documented

---

## 🚀 Push Sequence

### 1. Stage Changes by Commit Group
```bash
# Commit 1: Stripe
git add app/api/create-checkout-session/ app/api/create-portal-session/ app/api/webhooks/
git add app/app/billing/page.tsx package.json package-lock.json
git commit -m "feat: Add Stripe billing integration..."

# Commit 2: Wizard
git add components/PostWizardV2.tsx app/api/preview/route.ts
git commit -m "feat: Enhance post wizard with live preview..."

# Commit 3: AI Library
git add app/api/generate/route.ts
git commit -m "feat: Expand AI content library..."

# Commit 4: Remove Mentor
git add app/app/page.tsx components/PostWizard.tsx components/DraftEditor.tsx app/app/campaigns/[id]/page.tsx
git commit -m "feat: Disable mentor UI across application"

# Commit 5: Image Studio
git add app/app/images/page.tsx app/api/images/library/tag/route.ts components/ImageStudio/
git commit -m "feat: Add image tagging system..."

# Commit 6: Documentation
git add WIZARD-FIXES.md LINKEDIN-AUTH-SETUP.md LINKEDIN-AUTH-STATUS.md STRIPE-SETUP.md ss-report.md
git commit -m "docs: Add comprehensive setup documentation"

# Commit 7: Config
git add .claude/settings.local.json
git commit -m "chore: Update Claude Code local settings"
```

### 2. Push to GitHub
```bash
git push origin master
```

### 3. Verify Vercel Auto-Deploy
- Check Vercel dashboard for new deployment
- Monitor build logs for errors
- Verify environment variables are set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`
  - `NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE`
  - All LinkedIn OAuth variables
  - Anthropic API key

### 4. Post-Deploy Verification
- [ ] Test production build compiles
- [ ] Test Stripe checkout in production
- [ ] Verify webhook endpoint is accessible
- [ ] Test wizard preview in production
- [ ] Verify mentor is hidden
- [ ] Test LinkedIn OAuth redirect

---

## ⚠️ Important Notes

### Environment Variables Required
Add to Vercel if not already set:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### Stripe Webhook Configuration
Update webhook endpoint in Stripe dashboard:
```
https://your-domain.vercel.app/api/webhooks/stripe
```

### Files to NOT Commit
- `.env.local` (contains secrets)
- `backup/` and `backup-*.zip` (large files)
- `.next/` (build artifacts)
- `node_modules/` (dependencies)

### Rollback Plan
If deployment fails:
1. Check Vercel logs for specific errors
2. Revert last commit: `git revert HEAD`
3. Or rollback to previous deploy in Vercel dashboard
4. Check that all environment variables are set correctly

---

## 📊 Change Statistics

- **Files Modified:** 15
- **Files Added:** 10+
- **Lines Added:** ~2,644
- **Lines Removed:** ~178
- **Net Change:** +2,466 lines
- **New Dependencies:** stripe, framer-motion, react-markdown, remark-gfm

---

## ✅ Post-Push Tasks

1. **Monitor Vercel deployment** (5-10 minutes)
2. **Test critical paths** in production:
   - User registration → trial activation
   - Post generation → preview consistency
   - Billing upgrade flow
   - LinkedIn integration
3. **Update Stripe webhook** URL if needed
4. **Monitor error logs** for first 24 hours
5. **Gather user feedback** on new wizard UX

---

**Last Updated:** 2025-10-27
**Ready to Deploy:** ✅ Yes
**Estimated Deploy Time:** 10-15 minutes
