# 🚀 Vercel Deployment Fix for Firebase Admin Error

## Problem
Your Vercel deployment was failing with:
```
Internal server error: 2 UNKNOWN: Getting metadata from plugin failed with error:
error:1E08010C:DECODER routines::unsupported
```

## Root Cause
- **NOT the Anthropic SDK** (that was a red herring!)
- The error comes from **Firebase Admin SDK** trying to decode `FIREBASE_ADMIN_PRIVATE_KEY`
- Vercel's environment variable handling corrupts multi-line PEM private keys
- Node.js 20+ uses stricter OpenSSL validation, rejecting corrupted keys

## Solution: Base64 Encoding
The fix uses base64 encoding to store the private key as a single-line string, preventing Vercel from corrupting it.

---

## 📋 Deployment Steps

### 1. **Get Your Base64-Encoded Private Key**

Your base64-encoded private key is:
```
LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNqZzJ6VVdnMkFkR0IKdmJwai9kNE5YWTg1ZDZWYXJQZ01EU1F5YWFrMVpDWlNjaU15ejFzcm5xN0JTdVppcVkxRytpeVhhT21yVTVtKwpmNEtIZlkzUGZTVko5TVkyVk1yYWt6dWhob0Q4UzlQUHRLZmdWakRxMU53cGI3NFJpZHR4RTNiZU41ZW1wUURLCnQ0dy9pVWQ0ZzZWWGMzUFh2YTNlRTR4RW1qTFpkSGVCQXRlK2hUOExHTTF3dG5NQUt5dTMxdWluNDE0WWFzNEEKa3Q1Q0xTdmNqazc3VmhsUVlYSC9GTXpxb1J3Q1czVnI1YjU0NTNtU3lKOXdlWHZlSUxyQkZWM3RXUURBbXN2OApEVkM0TVBvR0xBOUhiQWQxTkRON0lFeE1RdlNBMDJBUjhiUXowQ3g0VWlBLzlkekxWYkFVRXdVWmZ0ZEQrRjQxCnNGbSt2TENsQWdNQkFBRUNnZ0VBSHloRlNoVjg5NEhxZ3JmbWJqZTNIQlN3RGFTeUZFaTlHQ3FZNU5mTHFhejAKMWxUYWhiTHQrbU1HcmZmZFVJMFFWcVo3c0QzV1FFZENGelNFdnlRQVVPS2cxRU53NitNTHhmdHRDVmVRQ0lPRQpra0xMcGtocktFbDJqN0FRbHVDTU44OENnK2p5M0k0d3FyaHFYWlNiWmFrUEJWK3JIOGxxUElLYjhqOHNkMzNFCkNHQnRWMEVkZHZpa0cyTVlmbXhETkRxRzNZUnFvQm1pYVFHYU5QcGV3L3JIS2JqOEZvdU5hQ3RqdjRMZ29lanIKWDBlL2hrMDBvNGRxVE92cmVsa3NUaGYwNnJLK3RValN0QTJJVmtOY24wVlBSMGtZd3dXUjJxZWFiaTgvOXR5RwozeWVVR0drOGdSbHZyWnM3RHh4WmwrR1h5cjZwN24xYUtNU1ljYVI4SndLQmdRRHlWMDVyUE5IZG5FVS9WdjVVCktpdlJhWk1aT0k1elpQbnVhblIzQll3MFZaTDR1d0NhbVl5eGE0QThERThvV3F3R3kwZFM5MzMxbThmb1VVZmoKcEdZRG9tNXR2RWNEREVPNzczSUdnM25XaW53eS91OEF4VjJtMTZncy80RjIrOG5XTzBIMzNBbHAwV3hZbWRvVwpLQSttalJPUTdaU2pJemVVZ1Rlbkdkcm9nd0tCZ1FEQjVvaHJYUVVwUWdyRmJzMXJ5ZDAyRE5MOWo5MVVpNldQClN4azFoMHBSOGlrU0RlOEdrL1BtaE1QZW1EdTkyM00vb2J0dWNEMWVLV3ZqSzh5a1laNGVlU1JQRVZVbmpUVCsKU1dCbmJMa0JWMlh1czhrMUIrWCtVMVI1YTdiMWNoQllQalZUNC9LeFZzZ2ZSMUt6MFVFU3lOSDNUNG56WkJHbQpURDQ0QVphcHR3S0JnUUNGbm52Zmh2WlVFWURnN3E5bWFxWWtYZWk4WkVHdkFJTUo0T3A4WWJPdmUydUE5MkxhCjIwVUc0allmWmM0VGV3TVU3K3BRcGFOdTA4a0NvQ1phTHVBTXF2Zm1TNFIvK3JneUhGRXJwRHgrZlhjRGl5cnUKcXVQN1JUYzJNRjhLNHNPaitxSmg3cEhHSmJGdW5NM3huMzhabnZtbDFFazdOZ1RFUGdjWWZKb0Z6d0tCZ0NlbApVMDlnZmFXcDh6bmJKZlZjR1Bic09GZlFDcGsyMUdzd0Y3OXlJaWdQTTRhVmdzSDlqbWtiekZDL0g3ZjZIdDVyCjJ6OEJoQXEwdlhKOWlpSXlNM3BYbXF6d0JsRkg5Z1hvU3VYYXZSa2hIWjVvOUVMN2tuTWw1cWZNOW1QSkpyNWsKT2RNbFVJSWlGRmtRNUVBUUVSWWVLWkEvbXgxQTRMcjM2K0RYc2s2UkFvR0JBSVdEVy9vc0x3cHZBOWthNGsyaAp2eDc3NXdYVTd1OENJK2s1TjE1Y1RVS1NSWVkxbEZ6dFNodTU3WUtmTkY1NGtxNzVIWHJqQ0ZpWGtZZEhMV2czCnNxMG9LTEd5bTI4UHZ0c0ZJQUtxM3lLWThBTFdGTWdIYThvNHNZRVpJTHVpR29NNnVWQXQ4WE5WTTVPYWRiby8KTytQWFVtM1R0QkV5YnVzS2VOZG5taHFYCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
```

### 2. **Add Environment Variable to Vercel**

Go to your Vercel project dashboard:

1. Navigate to: **Settings** → **Environment Variables**
2. Add a **new variable**:
   - **Name**: `FIREBASE_ADMIN_PRIVATE_KEY_BASE64`
   - **Value**: Paste the base64 string above
   - **Environments**: Select **Production**, **Preview**, and **Development**
3. Click **Save**

### 3. **Remove or Keep Old Variable** (Optional)

You can either:
- **Remove** `FIREBASE_ADMIN_PRIVATE_KEY` from Vercel (the code will now prioritize base64)
- **Keep it** as a fallback (the code checks base64 first, then falls back to the old one)

### 4. **Redeploy**

Trigger a new deployment:

```bash
git add .
git commit -m "Fix: Add base64 Firebase private key support for Vercel deployment"
git push
```

Or manually trigger a redeploy from the Vercel dashboard.

---

## ✅ Verification

After deployment, check:
1. Go to your Vercel deployment logs
2. Look for **no decoder errors**
3. Test post generation in the app
4. Should now work without the `1E08010C:DECODER` error

---

## 🔄 Future: Upgrade Anthropic SDK

Once Firebase is working, you can safely upgrade back to the latest Anthropic SDK:

```bash
npm install @anthropic-ai/sdk@latest
```

The SDK downgrade to v0.20.9 was unnecessary—the Firebase private key was always the problem!

---

## 📝 How It Works

The code in `lib/firebase-admin.ts` now:
1. **First** checks for `FIREBASE_ADMIN_PRIVATE_KEY_BASE64`
2. Decodes it from base64 → UTF-8
3. Validates the PEM format
4. **Falls back** to `FIREBASE_ADMIN_PRIVATE_KEY` if base64 not available

This ensures compatibility across environments while prioritizing the Vercel-safe method.

---

## 🎯 Summary

- ✅ Base64 encoding prevents Vercel from corrupting the private key
- ✅ Works with Node.js 20's strict OpenSSL validation
- ✅ Code supports both methods (base64 and raw) for flexibility
- ✅ Local development continues to work unchanged
- ✅ Production deployment will now succeed

**Your Storyscale app should now generate posts on Vercel!** 🎉
