# LinkedIn Authentication Setup Guide

This guide explains how to configure LinkedIn as an authentication provider in Storyscale.

## Overview

LinkedIn authentication has been implemented in the codebase using Firebase Auth's `OAuthProvider` with the provider ID `linkedin.com`. Unlike Google, LinkedIn is not available in the Firebase Console UI, but it IS supported programmatically.

## Implementation Status

✅ **Code Implementation Complete**
- `contexts/auth-context.tsx` - Added `signInWithLinkedIn()` method
- `app/login/page.tsx` - Added LinkedIn sign-in button
- `app/signup/page.tsx` - Added LinkedIn sign-up button

## Configuration Steps

### 1. LinkedIn Developer Portal Setup

You need to create a LinkedIn OAuth 2.0 application:

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the application details:
   - **App name**: Storyscale
   - **LinkedIn Page**: Your company page (or create one)
   - **App logo**: Upload your logo
   - **Legal agreement**: Accept terms

4. Once created, go to the **Auth** tab
5. Copy your **Client ID** and **Client Secret**

### 2. Configure Authorized Redirect URIs

In the LinkedIn app's Auth settings, add the following redirect URIs:

**For Development:**
```
http://localhost:3000/__/auth/handler
```

**For Production:**
```
https://storyscale.site/__/auth/handler
https://storyscale-45a2d.firebaseapp.com/__/auth/handler
```

**Note**: Firebase Auth uses the special `__/auth/handler` path for OAuth callbacks.

### 3. Request OAuth Scopes

In the LinkedIn app's **Products** section, you need to request access to:

- **Sign In with LinkedIn** (provides `openid`, `profile`, `email` scopes)

This should be automatically available for your app.

### 4. Environment Variables

You don't need to add LinkedIn credentials to your `.env` file for Firebase Auth to work. Firebase Auth handles the OAuth flow automatically using the provider configuration.

However, if you want to make API calls to LinkedIn (separate from authentication), you would add:

```env
# Optional - only needed for LinkedIn API calls outside of auth
LINKEDIN_AUTH_CLIENT_ID=your_client_id
LINKEDIN_AUTH_CLIENT_SECRET=your_client_secret
```

### 5. Firebase Configuration

**Important**: LinkedIn OAuth through Firebase Auth works WITHOUT additional Firebase Console configuration. The `OAuthProvider('linkedin.com')` class handles everything automatically.

However, you need to ensure your Firebase project's **Authorized Domains** include your domains:

1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", ensure these are listed:
   - `localhost`
   - `storyscale.site`
   - `storyscale-45a2d.firebaseapp.com`

## How It Works

When a user clicks "Continue with LinkedIn":

1. `signInWithLinkedIn()` creates an `OAuthProvider('linkedin.com')`
2. `signInWithPopup(auth, provider)` opens LinkedIn OAuth popup
3. User authorizes Storyscale on LinkedIn
4. LinkedIn redirects to `/__/auth/handler` (Firebase's OAuth handler)
5. Firebase exchanges the auth code for user credentials
6. User is signed in with Firebase Auth
7. User data (name, email, etc.) is stored in Firestore

## User Data Retrieved

From LinkedIn OAuth, you'll receive:

```typescript
{
  uid: "unique-firebase-uid",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://linkedin-profile-photo-url",
  providerId: "linkedin.com"
}
```

## Testing

### Local Testing

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/login` or `/signup`

3. Click "Continue with LinkedIn"

4. You should see LinkedIn's OAuth consent screen

### Production Testing

1. Deploy to production:
   ```bash
   npm run build
   vercel --prod
   ```

2. Test at `https://storyscale.site/login`

## Troubleshooting

### "unauthorized_client" Error

**Cause**: Redirect URI mismatch
**Solution**:
1. Double-check redirect URIs in LinkedIn Developer Portal
2. Ensure you're using the exact Firebase Auth redirect path: `/__/auth/handler`

### "access_denied" Error

**Cause**: User declined authorization or app not approved
**Solution**:
1. Ensure "Sign In with LinkedIn" product is enabled
2. Check if your app needs LinkedIn review (usually not required for basic OAuth)

### "popup_closed_by_user" Error

**Cause**: User closed the popup window
**Solution**: This is normal user behavior, handle gracefully in UI

### OAuth Popup Blocked

**Cause**: Browser blocking popups
**Solution**:
1. Ensure sign-in is triggered by direct user click
2. Don't call `signInWithLinkedIn()` from async callbacks

## Differences from Existing LinkedIn Integration

⚠️ **Important**: This is SEPARATE from your existing LinkedIn posting integration

**Authentication (this implementation)**:
- Purpose: User login/signup
- Provider: `OAuthProvider('linkedin.com')`
- Scopes: `openid`, `profile`, `email`
- Data storage: Firebase Auth + Firestore users collection

**Posting Integration (existing)**:
- Purpose: Post content to LinkedIn
- Implementation: Direct LinkedIn Share API
- Scopes: `w_member_social`
- Data storage: Firestore `users/{uid}/integrations/linkedin`

Users can:
- Log in with LinkedIn (authentication)
- Connect LinkedIn for posting (separate integration)
- These are independent features

## Security Considerations

1. **Client Secret**: Keep your LinkedIn Client Secret secure
2. **Redirect URIs**: Only add trusted domains
3. **Scopes**: Only request necessary permissions
4. **User Data**: Handle user data according to privacy policy

## Additional Resources

- [Firebase Auth OAuthProvider Docs](https://firebase.google.com/docs/auth/web/google-signin#handling_the_sign-in_flow_with_the_firebase_sdk)
- [LinkedIn OAuth 2.0 Docs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Sign In with LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin)

---

## Quick Start Checklist

- [ ] Create LinkedIn OAuth app
- [ ] Copy Client ID and Secret
- [ ] Add authorized redirect URIs (with `/__/auth/handler`)
- [ ] Enable "Sign In with LinkedIn" product
- [ ] Verify Firebase Authorized Domains include your domains
- [ ] Test login flow locally
- [ ] Test login flow in production

Once complete, users will be able to sign in/up using their LinkedIn account!
