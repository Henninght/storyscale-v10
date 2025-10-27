# LinkedIn Authentication Implementation Status

## ✅ Completed Work

### 1. **Code Implementation**
All authentication code has been successfully implemented:

- **`contexts/auth-context.tsx`** (lines 58-65)
  - Added `signInWithLinkedIn()` method using `OAuthProvider('oidc.linkedin')`
  - Configured OpenID Connect scopes: `openid`, `profile`, `email`
  - Integrated with Firebase Auth popup flow

- **`app/login/page.tsx`** (lines 54-87)
  - Added LinkedIn sign-in button with proper styling
  - Implemented `handleLinkedInSignIn()` with onboarding flow
  - Error handling and loading states

- **`app/signup/page.tsx`** (lines 34-45)
  - Added LinkedIn sign-up button
  - Same authentication flow as login

### 2. **LinkedIn Developer Portal Configuration** ✓
- Created/configured "Storyscale" app (Client ID: `777n9x089dv97a`)
- Added Firebase OAuth redirect URIs:
  - `http://localhost:3000/__/auth/handler`
  - `https://storyscale.site/__/auth/handler`
  - `https://storyscale-45a2d.firebaseapp.com/__/auth/handler`
- Enabled "Sign In with LinkedIn using OpenID Connect" product
- Available scopes: `openid`, `profile`, `email`, `w_member_social`

### 3. **UI Components** ✓
- LinkedIn buttons added to login and signup pages
- Proper LinkedIn brand colors (#0A66C2)
- Lucide React LinkedIn icon
- Consistent styling with Google sign-in button

## ⚠️ Current Technical Challenge

### The Problem
Firebase/Google Cloud Identity Platform's integration with LinkedIn has a compatibility issue:

**Attempt 1: Built-in LinkedIn Provider**
- Firebase's native `linkedin.com` provider uses **deprecated OAuth 2.0 scopes**
- Error: `unauthorized_scope_error` - Scope `r_emailaddress` is not authorized
- LinkedIn now requires OpenID Connect scopes (`openid`, `profile`, `email`)
- Cannot override scopes in Firebase's built-in provider

**Attempt 2: OpenID Connect (OIDC) Provider**
- Configured LinkedIn as generic OIDC provider (`oidc.linkedin`)
- **Tested with correct issuer**: `https://www.linkedin.com/oauth` (verified via discovery document)
- LinkedIn's authorization endpoint works correctly (user consent screen appears)
- **Critical Error**: Token exchange fails with `invalid_request` - `client_secret` parameter missing
- **Root Issue**: Firebase's OIDC implementation doesn't send `client_secret` in the format LinkedIn expects
- LinkedIn's token endpoint (`https://www.linkedin.com/oauth/v2/accessToken`) requires form-encoded POST with `client_secret`
- Firebase appears to send credentials differently than LinkedIn's non-standard OIDC implementation expects

### Root Cause
LinkedIn's OAuth 2.0 implementation:
1. Uses **OpenID Connect scopes** (`openid`, `profile`, `email`) ✓
2. **Does** provide an OIDC discovery document at `https://www.linkedin.com/oauth/.well-known/openid-configuration` ✓
3. Has **non-standard token endpoint behavior** that doesn't match Firebase's expectations ✗

**The Critical Incompatibility:**
- LinkedIn's token endpoint expects `client_secret` as a form parameter in the POST body
- Firebase's OIDC provider implementation sends credentials in a different format (possibly Basic Auth or different encoding)
- This mismatch causes LinkedIn to reject the token exchange with "client_secret parameter missing"

Firebase Auth expects either:
- Fully compliant OIDC providers (with **strictly standard** token endpoint behavior)
- OR their hardcoded built-in providers

LinkedIn has a discovery document BUT its token endpoint implementation deviates from OIDC standards, making it incompatible with Firebase's generic OIDC provider.

## 🔧 Possible Solutions

### Option 1: Custom Backend OAuth Handler (Recommended)
Implement LinkedIn OAuth flow server-side:

```typescript
// pages/api/auth/linkedin/callback.ts
export default async function handler(req, res) {
  const { code } = req.query;

  // Exchange code for token with LinkedIn
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Get user profile
  const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${access_token}` },
  });

  const profile = await profileResponse.json();

  // Create custom Firebase token
  const customToken = await admin.auth().createCustomToken(profile.sub, {
    provider: 'linkedin',
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  });

  // Return token to client
  res.redirect(`/auth/callback?token=${customToken}`);
}
```

**Pros:**
- Full control over OAuth flow
- Works with LinkedIn's actual implementation
- Can handle token refresh
- Most reliable solution

**Cons:**
- Requires backend API routes
- More complex implementation
- Need to secure client secret on server

### Option 2: Wait for Firebase Update
Monitor Firebase Auth updates for LinkedIn OpenID Connect support.

**Pros:**
- No code changes needed once updated
- Maintained by Google

**Cons:**
- Unknown timeline
- May never be updated

### Option 3: Use NextAuth.js
Integrate NextAuth.js which has better LinkedIn support:

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth"
import LinkedInProvider from "next-auth/providers/linkedin"

export default NextAuth({
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: { scope: 'openid profile email' },
      },
    }),
  ],
})
```

**Pros:**
- Built-in LinkedIn support with correct scopes
- Handles session management
- Active maintenance

**Cons:**
- Requires migration from Firebase Auth
- Different authentication architecture

## 📋 Next Steps

### Immediate Actions
1. **Decision**: Choose which solution to implement
2. **If Option 1 (Backend OAuth)**:
   - Create `/pages/api/auth/linkedin/` route
   - Implement OAuth code exchange
   - Create custom Firebase token flow
   - Test end-to-end authentication

3. **If Option 2 (Wait)**:
   - Remove LinkedIn buttons temporarily
   - Add to roadmap
   - Monitor Firebase changelog

4. **If Option 3 (NextAuth)**:
   - Evaluate migration effort
   - Plan Firebase to NextAuth migration
   - Implement LinkedIn provider

### Files Ready for Production
- ✅ `contexts/auth-context.tsx` - Ready (just needs provider ID update if solution changes)
- ✅ `app/login/page.tsx` - Ready
- ✅ `app/signup/page.tsx` - Ready
- ✅ LinkedIn Developer Portal - Configured
- ⚠️ Google Cloud Identity Platform - Needs solution implementation

## 🔑 Credentials
- **Client ID**: `777n9x089dv97a`
- **Client Secret**: Stored in Google Cloud Console
- **Redirect URIs**: Configured in LinkedIn app

## 📚 References
- [LinkedIn Sign In with OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [Firebase Custom Auth](https://firebase.google.com/docs/auth/web/custom-auth)
- [NextAuth LinkedIn Provider](https://next-auth.js.org/providers/linkedin)
