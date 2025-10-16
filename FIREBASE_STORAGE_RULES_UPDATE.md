# Firebase Storage Rules Update

## Overview
To enable the document upload feature for campaigns, you need to update your Firebase Storage security rules.

## How to Update Firebase Storage Rules

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Storyscale**
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Add Campaign Documents Rules
Add the following rules to your existing Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Existing rules for profile photos (keep as is)
    match /profile-photos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // NEW: Campaign documents rules
    match /campaign-documents/{userId}/{fileName} {
      // Users can only read their own documents
      allow read: if request.auth != null && request.auth.uid == userId;

      // Users can only write to their own folder
      // File must be PDF, DOCX, or PPTX
      // File size must be under 7MB
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 7 * 1024 * 1024
                   && (request.resource.contentType.matches('application/pdf')
                       || request.resource.contentType.matches('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                       || request.resource.contentType.matches('application/vnd.openxmlformats-officedocument.presentationml.presentation'));

      // Allow deletion of own documents
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** to deploy the new rules
2. Wait for confirmation that rules are published

## Security Features

The rules above ensure:
- ✅ Users can only upload to their own folder (`/campaign-documents/{userId}/`)
- ✅ Only authenticated users can upload
- ✅ File size is limited to 7MB
- ✅ Only PDF, DOCX, and PPTX files are allowed
- ✅ Users can only read/delete their own documents
- ✅ Private documents are isolated per user

## Testing

After updating the rules, test the upload feature:
1. Go to **Campaigns** page
2. Click **New Campaign**
3. Try uploading a PDF, DOCX, or PPTX file
4. Verify the file uploads successfully
5. Try uploading a file over 7MB (should fail)
6. Try uploading an invalid file type like .txt (should fail)

## Troubleshooting

**Error: "Permission denied"**
- Ensure you're logged in
- Check that the rules have been published
- Verify the file is under 7MB and is PDF/DOCX/PPTX

**Error: "File too large"**
- Files must be under 7MB
- Consider compressing large PDFs or PowerPoints

**Error: "Invalid file type"**
- Only .pdf, .docx, and .pptx files are supported
- For other formats, try converting to PDF first
