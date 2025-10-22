import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { error: "User ID and content are required" },
        { status: 400 }
      );
    }

    // Fetch LinkedIn integration data from Firestore
    const db = getAdminDb();
    const linkedInDoc = await db
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("linkedin")
      .get();

    if (!linkedInDoc.exists) {
      return NextResponse.json(
        { error: "LinkedIn not connected" },
        { status: 400 }
      );
    }

    const linkedInData = linkedInDoc.data();
    const accessToken = linkedInData?.accessToken;
    const personUrn = linkedInData?.personUrn;

    // Log what we have for debugging
    console.log("LinkedIn data check:", {
      hasAccessToken: !!accessToken,
      hasPersonUrn: !!personUrn,
      dataKeys: linkedInData ? Object.keys(linkedInData) : [],
    });

    if (!accessToken || !personUrn) {
      return NextResponse.json(
        {
          error: "LinkedIn authentication data missing",
          details: {
            hasAccessToken: !!accessToken,
            hasPersonUrn: !!personUrn,
            availableFields: linkedInData ? Object.keys(linkedInData) : [],
          }
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(linkedInData.expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "LinkedIn access token expired. Please reconnect." },
        { status: 401 }
      );
    }

    // Prepare the post request body
    const postData = {
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // Post to LinkedIn
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("LinkedIn post failed:", errorData);
      return NextResponse.json(
        { error: "Failed to post to LinkedIn", details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      postId: result.id,
      message: "Successfully posted to LinkedIn",
    });
  } catch (error) {
    console.error("LinkedIn post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
