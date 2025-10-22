import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("LinkedIn OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=missing_parameters`
      );
    }

    // Verify state to prevent CSRF attacks
    const cookieStore = await cookies();
    const storedState = cookieStore.get("linkedin_oauth_state")?.value;
    const userId = cookieStore.get("linkedin_oauth_user")?.value;

    if (!storedState || storedState !== state) {
      console.error("State mismatch - potential CSRF attack");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=state_mismatch`
      );
    }

    if (!userId) {
      console.error("No user ID found in cookie");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=no_user`
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID || "",
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("LinkedIn token exchange failed:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("🔑 Token received with scopes:", tokenData.scope);

    // Fetch user profile information from LinkedIn
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error("Failed to fetch LinkedIn profile");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=profile_fetch_failed`
      );
    }

    const profileData = await profileResponse.json();

    // Extract person URN from profile data (sub field contains the person ID)
    // The 'sub' field from userinfo endpoint contains the person ID
    let personUrn = null;
    if (profileData.sub) {
      // The sub field is the person ID, construct the full URN
      personUrn = `urn:li:person:${profileData.sub}`;
      console.log("✅ Successfully extracted person URN from profile:", personUrn);
    } else {
      console.error("❌ No 'sub' field found in profile data:", profileData);
    }

    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Store LinkedIn integration data in Firestore
    const db = getAdminDb();
    await db
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("linkedin")
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: expiresAt.toISOString(),
        connectedAt: new Date().toISOString(),
        scope: tokenData.scope,
        personUrn: personUrn,
        profile: {
          sub: profileData.sub,
          name: profileData.name,
          given_name: profileData.given_name,
          family_name: profileData.family_name,
          picture: profileData.picture,
          email: profileData.email,
          email_verified: profileData.email_verified,
        },
      });

    // Clear OAuth cookies
    cookieStore.delete("linkedin_oauth_state");
    cookieStore.delete("linkedin_oauth_user");

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_connected=true`
    );
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?linkedin_error=unexpected_error`
    );
  }
}
