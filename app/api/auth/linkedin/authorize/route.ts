import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Generate state for CSRF protection
    const state = randomBytes(32).toString("hex");

    // Store state in cookie for verification in callback
    const cookieStore = await cookies();
    cookieStore.set("linkedin_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    // Store userId in cookie to associate the OAuth flow with the user
    cookieStore.set("linkedin_oauth_user", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    // Build LinkedIn authorization URL
    const linkedInAuthUrl = new URL(
      "https://www.linkedin.com/oauth/v2/authorization"
    );

    linkedInAuthUrl.searchParams.append("response_type", "code");
    linkedInAuthUrl.searchParams.append(
      "client_id",
      process.env.LINKEDIN_CLIENT_ID || ""
    );
    linkedInAuthUrl.searchParams.append(
      "redirect_uri",
      process.env.LINKEDIN_REDIRECT_URI || ""
    );
    linkedInAuthUrl.searchParams.append("state", state);
    linkedInAuthUrl.searchParams.append("scope", "openid profile email w_member_social");

    // Redirect to LinkedIn
    return NextResponse.redirect(linkedInAuthUrl.toString());
  } catch (error) {
    console.error("LinkedIn authorize error:", error);
    return NextResponse.json(
      { error: "Failed to initiate LinkedIn authorization" },
      { status: 500 }
    );
  }
}
