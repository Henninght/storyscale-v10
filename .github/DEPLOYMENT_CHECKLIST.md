# 🚀 Vercel Deployment Checklist

Use this checklist when deploying to Vercel or setting up a new environment.

## Environment Variables Setup

### Firebase Admin (Required)

- [ ] `FIREBASE_ADMIN_PROJECT_ID` - Your Firebase project ID
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL` - Service account email
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY_BASE64` - **Base64-encoded private key** (CRITICAL for Vercel!)
  - ⚠️ **DO NOT use raw `FIREBASE_ADMIN_PRIVATE_KEY` on Vercel**
  - Generate with: `echo "YOUR_PRIVATE_KEY" | base64`
  - Must be a single-line base64 string

### Firebase Client (Required)

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Anthropic API (Required)

- [ ] `ANTHROPIC_API_KEY` - Your Claude API key

### App Configuration (Required)

- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://storyscale.vercel.app)

### Stripe (Optional - for billing)

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_ID_PRO`
- [ ] `STRIPE_PRICE_ID_ENTERPRISE`

## Common Issues & Solutions

### Issue: `error:1E08010C:DECODER routines::unsupported`

**Cause:** Firebase private key is corrupted by Vercel's environment variable handling

**Solution:**
- Use `FIREBASE_ADMIN_PRIVATE_KEY_BASE64` instead of raw private key
- See `VERCEL_DEPLOYMENT_FIX.md` for detailed instructions

### Issue: Posts not generating

**Check:**
- Anthropic API key is valid and has credits
- Firebase Admin credentials are correct
- Check Vercel function logs for specific errors

### Issue: Authentication failing

**Check:**
- Firebase client config (`NEXT_PUBLIC_*` variables) are correct
- Firebase Auth is enabled in Firebase Console
- Authorized domains include your Vercel domain

## Deployment Steps

1. **Set all environment variables in Vercel**
   - Go to Settings → Environment Variables
   - Add all required variables from checklist above
   - Select appropriate environments (Production, Preview, Development)

2. **Verify Node.js version**
   - Current: Node.js 20+ (as specified in `vercel.json` or detected by Vercel)
   - Firebase Admin SDK 13.5.0+ requires Node.js 20+

3. **Deploy**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

4. **Verify deployment**
   - Check build logs for errors
   - Test post generation in production
   - Check Vercel function logs if issues occur

## Testing Before Deploying

```bash
# Run locally with production-like environment
npm run build
npm start

# Test post generation
# Navigate to /app/create and try generating a post
```

## Emergency Rollback

If deployment fails:

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find last working deployment
4. Click "..." → "Promote to Production"

## Notes

- Always test environment variables locally before deploying
- Keep `.env.local` updated but NEVER commit it
- Update `.env.example` when adding new required variables
- Use Vercel CLI for faster environment variable management: `vercel env pull`
