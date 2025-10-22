import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
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

    // Delete LinkedIn integration from Firestore
    const db = getAdminDb();
    await db
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("linkedin")
      .delete();

    return NextResponse.json({
      success: true,
      message: "LinkedIn account disconnected successfully",
    });
  } catch (error) {
    console.error("LinkedIn disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect LinkedIn account" },
      { status: 500 }
    );
  }
}
