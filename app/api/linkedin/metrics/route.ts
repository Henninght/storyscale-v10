import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get Firebase auth token from request
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the Firebase token
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get LinkedIn integration from Firestore
    const db = getAdminDb();
    const linkedInDoc = await db
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("linkedin")
      .get();

    if (!linkedInDoc.exists) {
      return NextResponse.json(
        { error: "LinkedIn account not connected" },
        { status: 404 }
      );
    }

    const linkedInData = linkedInDoc.data();

    // Check if token is expired
    const expiresAt = new Date(linkedInData?.expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "LinkedIn access token expired. Please reconnect your account." },
        { status: 401 }
      );
    }

    const accessToken = linkedInData?.accessToken;

    // Fetch user profile info
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error("Failed to fetch LinkedIn profile:", await profileResponse.text());
      return NextResponse.json(
        { error: "Failed to fetch LinkedIn profile" },
        { status: 500 }
      );
    }

    const profileData = await profileResponse.json();

    // Note: Fetching detailed analytics requires Marketing API or other partner program access
    // For basic integration, we return profile info and connection status
    // To get post metrics, you'd need to:
    // 1. Get LinkedIn page/organization ID
    // 2. Call specific analytics endpoints (requires additional permissions)

    const metrics = {
      profile: {
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture,
        sub: profileData.sub,
      },
      connection: {
        connectedAt: linkedInData?.connectedAt,
        expiresAt: linkedInData?.expiresAt,
        scope: linkedInData?.scope,
      },
      // Placeholder for future analytics data
      analytics: {
        note: "Post analytics require LinkedIn Marketing API access. Apply for Marketing Developer Platform at https://business.linkedin.com/marketing-solutions/marketing-partners",
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("LinkedIn metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn metrics" },
      { status: 500 }
    );
  }
}
