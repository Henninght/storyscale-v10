import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.LINKEDIN_AUTH_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_AUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "LinkedIn OAuth not configured" },
      { status: 500 }
    );
  }

  // Generate random state for CSRF protection
  const state = Math.random().toString(36).substring(7);

  // Build LinkedIn authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: "openid profile email",
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

  // Redirect to LinkedIn authorization page
  return NextResponse.redirect(authUrl);
}
