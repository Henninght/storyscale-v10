import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

// Feature flag for LinkedIn image posting (will be enabled when Community Management API is approved)
const LINKEDIN_IMAGES_ENABLED = false;

export async function POST(request: NextRequest) {
  try {
    const { userId, content, images } = await request.json();

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

    // Handle images (when Community Management API is approved)
    let mediaAssets: any[] = [];
    if (images && images.length > 0) {
      if (!LINKEDIN_IMAGES_ENABLED) {
        console.warn("⚠️ Images attached but LinkedIn Community Management API not yet approved");
        // For now, post text-only. When API is approved, set LINKEDIN_IMAGES_ENABLED = true
      } else {
        console.log(`📸 Uploading ${images.length} images to LinkedIn...`);

        // Upload each image to LinkedIn and collect asset URNs
        for (const image of images) {
          try {
            // Step 1: Register upload
            const registerResponse = await fetch(
              "https://api.linkedin.com/v2/assets?action=registerUpload",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  registerUploadRequest: {
                    recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                    owner: personUrn,
                    serviceRelationships: [{
                      relationshipType: "OWNER",
                      identifier: "urn:li:userGeneratedContent"
                    }]
                  }
                }),
              }
            );

            if (!registerResponse.ok) {
              console.error("Failed to register image upload:", await registerResponse.text());
              continue;
            }

            const registerData = await registerResponse.json();
            const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
            const assetUrn = registerData.value.asset;

            // Step 2: Upload image binary
            const imageResponse = await fetch(image.url);
            const imageBuffer = await imageResponse.arrayBuffer();

            const uploadResponse = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: imageBuffer,
            });

            if (!uploadResponse.ok) {
              console.error("Failed to upload image binary:", await uploadResponse.text());
              continue;
            }

            // Add asset to media array
            mediaAssets.push({
              status: "READY",
              media: assetUrn,
              description: {
                text: image.alt || ""
              }
            });

            console.log(`✅ Uploaded image: ${image.id}`);
          } catch (imageError) {
            console.error("Error uploading image:", imageError);
            // Continue with other images even if one fails
          }
        }
      }
    }

    // Prepare the post request body
    const hasMedia = mediaAssets.length > 0;
    const postData = {
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: hasMedia ? "IMAGE" : "NONE",
          ...(hasMedia && { media: mediaAssets }),
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
