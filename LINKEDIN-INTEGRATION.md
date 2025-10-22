# StoryScale LinkedIn Integration

This document outlines StoryScale's LinkedIn integration capabilities, including currently implemented features and future possibilities with the LinkedIn Marketing API.

---

## Current Integration: Share on LinkedIn API

### Status: ✅ Implemented

### Overview
StoryScale is currently integrated with LinkedIn's **Share on LinkedIn API** (Default Tier), which enables basic posting functionality to LinkedIn profiles.

### Features Implemented

#### 1. OAuth 2.0 Authentication
- **Flow**: Authorization Code Grant
- **Scopes**: `openid`, `profile`, `email`, `w_member_social`
- **Security**: CSRF protection with state parameter, secure cookie storage
- **Implementation**:
  - `/app/api/auth/linkedin/authorize/route.ts` - Initiates OAuth flow
  - `/app/api/auth/linkedin/callback/route.ts` - Handles callback and token exchange

#### 2. LinkedIn Account Connection
- **Location**: Settings page (`/app/settings`)
- **Features**:
  - One-click connection to LinkedIn
  - Visual connection status indicator in sidebar
  - Profile information storage (name, email, picture)
  - Person URN storage for posting

#### 3. Post to LinkedIn
- **Endpoint**: `POST /api/linkedin/post`
- **Features**:
  - Publish posts directly to LinkedIn from DraftEditor
  - Text-only posts (no media support in current tier)
  - Public visibility posts
  - Automatic draft status update to "posted"
  - LinkedIn post ID tracking
- **Implementation**: `/components/DraftEditor.tsx`

#### 4. Token Management
- **Storage**: Firebase Firestore (`users/{userId}/integrations/linkedin`)
- **Expiration Tracking**: Token expiry validation before posting
- **Refresh**: Manual reconnection required when token expires

### Technical Details

#### API Endpoints Used
- **Authorization**: `https://www.linkedin.com/oauth/v2/authorization`
- **Token Exchange**: `https://www.linkedin.com/oauth/v2/accessToken`
- **User Profile**: `https://api.linkedin.com/v2/userinfo`
- **Person URN**: `https://api.linkedin.com/v2/me`
- **Post Creation**: `https://api.linkedin.com/v2/ugcPosts`

#### OAuth Scopes
| Scope | Purpose |
|-------|---------|
| `openid` | OpenID Connect authentication |
| `profile` | Access to basic profile information |
| `email` | Access to email address |
| `w_member_social` | Permission to post on behalf of user |

#### Data Stored in Firestore
```typescript
{
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string (ISO format),
  connectedAt: string (ISO format),
  scope: string,
  personUrn: string, // e.g., "urn:li:person:XXXXX"
  profile: {
    sub: string,
    name: string,
    given_name: string,
    family_name: string,
    picture: string,
    email: string,
    email_verified: boolean
  }
}
```

### Current Limitations
- ❌ No analytics or metrics access
- ❌ Text-only posts (no images, videos, or documents)
- ❌ No comment or engagement data
- ❌ No post scheduling on LinkedIn's side
- ❌ No Organization/Company page posting
- ❌ No post editing or deletion
- ❌ No follower/connection insights

---

## Future Possibilities: LinkedIn Marketing Developer Platform

### Status: 🔄 Application Submitted (Pending Approval)

### Application Details
- **App Name**: Storyscale Community
- **Client ID**: `77rhnh6awqg02j`
- **Requested Product**: Community Management API (Development Tier)
- **Verification Email**: storyscale@storyscale.site
- **Pending**: Email verification from Microsoft Vetting Services

### What Will Be Possible with Marketing API

#### 1. Advanced Analytics & Insights
- **Post Analytics**:
  - Views, impressions, clicks
  - Engagement metrics (likes, comments, shares)
  - Click-through rates
  - Audience demographics
  - Time-series data for performance tracking

- **Profile Analytics**:
  - Follower growth over time
  - Follower demographics
  - Page views and visits
  - Engagement trends

#### 2. Organization/Company Page Management
- **Features**:
  - Post to Organization pages (not just personal profile)
  - Multiple organization page support
  - Organization follower analytics
  - Company page performance metrics

#### 3. Enhanced Post Capabilities
- **Media Support**:
  - Image posts (single and carousel)
  - Video posts with thumbnails
  - Document posts (PDFs, presentations)
  - Article posts with rich previews

- **Advanced Posting**:
  - Targeted audience posts (by location, industry, etc.)
  - Scheduled publishing via LinkedIn
  - Post editing capabilities
  - Draft management on LinkedIn

#### 4. Engagement & Community Management
- **Features**:
  - Read and respond to comments
  - Monitor mentions and tags
  - Track post engagement in real-time
  - Social listening capabilities
  - Sentiment analysis data

#### 5. Lead Generation
- **Features**:
  - Lead Gen Form data access
  - Campaign tracking
  - Conversion metrics
  - UTM parameter tracking
  - Sponsored content performance

#### 6. Messaging & Networking
- **Features**:
  - Direct message capabilities
  - Connection request management
  - Conversation tracking
  - Automated response workflows

### Potential StoryScale Features (Post-Approval)

#### Dashboard Enhancements
```
✨ LinkedIn Analytics Dashboard
- Real-time post performance metrics
- Engagement rate charts
- Best performing posts analysis
- Audience growth tracking
- Optimal posting time recommendations
```

#### Content Optimization
```
✨ AI-Powered Optimization
- Engagement prediction based on historical data
- Content recommendations based on top performers
- Audience targeting suggestions
- Hashtag performance analysis
- A/B testing for post variations
```

#### Campaign Management
```
✨ Advanced Campaign Tools
- Multi-post campaign tracking
- Campaign-level analytics
- ROI measurement
- Competitor benchmarking
- Automated reporting
```

#### Media Management
```
✨ Rich Media Support
- Image upload and optimization
- Video upload with transcoding
- Document sharing
- Media library management
- Branded templates
```

### API Endpoints Available (After Approval)

| API | Endpoint | Purpose |
|-----|----------|---------|
| Analytics | `/v2/organizationPageStatistics` | Organization page metrics |
| Analytics | `/v2/socialActions` | Post engagement data |
| Media | `/v2/assets` | Upload images/videos |
| Posting | `/v2/shares` | Advanced post creation with media |
| Organizations | `/v2/organizationAcls` | Manage organization permissions |
| Comments | `/v2/socialActions/{id}/comments` | Manage post comments |

### OAuth Scopes Required (After Approval)
| Scope | Purpose |
|-------|---------|
| `r_organization_social` | Read organization posts and analytics |
| `w_organization_social` | Post to organization pages |
| `rw_organization_admin` | Manage organization page settings |
| `r_basicprofile` | Read member profile |
| `r_emailaddress` | Read member email |
| `w_member_social` | Post to member profile |

---

## Implementation Roadmap

### Phase 1: Current (Share on LinkedIn API) ✅
- [x] OAuth authentication
- [x] Profile connection
- [x] Basic text posting
- [x] Connection status display
- [x] Token management

### Phase 2: Pending Approval 🔄
- [ ] Email verification completion
- [ ] LinkedIn review and approval
- [ ] Development Tier access granted

### Phase 3: Marketing API Integration (Post-Approval)
- [ ] Update OAuth scopes
- [ ] Implement media upload
- [ ] Add analytics endpoints
- [ ] Build analytics dashboard
- [ ] Organization page posting
- [ ] Enhanced post editor with media

### Phase 4: Advanced Features (Post-Approval)
- [ ] Real-time engagement tracking
- [ ] Comment management
- [ ] AI-powered content optimization
- [ ] Campaign-level analytics
- [ ] Automated reporting
- [ ] Multi-account management

---

## Configuration & Setup

### Environment Variables Required
```env
LINKEDIN_CLIENT_ID=777n9x089dv97a
LINKEDIN_CLIENT_SECRET=[your-secret]
LINKEDIN_REDIRECT_URI=https://storyscale.site/api/auth/linkedin/callback
```

### For Marketing API (After Approval)
```env
# Additional configuration for Community Management App
LINKEDIN_COMMUNITY_CLIENT_ID=77rhnh6awqg02j
LINKEDIN_COMMUNITY_CLIENT_SECRET=[your-secret]
LINKEDIN_COMMUNITY_REDIRECT_URI=https://storyscale.site/api/auth/linkedin/community/callback
```

---

## Resources

### Current Integration
- [LinkedIn Share on LinkedIn API Docs](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)
- [OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)

### Future Integration
- [LinkedIn Marketing Developer Platform](https://www.linkedin.com/developers/apps)
- [Community Management API](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management)
- [Analytics API](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/organizations/organization-page-statistics)
- [Media Upload Guide](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/rich-media-shares)

---

## Support & Troubleshooting

### Common Issues

#### "unauthorized_scope_error"
**Cause**: The `w_member_social` scope is not enabled on your LinkedIn app.
**Solution**:
1. Go to LinkedIn Developer Portal
2. Navigate to your app → Products → Share on LinkedIn
3. Ensure `w_member_social` scope is selected
4. Reconnect your LinkedIn account in Settings

#### "LinkedIn access token expired"
**Cause**: Access token has expired (typically after 60 days)
**Solution**:
1. Go to Settings page
2. Click "Connect to LinkedIn" again to refresh token

#### "LinkedIn not connected"
**Cause**: User hasn't connected LinkedIn account
**Solution**:
1. Navigate to `/app/settings`
2. Click "Connect to LinkedIn"
3. Authorize StoryScale

---

## Changelog

### 2025-10-21
- ✅ Implemented Share on LinkedIn API integration
- ✅ Added OAuth 2.0 authentication flow
- ✅ Created post-to-LinkedIn functionality in DraftEditor
- ✅ Added LinkedIn connection status in sidebar
- 🔄 Submitted Community Management API access request

---

*Last updated: October 21, 2025*
