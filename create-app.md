# Storyscale - Implementation Plan

> SaaS application for creating viral LinkedIn content using AI

## 📊 Project Overview

**Tech Stack:**
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- Backend: Firebase (Firestore, Authentication)
- AI: Anthropic Claude Sonnet 4.5
- Payments: Stripe
- Deployment: Vercel
- Version Control: GitHub

**Design System:**
- Primary: Orange (#F97316)
- Secondary: Slate Grey (#64748B)
- Background: Light Grey (#F8FAFC)
- Cards: White (#FFFFFF)
- Accent: Amber (#F59E0B)
- Typography: Outfit (headings), Inter (body)
- Layout: 240px sidebar, 1280px container, 8px grid system

---

## 📌 Status Legend

- ⚪ **Not Started** - Task not yet begun
- ⏳ **In Progress** - Currently working on this
- ✅ **Finished** - Task completed
- 🔴 **Needs Attention** - Blocked or requires review

---

## Phase 1: Foundation & Setup ✅

### 1.1 Project Initialization ✅
- ✅ Initialize Next.js 14+ with TypeScript and App Router
- ✅ Configure Tailwind CSS with custom theme colors
- ✅ Install core dependencies:
  - ✅ Firebase SDK (firebase, firebase-admin)
  - ✅ @anthropic-ai/sdk
  - ✅ stripe
  - ✅ date-fns
- ✅ Set up Shadcn/ui component library
- ✅ Configure 8px grid system and responsive breakpoints

### 1.2 Environment & Configuration ✅
- ✅ Create `.env.example` with all environment variables
- ✅ Set up Firebase project (Firestore + Authentication)
- ✅ Configure Vercel project and deploy
- ✅ Initialize GitHub repository
- ✅ Create Firestore security rules template
- ✅ Create Firebase Storage rules template
- ✅ Deploy Firestore security rules
- ✅ Configure Firebase authorized domains

### 1.3 Design System Foundation ✅
- ✅ Install and configure fonts (Outfit 600/700, Inter 400/500/600)
- ✅ Create reusable layout components:
  - ✅ Sidebar component (240px, collapsible)
  - ✅ Container component (max-w-1280px)
- ✅ Build color palette constants
- ✅ Extend Tailwind theme with custom values

---

## Phase 2: Landing & Authentication

### 2.1 Landing Page ✅
- ✅ Hero section with value proposition
- ✅ Create metaphorical "scaling up" animation
- ✅ Feature highlights section (3-4 features)
- ✅ Pricing table component (Free $0, Pro $20, Enterprise $40)
- ✅ Smooth scroll navigation
- ✅ Fade-in animations
- ✅ CTA buttons (Sign Up, Login)

### 2.2 Authentication System ✅
- ✅ Set up Firebase Auth with Google OAuth provider
- ✅ Implement email/password registration with verification
- ✅ Create AuthContext and provider for session management
- ✅ Build session management and token refresh logic
- ✅ Create login form with validation
- ✅ Create signup form with validation
- ✅ Add error handling and user feedback
- ✅ Enable Google sign-in in Firebase Console
- ✅ Test authentication flows (local and production)
- ✅ Fix Firebase API key configuration
- ⚪ Create protected route middleware for `/app/*` - *optional for development*

---

## Phase 3: Onboarding & Profile ✅

### 3.1 Profile Creation Flow ✅
- ✅ Multi-step onboarding wizard (6 questions)
- ✅ Step: Professional background input
- ✅ Step: Areas of expertise
- ✅ Step: Target audience selection
- ✅ Step: Goals for using Storyscale
- ✅ Step: Preferred writing style
- ✅ Step: Brand voice traits
- ✅ Progress indicator component
- ✅ Auto-save functionality (every 30s)
- ✅ Store profile data in Firestore `/users/{uid}`
- ✅ Redirect to dashboard on completion

### 3.2 Settings Page ✅
- ✅ Create settings layout
- ✅ Build editable profile form
- ✅ Pre-populate form with existing data
- ✅ Add account settings section
- ✅ Link to billing management
- ✅ Save and validation logic
- ✅ **Settings ARE working** - All profile fields (background, expertise, targetAudience, goals, writingStyle, brandVoice) are used in AI generation
- ✅ **Bug Fixed:** Goals field type inconsistency - changed from `string | string[]` to `string` consistently
- ✅ **Bug Fixed:** Replaced `window.location.href` with Next.js router.push() for navigation
- ✅ **Bug Fixed:** Improved save confirmation UX - now shows green button with checkmark for 5 seconds
- ✅ Add password change functionality (Firebase Auth updatePassword API with re-authentication)
  - Only shown for email/password users (not Google OAuth)
  - Validates password strength (min 6 characters)
  - Confirms password match
  - Proper error handling for wrong password and requires-recent-login
- ✅ Add profile photo upload (Firebase Storage integration)
  - Upload to Firebase Storage at `profile-photos/{uid}/{timestamp}-{filename}`
  - Image preview with loading spinner
  - Validates file type (images only) and size (max 5MB)
  - Updates both Firebase Auth and Firestore user document
- ✅ Add delete account option with confirmation dialog
  - Danger Zone section with clear warnings
  - Two-step confirmation (button click + type "DELETE")
  - Deletes all user data: drafts, campaigns, user document, and Firebase Auth account
  - Proper error handling for requires-recent-login
- ✅ Add data export feature (download user data as JSON - GDPR compliance)
  - Exports complete user data: profile, subscription, drafts, campaigns, metadata
  - Downloads as JSON file with timestamp
  - GDPR-compliant data portability
- ⚪ Add email notification preferences (future enhancement)
- ⚪ Add default content preferences (pre-fill wizard settings - future enhancement)

### 3.3 LinkedIn Integration (Authentication + Profile Enhancement) ✅
**Difficulty Assessment:** ⭐⭐☆☆☆ Easy (2-3 hours implementation)

**Sign In with LinkedIn (OAuth) - FULLY IMPLEMENTED ✅**
- ✅ Add LinkedIn OAuth provider to Firebase Auth using OAuthProvider('oidc.linkedin')
- ✅ Update login page with "Continue with LinkedIn" button
- ✅ Update signup page with "Continue with LinkedIn" button
- ✅ Display LinkedIn connection status in settings page
- ✅ Show active sign-in methods (Google/LinkedIn/Email) in Connected Accounts section
- ✅ Allow unlinking/relinking provider accounts
  - Link providers: `linkWithPopup()` for Google and LinkedIn
  - Unlink providers: `unlink()` with safety check (must keep at least 1 provider)
  - Real-time provider status using `user.providerData`
- ✅ Automatic user document creation for new LinkedIn sign-ins
- ✅ Redirect to onboarding for new users, app for returning users

**LinkedIn Profile Data Integration ✅ (ADDS REAL VALUE)**
- ✅ Extract and store LinkedIn profile data in Firestore
  - Stores: name, email, photoURL, connectedAt timestamp
  - Saved in `users/{uid}/linkedinProfile` document
- ✅ Pre-populate onboarding form for LinkedIn sign-ups
  - Detects `?source=linkedin` URL parameter
  - Shows LinkedIn connection notification banner on step 3
  - Pre-fills background field with intelligent starter text
  - Displays personalized welcome message with user's LinkedIn name
- ✅ Display LinkedIn profile in settings
  - Shows LinkedIn profile photo, name, email
  - Displays connection date
  - Expands when LinkedIn is linked, collapses when not
  - Branded LinkedIn blue (#0A66C2) styling

**Implementation Details:**
- Uses Firebase OAuthProvider with LinkedIn OIDC provider (`oidc.linkedin`)
- Scopes: `openid`, `profile`, `email`
- Auth context provides `signInWithLinkedIn()` method
- Login/signup pages store LinkedIn profile metadata:
  ```typescript
  linkedinProfile: {
    connectedAt: new Date().toISOString(),
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
  ```
- Onboarding page:
  - Detects LinkedIn sign-in via URL parameter
  - Pre-populates background: `"I'm {name} looking to share insights..."`
  - Shows branded notification banner with checkmark
- Settings page shows Connected Accounts section with:
  - Google account (link/unlink)
  - LinkedIn account with profile preview when connected
  - Email/Password (shown as "Primary Method")
  - Visual status indicators (Connected/Not connected)

**LinkedIn Posting API - NOT FEASIBLE ❌**
- LinkedIn has deprecated consumer posting APIs
- Requires LinkedIn Marketing Developer Platform partnership (enterprise only)
- **Current Solution:** Users manually copy-paste content to LinkedIn (workflow is fine)

**Value Proposition:**
LinkedIn authentication now adds genuine value by:
1. Streamlining onboarding with auto-populated profile data
2. Professional brand alignment (LinkedIn users on a LinkedIn content tool)
3. Multiple sign-in options for convenience and account recovery
4. Future potential: could request additional LinkedIn scopes for deeper profile data (job title, company, industry)

### 3.4 Firebase & LinkedIn OAuth Configuration ⚪
**Status:** Implementation complete in code, Firebase/LinkedIn portal setup pending

**Prerequisites:**
- Firebase project created and configured
- LinkedIn Developer account access

**Step 1: Create LinkedIn OAuth Application**
1. Go to [LinkedIn Developers](https://developer.linkedin.com/)
2. Navigate to "My Apps" → "Create App"
3. Fill in application details:
   - App name: "Storyscale" (or your app name)
   - LinkedIn Page: Associate with your company page or create one
   - App logo: Upload your app logo
   - Privacy policy URL: Your privacy policy URL
   - Terms of use URL: Your terms of use URL
4. Click "Create app"
5. Navigate to the "Auth" tab
6. Under "OAuth 2.0 settings", add redirect URLs:
   - Development: `http://localhost:3000/__/auth/handler`
   - Production: `https://your-app.firebaseapp.com/__/auth/handler`
   - Production custom domain: `https://your-domain.com/__/auth/handler`
7. Under "OAuth 2.0 scopes", ensure these scopes are available:
   - `openid` (required for OIDC)
   - `profile` (for name, photo)
   - `email` (for email address)
8. **Save your Client ID and Client Secret** - you'll need these for Firebase

**Step 2: Configure OpenID Connect Provider in Firebase**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Storyscale project
3. Navigate to **Authentication** → **Sign-in method**
4. Click "Add new provider"
5. Select **OpenID Connect** from the list
6. Configure the provider:
   - **Name:** `LinkedIn` (user-facing name)
   - **Client ID:** Paste from LinkedIn app (Step 1.8)
   - **Client Secret:** Paste from LinkedIn app (Step 1.8)
   - **Issuer (Discovery document URL):** `https://www.linkedin.com/oauth`
   - **Provider ID:** `oidc.linkedin` (must match code implementation)
7. Click "Save"

**Step 3: Verify Authorized Domains**
1. In Firebase Console → Authentication → Settings → Authorized domains
2. Ensure these domains are listed:
   - `localhost` (for development)
   - `your-app.firebaseapp.com` (default Firebase hosting)
   - `your-app.web.app` (default Firebase hosting)
   - Your custom domain (if using one)
3. Add any missing domains

**Step 4: Test the Integration**
1. Run your app locally: `npm run dev`
2. Navigate to signup or login page
3. Click "Continue with LinkedIn"
4. You should be redirected to LinkedIn authorization page
5. After authorization:
   - New users → redirected to `/onboarding?source=linkedin`
   - Existing users → redirected to `/app`
6. Verify profile data is saved in Firestore:
   - Check `users/{uid}` document
   - Confirm `linkedinProfile` object exists with name, email, photoURL, connectedAt

**Step 5: Production Deployment Checklist**
- [ ] Update LinkedIn app redirect URLs with production domain
- [ ] Verify Firebase OIDC provider configuration in production project
- [ ] Test OAuth flow in production environment
- [ ] Confirm Firestore security rules allow linkedinProfile writes
- [ ] Test link/unlink functionality in settings page
- [ ] Monitor Firebase Authentication logs for errors

**Troubleshooting:**
- **"redirect_uri_mismatch" error**: Verify redirect URLs in LinkedIn app match Firebase Auth URLs exactly
- **"invalid_client" error**: Check Client ID and Client Secret are correct in Firebase OIDC config
- **Profile data not saving**: Check browser console and Firestore rules for permission errors
- **Provider not showing**: Ensure Provider ID is exactly `oidc.linkedin` (case-sensitive)

**Security Notes:**
- Never commit Client Secret to version control
- Store Client Secret securely in Firebase Console only
- Regularly rotate Client Secret in production
- Monitor LinkedIn API usage and rate limits
- Review LinkedIn app permissions quarterly

---

## Phase 4: Core Dashboard ✅

### 4.1 Dashboard Layout ✅
- ✅ Create fixed 240px left sidebar
- ✅ Implement mobile collapsible view (icon-only)
- ✅ Navigation items:
  - ✅ Workspace
  - ✅ Create New Post
  - ✅ All Drafts
  - ✅ Campaigns
  - ✅ Calendar View
  - ✅ Settings
  - ✅ Billing
- ✅ User profile section (bottom) with avatar and plan badge
- ✅ Responsive main content area

### 4.2 Dashboard Home (Workspace) ✅
- ✅ Stats cards component:
  - ✅ Posts used this month vs limit
  - ✅ Drafts in progress
  - ✅ Posts ready to share
  - ✅ Active campaign status
- ✅ Recent drafts section with grid/list toggle
- ✅ Draft card component:
  - ✅ Preview (80-100 characters)
  - ✅ Color-coded status badge
  - ✅ Creation date
  - ✅ Language flag (EN/NO)
  - ✅ Quick action buttons (Edit, Delete, Copy)
- ✅ Filter functionality (status, language, tags)
- ✅ Sort options (date, status, campaign)

---

## Phase 5: Post Creation (⚡ PRIORITY FEATURE) ✅

### 5.1 Post Creation Wizard - Step 1: Input ✅
- ✅ Create wizard layout with progress indicator
- ✅ Large textarea with character counter
- ✅ Validation: 50-2000 characters
- ✅ Optional reference URLs (up to 3 inputs)
- ✅ Auto-save implementation (every 30s)
- ✅ Next button validation

### 5.2 Post Creation Wizard - Step 2: Configuration ✅
- ✅ Tone dropdown:
  - ✅ Professional, Casual, Inspirational, Educational
- ✅ Purpose dropdown:
  - ✅ Engagement, Lead Generation, Brand Awareness, Thought Leadership
- ✅ Target audience dropdown:
  - ✅ Executives, Entrepreneurs, Professionals, Industry-specific
- ✅ Post style dropdown:
  - ✅ Story-Based, List Format, Question-Based, How-To
- ✅ Back and Next navigation

### 5.3 Post Creation Wizard - Step 3: Preferences ✅
- ✅ Language toggle (English/Norwegian)
- ✅ Post length options:
  - ✅ Short (50-150 words)
  - ✅ Medium (150-300 words)
  - ✅ Long (300-500 words)
- ✅ Include CTA toggle
- ✅ Emoji usage dropdown:
  - ✅ None, Minimal, Moderate
- ✅ Back and Next navigation

### 5.4 Post Creation Wizard - Step 4: Review & Generate ✅
- ✅ Display summary of all selections
- ✅ Show post credit usage alert
- ✅ Check monthly limit before generation
- ✅ Generate button with loading state
- ✅ Progress indicator during generation
- ✅ Error handling and user feedback
- ✅ Back button to edit settings

### 5.5 Claude API Integration ✅
- ✅ Create `/api/generate` route
- ✅ Authenticate user via Firebase Auth token
- ✅ Build system prompt:
  - ✅ Include user profile (background, expertise, audience, style, voice, goals)
  - ✅ Add generation rules (language, human tone, avoid jargon)
  - ✅ Apply wizard settings (tone, purpose, style, length, CTA, emoji)
- ✅ Build user message:
  - ✅ Include wizard input text
  - ✅ Add reference URLs if provided
  - ✅ If campaign: add theme, post number, previous content
- ✅ Call Anthropic Claude API
- ✅ Handle token limits and errors
- ✅ Store wizard settings with draft for re-generation
- ✅ Increment `postsUsedThisMonth` counter
- ✅ Return generated content

---

## Phase 6: Content Editor ✅

### 6.1 Editor Interface ✅
- ✅ Large editable textarea with character counter
- ✅ Action buttons:
  - ✅ Enhance (improve with AI)
  - ✅ Regenerate (use original settings)
  - ✅ Back to Workspace
  - ✅ Save Draft
  - ✅ Copy to Clipboard
- ✅ Loading states for AI actions
- ⚪ Success/error notifications (using alerts for now)

### 6.2 Enhance Functionality ✅
- ✅ Create `/api/enhance` route
- ✅ Send current content to Claude with improvement prompt
- ✅ Maintain user's original settings and context
- ✅ Update editor with enhanced content
- ✅ Create new version entry

### 6.3 Regenerate Functionality ✅
- ✅ Load original wizard settings
- ✅ Call generate API with same parameters
- ✅ Replace content in editor
- ✅ Create new version entry

### 6.4 Version Management ✅
- ✅ Version history sidebar component
- ✅ Create `/drafts/{draftId}/versions` subcollection on save
- ✅ Display version list with timestamps
- ✅ Load previous version functionality
- ✅ Track which version is current
- ⚪ Diff view (optional enhancement)

### 6.5 Draft Metadata ✅
- ✅ Status dropdown component:
  - ✅ Idea, In Progress, Ready to Post, Posted, Archived
- ✅ Tag input with autocomplete
- ⚪ Scheduled date picker
- ✅ Manual save functionality
- ✅ Update Firestore document

---

## Phase 7: Draft Management ✅

### 7.1 All Drafts Page ✅
- ✅ Create drafts list layout
- ✅ Search functionality (title/content)
- ✅ Filter controls:
  - ✅ Status filter
  - ✅ Language filter
  - ✅ Tag filter
- ✅ Sort controls:
  - ✅ Date created
  - ✅ Last modified
  - ✅ Status
- ✅ Grid/list view toggle
- ⚪ Bulk selection checkboxes
- ⚪ Bulk action buttons (status change, tag, delete)
- ⚪ Pagination or infinite scroll
- ✅ Empty state component

### 7.2 Calendar View ✅
- ✅ Create monthly calendar component
- ✅ Fetch drafts with scheduled dates
- ✅ Display draft indicators on dates
- ✅ Color-code indicators by status
- ✅ Day detail modal/popover
- ✅ Show all drafts for selected date
- ✅ Navigate to draft editor from calendar
- ⚪ Optional: Drag-and-drop reschedule

---

## Phase 8: Campaign Planning & Intelligence 🎯

### 8.1 Campaign Creation ✅
- ✅ Create campaign modal/page
- ✅ Campaign form fields:
  - ✅ Name input
  - ✅ Theme and description textarea
  - ✅ Language selection (EN/NO)
  - ✅ Start and end date pickers
  - ✅ Posting frequency dropdown (Daily, 3x/week, Weekly)
  - ✅ Target number of posts input
  - ✅ Content style dropdown
  - ✅ Optional template selection
- ✅ **Multiple active campaigns support** - removed single campaign limit
- ✅ Store campaign in Firestore `/campaigns/{campaignId}`

### 8.2 Campaign Detail Page ✅
- ✅ Campaign header with name and description
- ✅ Progress bar (posts completed/target)
- ✅ Timeline component showing all posts
- ✅ Status indicators for each post
- ✅ Scheduled dates (calculated from frequency)
- ✅ "Generate Next Post" button:
  - ✅ Show only after previous post marked Posted/Ready
  - ✅ Include campaign context in generation
  - ✅ Pass previous post content for continuity
  - ✅ Display post number (e.g., "Post 3 of 10")
- ✅ Edit campaign settings button
- ✅ Complete/archive campaign action

### 8.3 Campaign Templates ✅
- ✅ Create campaign templates library
- ✅ Seed templates:
  - ✅ Product Launch (8 posts, 3x/week)
  - ✅ Thought Leadership Series (10 posts, weekly)
  - ✅ Educational Series (12 posts, 3x/week)
  - ✅ Company Updates (6 posts, weekly)
  - ✅ Case Study Series (5 posts, weekly)
  - ✅ Industry Insights (10 posts, 3x/week)
- ✅ Template selection UI in campaign creation
- ✅ Pre-populate campaign settings from template
- ✅ Template preview component

### 8.4 Sequential Post Generation ✅
- ✅ Update generate API to handle campaign context
- ✅ Pass campaign theme to Claude
- ✅ Include previous post content
- ✅ Add post sequence number (e.g., "This is post 3 of 10")
- ✅ Maintain continuity in tone and messaging
- ✅ Link generated draft to campaign
- ✅ Increment campaign post counter

### 8.5 AI Campaign Strategist (Marketing Manager Brain) ✅
- ✅ **Campaign Brief Generator API** (`/api/campaigns/brief`)
  - ✅ Analyze campaign goal input from user
  - ✅ Generate strategic overview (3-4 sentence campaign approach)
  - ✅ Create post-by-post blueprint with specific topics
  - ✅ Define narrative arc (how posts build on each other)
  - ✅ Suggest success markers to watch for
  - ✅ Return structured JSON with strategy + post topics
- ✅ **Dynamic Strategy Adaptation API** (`/api/campaigns/[id]/restrategize`)
  - ✅ Accept user edits to any post topic
  - ✅ Re-analyze campaign flow with change
  - ✅ Update subsequent posts to maintain narrative coherence
  - ✅ Preserve locked posts (already generated/posted)
  - ✅ Return updated topics with change reasons
  - ✅ Implement cascade logic (early edits = more impact)
- ✅ **Next Post Guidance API** (`/api/campaigns/[id]/next-post-guide`)
  - ✅ Analyze campaign position (early/mid/late sequence)
  - ✅ Define specific goal for upcoming post
  - ✅ Show connection to previous post
  - ✅ Suggest optimal angle/approach
  - ✅ Provide context for AI generation

### 8.6 Customizable Campaign Strategy ✅
- ✅ **Campaign Creation Wizard Enhancement**
  - ✅ Step 1: User defines goal, post count, frequency
  - ✅ Step 2: AI generates initial strategy + post topics
  - ✅ Step 3: Inline editing interface for all topics
  - ✅ Real-time preview of strategy changes
  - ✅ Impact indicators showing which posts will adjust
  - ✅ [Use This Strategy] or [Customize Topics] options
- ✅ **Strategy Editor Component**
  - ✅ Edit overall campaign approach (narrative arc)
  - ✅ Inline edit for individual post topics
  - ✅ Live AI updates when topics change
  - ✅ Preview modal showing before/after comparison
  - ✅ Locked indicator for generated/posted posts
  - ✅ User-customized vs AI-suggested badges
- ✅ **Edit Flow UI/UX**
  - ✅ Click any post topic to edit
  - ✅ AI immediately adjusts surrounding posts
  - ✅ Show "Strategy adjusted" notification
  - ✅ Display impacted posts with [UPDATED] badge
  - ✅ Confirm changes before applying

### 8.7 Active Campaign Widget (Dashboard Integration) ✅
- ✅ **Replace Static Campaign Stat Card**
  - ✅ Prominent card at top of dashboard
  - ✅ Show active campaign name + progress
  - ✅ Display next post due date
  - ✅ AI-suggested topic for next post
  - ✅ Quick "Generate Post X" button
  - ✅ "View Campaign" and "Pause" actions
- ✅ **Alternative Path Option**
  - ✅ "Create Single Post Instead" card below
  - ✅ Clear distinction between campaign vs standalone
  - ✅ User choice emphasized
- ✅ **Campaign-Aware Draft Cards**
  - ✅ Add campaign badge/icon to draft cards
  - ✅ Show campaign name on hover
  - ✅ Filter option: "Campaign Posts" vs "Single Posts"
  - ⚪ Optional grouped view in list mode
  - ⚪ Visual connection lines in timeline view

### 8.8 Enhanced AI Generation for Campaigns 🔄
- 🔄 **Campaign-Aware System Prompts**
  - 🔄 Include campaign narrative arc in prompts
  - 🔄 Add position-in-sequence context (post X of Y)
  - 🔄 Reference campaign strategy goals
  - 🔄 Include previous post themes (not full content)
  - 🔄 Add tone progression instructions
  - 🔄 Specify call-back references where relevant
- ⚪ **Template Blueprints Enhancement**
  - ⚪ Extend templates with post-by-post guides
  - ⚪ Product Launch blueprint: Teaser → Problem → Solution → Features → Social Proof → CTA → Follow-up
  - ⚪ Thought Leadership blueprint: Trend → Analysis → Perspective → Prediction → Discussion
  - ⚪ AI uses blueprint to guide specific post generation
- ⚪ **Smart Content Variations**
  - ⚪ Automatically vary post length across campaign
  - ⚪ Mix hook styles (question, story, stat, statement)
  - ⚪ Alternate emoji usage patterns
  - ⚪ Vary CTA approaches

### 8.9 Campaign Detail Page Redesign 🔄
- ⚪ **Strategy Overview Section**
  - ⚪ Editable campaign strategy (narrative arc)
  - ⚪ Visual flow indicator (text-based, clean)
  - ⚪ Campaign goal reminder
  - ⚪ [Edit Strategy] button
- ⚪ **AI Insights Panel**
  - ⚪ Next post recommendation
  - ⚪ Campaign health indicator
  - ⚪ Tone consistency check
  - ⚪ Content diversity metrics
  - ⚪ Suggested improvements
- ⚪ **Enhanced Timeline View**
  - ⚪ Each post has [Edit Topic] button
  - ⚪ Show post goal/purpose on hover
  - ⚪ Visual indicators for locked vs editable
  - ⚪ Connection context between posts
  - ⚪ Scheduled dates with auto-calculation
- ⚪ **Campaign Actions**
  - ⚪ Generate next post (with AI context)
  - ⚪ Optimize entire campaign
  - ⚪ Export campaign plan
  - ⚪ Complete/archive with confirmation

### 8.10 Workspace Campaign Integration 🔄
- 🔄 **Campaign-First Navigation Option**
  - 🔄 Toggle workspace view: All Posts / Campaign Posts
  - 🔄 Campaign lens filtering
  - 🔄 Quick campaign switcher in sidebar
- 🔄 **Campaign Progress Tracking**
  - 🔄 Show campaign completion % in workspace
  - 🔄 Next post due date alerts
  - 🔄 Campaign momentum indicators
- ⚪ **Scheduled Date Integration**
  - ⚪ Calendar view shows campaign posts
  - ⚪ Auto-schedule based on frequency
  - ⚪ Drag-to-reschedule (optional)
  - ⚪ Campaign timeline in calendar

### 8.11 Database Schema Updates ✅
- ✅ **Campaign Collection Enhancement**
  - ✅ Add `aiStrategy` object:
    - ✅ `overallApproach`: string (narrative arc)
    - ✅ `postBlueprints`: array of post plans
      - ✅ `position`: number
      - ✅ `topic`: string
      - ✅ `goal`: string
      - ✅ `locked`: boolean
      - ✅ `userCustomized`: boolean
    - ✅ `suggestions`: array (AI recommendations)
  - ⚪ Add `performance` object:
    - ⚪ `coherenceScore`: number
    - ⚪ `diversityScore`: number
    - ⚪ `completionRate`: number

### 8.12 Clean UX/UI Patterns ✅
- ✅ **Design Principles**
  - ✅ Clear typography hierarchy (size/weight only)
  - ✅ Ample whitespace for breathing room
  - ✅ Simple borders and dividers
  - ✅ Status via text, minimal colors
  - ✅ Progress via simple bars, no fancy charts
- ✅ **Information Architecture**
  - ✅ AI suggestions in clearly labeled boxes
  - ✅ "Why this matters" explanations visible
  - ✅ One clear primary action per screen
  - ✅ Optional/advanced features collapsed
- ✅ **User Control Indicators**
  - ✅ Every AI suggestion has [Use This] or [Customize]
  - ✅ Can skip AI strategy entirely (DIY mode)
  - ✅ Can edit any AI-generated content
  - ✅ Can pause/modify campaign anytime
  - ✅ Clear locked/unlocked indicators

### 8.13 Enhanced Campaign Detail Page with Post Details ⚪
- ⚪ **Timeline Post Cards Enhancement**
  - ⚪ Show AI-suggested topic from aiStrategy.postBlueprints[index].topic
  - ⚪ Display post goal/purpose from blueprint
  - ⚪ Increase content preview from 150 to 300 characters
  - ⚪ Add strategic position label (e.g., "Opening • Awareness phase")
  - ⚪ Show connection to previous post ("Builds on: [previous topic]")
  - ⚪ Expandable section for full AI strategy details
- ⚪ **Campaign Strategy Display Section**
  - ⚪ Show strategic overview at top of timeline
  - ⚪ Display narrative arc description
  - ⚪ Show success markers in dedicated section
  - ⚪ Add campaign metadata: tone, purpose, audience (if available)

### 8.14 Campaign Wizard Advanced Configuration ⚪
- ⚪ **Add Configuration Dropdowns to Step 1**
  - ⚪ Tone dropdown: Professional, Casual, Inspirational, Educational
  - ⚪ Purpose dropdown: Engagement, Lead Generation, Brand Awareness, Thought Leadership
  - ⚪ Target Audience dropdown: Executives, Entrepreneurs, Professionals, Industry-Specific
  - ⚪ Keep all in single card with 2-column grid layout
  - ⚪ Add after template selection, before name/theme inputs
- ⚪ **Update Form State & Database**
  - ⚪ Add tone, purpose, audience to formData
  - ⚪ Save to Firestore campaigns collection
  - ⚪ Pass to /api/campaigns/brief for better AI strategy
- ⚪ **Update Campaign TypeScript Interface**
  - ⚪ Add tone, purpose, audience fields
  - ⚪ Ensure aiStrategy structure is properly typed

### 8.15 AI Campaign Input Validator (Bilingual Support) ⚪
- ⚪ **Create Validation API Endpoint**
  - ⚪ Route: /api/campaigns/validate-input
  - ⚪ Accept: text, language (en/no), fieldType (theme/description)
  - ⚪ Use Claude API to analyze input quality
  - ⚪ Return: scores (clarity, specificity, actionability), feedback, suggestions
  - ⚪ Support both English and Norwegian responses
- ⚪ **Create Validation UI Component**
  - ⚪ Component: components/CampaignInputValidator.tsx
  - ⚪ Debounced validation (500ms after typing stops)
  - ⚪ Quality indicator: 🔴 red / 🟡 yellow / 🟢 green badges
  - ⚪ Expandable "AI Suggestions" section
  - ⚪ Non-blocking (users can proceed regardless)
  - ⚪ Clean, minimal design
- ⚪ **Integration Points**
  - ⚪ Add to Campaign Theme input field
  - ⚪ Add to Campaign Description textarea
  - ⚪ Real-time feedback as user types
  - ⚪ Loading state during validation

---

## Phase 9: Billing & Subscriptions

### 9.1 Billing Page ⚪
- ⚪ Display current plan details
- ⚪ Usage bar component (posts used/limit)
- ⚪ Show renewal date
- ⚪ Plan comparison cards
- ⚪ Upgrade button (redirects to Stripe Checkout)
- ⚪ Downgrade button (redirects to Stripe portal)
- ⚪ Cancel subscription link
- ⚪ View invoice history

### 9.2 Stripe Checkout Integration ⚪
- ⚪ Create `/api/create-checkout-session` route
- ⚪ Generate Stripe Checkout Session
- ⚪ Redirect user to Stripe hosted page
- ⚪ Handle success and cancel URLs
- ⚪ Store subscription data on success

### 9.3 Stripe Webhook Handler ⚪
- ⚪ Create `/api/webhooks/stripe` route
- ⚪ Verify webhook signature
- ⚪ Handle `checkout.session.completed`:
  - ⚪ Create/update subscription in Firestore
  - ⚪ Set `stripeCustomerId` and `stripePriceId`
  - ⚪ Set `currentPeriodEnd`
- ⚪ Handle `customer.subscription.updated`:
  - ⚪ Update tier and status
  - ⚪ Update `currentPeriodEnd`
- ⚪ Handle `invoice.payment_succeeded`:
  - ⚪ Reset `postsUsedThisMonth` counter
  - ⚪ Update `currentPeriodEnd`
- ⚪ Handle `customer.subscription.deleted`:
  - ⚪ Downgrade to Free tier
- ⚪ Log all webhook events for debugging

### 9.4 Usage Tracking & Limits ⚪
- ⚪ Define tier limits:
  - ⚪ Free: 5 posts/month
  - ⚪ Pro: 50 posts/month
  - ⚪ Enterprise: unlimited
- ⚪ Check limit in generate API before creating post
- ⚪ Display usage in dashboard stats
- ⚪ Display usage in billing page
- ⚪ Show upgrade prompt when limit reached
- ⚪ Create monthly reset function (Cloud Function or cron)

### 9.5 Stripe Customer Portal ⚪
- ⚪ Create `/api/create-portal-session` route
- ⚪ Generate portal session for authenticated user
- ⚪ Add "Manage Billing" link in settings/billing
- ⚪ Allow users to:
  - ⚪ Update payment methods
  - ⚪ View invoice history
  - ⚪ Cancel subscription

---

## Phase 10: Design & UX Enhancement 🎨

### 10.1 Welcome/Onboarding Wizard Visual Upgrade ✅
- ✅ Add gradient backgrounds and visual hierarchy
  - ✅ Implement subtle gradient overlays on wizard steps
  - ✅ Add visual progress animations (step completion effects)
  - ✅ Create modern card shadows with soft depth
  - ✅ Add smooth transitions between steps (slide/fade effects)
- ✅ Enhance typography and spacing
  - ✅ Implement better heading hierarchy (larger, bolder step titles)
  - ✅ Add descriptive subtitles with improved color contrast
  - ✅ Increase whitespace for breathing room
  - ✅ Add decorative icons for each step
- ✅ Add micro-interactions and feedback
  - ✅ Checkbox/radio button animations (checkmark animation, ripple effect)
  - ✅ Input field focus animations (border glow, label lift)
  - ✅ Button hover effects (lift, color shift, shadow expansion)
  - ✅ Progress bar pulse animation on step completion
- ✅ Implement contextual illustrations
  - ✅ Add welcome hero illustration/icon with animated orange gradient circle
  - ✅ Step-specific decorative graphics
  - ✅ Success celebration animation with confetti and checkmark
  - ✅ Background patterns with animated gradient orbs for visual interest

### 10.2 Draft Creation Wizard Visual Upgrade ⏳
- ✅ Enhanced step indicators
  - ✅ Animated progress ring/circle design with shadow and scale effects
  - ✅ Step icons with state changes (pending, active, completed)
  - ✅ Smooth color transitions between steps
  - ✅ Progress bar fill animations
- ✅ Step 1 (Input) improvements
  - ✅ Character counter with visual progress bar (color changes at milestones)
  - ✅ Textarea focus animations with shadow and ring
  - ✅ Visual feedback for character count thresholds
- ✅ Step 2 (Configuration) improvements
  - ✅ Replace dropdowns with modern card-based selectors
  - ✅ Add visual icons for each option
  - ✅ Implement hover preview cards with descriptions
  - ✅ Active state with accent border and background tint
  - ✅ Smooth scale/elevation on hover
- ✅ Step 3 (Preferences) improvements
  - ✅ Visual length indicators (word count visualization)
  - ✅ Language selector with flag icons (🇬🇧/🇳🇴)
  - ✅ CTA toggle with preview example
  - ✅ Enhanced emoji usage selector with visual cards
  - ✅ Improved card-based design for all preferences
- ✅ Step 4 (Review) improvements
  - ✅ Summary cards with collapsible sections
  - ✅ Edit quick-links with step indicators
  - ✅ Credit usage visualization (progress bar with gradient)
  - ✅ Generate button with enhanced loading animation
  - ✅ Success confetti/celebration animation (implemented in SuccessCelebration component)

### 10.3 Interactive Tooltips & Descriptions ✅
- ✅ Implement tooltip system
  - ✅ Add @radix-ui/react-tooltip library
  - ✅ Create reusable InfoTooltip component
  - ✅ Design consistent tooltip styling (dark theme with smooth animations)
  - ✅ Add smooth fade-in animations (300ms delay)
- ✅ Tone option tooltips
  - ✅ **Professional**: Establishes credibility for corporate audiences
  - ✅ **Casual**: Conversational language for authentic connections
  - ✅ **Inspirational**: Motivating content focused on growth
  - ✅ **Educational**: Clear teaching-focused content
- ✅ Purpose option tooltips
  - ✅ **Engagement**: Sparks conversations and comments
  - ✅ **Lead Generation**: Drives action toward services
  - ✅ **Brand Awareness**: Increases visibility and recognition
  - ✅ **Thought Leadership**: Establishes industry authority
- ✅ Audience option tooltips
  - ✅ **Executives**: Strategic, high-level insights
  - ✅ **Entrepreneurs**: Growth strategies and practical advice
  - ✅ **Professionals**: Tactical tips and career development
  - ✅ **Industry-Specific**: Niche terminology and specialized challenges
- ✅ Style option tooltips
  - ✅ **Story-Based**: Narrative structure for engagement
  - ✅ **List Format**: Scannable bullet points and tips
  - ✅ **Question-Based**: Drives curiosity and discussion
  - ✅ **How-To**: Actionable instructions and processes
- ✅ Length option tooltips
  - ✅ **Short (50-150 words)**: Quick, punchy posts
  - ✅ **Medium (150-300 words)**: Optimal for LinkedIn algorithm
  - ✅ **Long (300-500 words)**: In-depth thought leadership
- ✅ Additional setting tooltips
  - ✅ **Include CTA**: Increases post interaction by 30-50%
  - ✅ **Emoji Usage**: Professional (none), Minimal (1-2), Moderate (3-5)

### 10.4 Visual Design System Enhancements ⏳
- ✅ Color palette expansion
  - ✅ Add success/warning/error semantic colors
  - ✅ Create light/dark variants for all colors
- ✅ Typography improvements
  - ✅ Define complete type scale (12px - 48px)
  - ✅ Add font weight variations (300, 400, 500, 600, 700)
  - ✅ Set line-height and letter-spacing standards
  - ✅ Create heading/body text pairings
- ✅ Spacing system refinement
  - ✅ Document 8px grid usage patterns
  - ✅ Define component spacing constants
  - ⚪ Create margin/padding utility classes
  - ✅ Establish container max-widths
- ✅ Shadow and elevation system
  - ✅ Define 5 elevation levels (sm, md, lg, xl, 2xl)
  - ✅ Add focus ring styles
  - ⚪ Implement subtle inner shadows for depth

### 10.5 Animation & Transition Library ⏳
- ✅ Page transitions
  - ✅ Fade-in on route change
  - ✅ Slide transitions for wizard steps
  - ✅ Scale animations for modals
- ✅ Feedback animations
  - ✅ Success checkmark animation
- ✅ Decorative animations
  - ⚪ Progress bar fills
  - ✅ Confetti on milestone completion

### 10.6 Accessibility & Polish
*Note: See section 10.7.9 for comprehensive accessibility implementation*

### 10.7 Dual-Color System Refinement ✅

**Design Philosophy:**
- **Orange = "Do Something"** (Actions, progress, interactive triggers)
- **Blue = "Review or Navigate"** (Information, secondary actions, navigation)
- **Other Colors = Status Clarity Only** (Minimal, purpose-driven)
- **Mood**: Between calm and energetic—clean, professional, with active contrast

**Core Principles:**
1. Maintain current structure - No layout reorganization, only visual refinement
2. Orange strictly for actions - Generate, Create, Progress bars, CTAs
3. Blue for information/navigation - Campaign backgrounds, View buttons, info sections
4. 20% vertical padding reduction - Bring more content above fold
5. Strengthen slate text - Improve legibility on white backgrounds
6. Tactile hover feedback - Soft shadow growth + 1-2% scale

#### 10.7.1 Color System Foundation ✅
- ✅ Add blue system variables to globals.css
  - Blue primary: `#2563EB`
  - Blue hover: `#1E40AF`
  - Blue light: `#DBEAFE`
  - Blue frosted: `rgba(37, 99, 235, 0.08)`
  - Blue subtle: `#EFF6FF`
- ✅ Strengthen slate text tones for better legibility
  - Primary slate: `#475569` (was #64748B - 15% darker)
  - Secondary slate: `#64748B` (muted content)
  - Light slate: `#94A3B8` (timestamps)
- ✅ Add hover utilities to globals.css
  - `.hover-lift` class with shadow growth + scale
  - `.hover-lift-sm` for subtle interactions
  - Transition properties for smooth animations

#### 10.7.2 Button System Refinement (CRITICAL) ✅
- ✅ Fix primary button variant
  - Orange background with **WHITE text** (not gray!)
  - Hover: darker orange with 2% scale increase
  - Shadow growth on hover
  - Use: All action CTAs (Generate, Create, Save)
- ✅ Implement secondary button variant (Blue theme)
  - Option A: White background, 2px blue border, blue text
  - Option B: Blue-frosted background, blue text, no border
  - Hover: deeper blue tint with 1% scale increase
  - Use: View, Edit, navigation actions
- ✅ Refine ghost button variant
  - Strengthened slate text
  - Light gray hover background
  - Use: Pause, icon buttons, tertiary actions
- ✅ Update all button instances throughout app
  - Verify proper variant usage
  - Ensure color contrast compliance
  - Apply hover states consistently

#### 10.7.3 Campaign Widget Redesign ✅
- ✅ Replace orange gradient background
  - Remove: `bg-gradient-to-br from-primary/5 to-primary/10`
  - Replace with: `bg-gradient-to-br from-blue-50 to-white` OR `bg-white border-2 border-blue-100`
  - Result: Soft blue-tinted surface instead of orange
- ✅ Reserve orange strictly for:
  - Progress bar fill only
  - "Generate Post" button (primary action)
  - No other orange elements in widget
- ✅ Apply blue theme to:
  - Background gradient/tint
  - Calendar icon and container (`bg-blue-100`)
  - Lightbulb icon (amber/yellow acceptable)
  - Info box backgrounds (`bg-blue-50/30`)
  - "View" button (secondary blue outline)
  - Megaphone icon container
- ✅ Reduce vertical padding by 20%
  - `p-6` → `p-5`
  - `space-y-4` → `space-y-3`
  - `mb-4` → `mb-3` throughout component
  - Compress header spacing (reduce icon size if needed)
- ✅ Update button group styling
  - "Generate Post X": Primary orange with white text
  - "View": Secondary blue outline style
  - "Pause": Ghost style with slate text
- ✅ Optimize layout for vertical space
  - Combine "Next Post Due" and "Suggested Topic" into single compact row
  - Reduce font sizes for secondary information
  - Tighter spacing in info boxes

#### 10.7.4 Draft Card Status Borders ✅
- ✅ Add 4px color-coded left borders
  - Idea: `border-l-4 border-l-purple-400` (#A78BFA)
  - In Progress: `border-l-4 border-l-blue-500` (#3B82F6)
  - Ready to Post: `border-l-4 border-l-green-500` (#10B981)
  - Posted: `border-l-4 border-l-amber-500` (#F59E0B)
  - Archived: `border-l-4 border-l-gray-400` (#9CA3AF)
- ✅ Update campaign badge styling
  - Background: `bg-blue-50` (light blue frosted)
  - Text: `text-blue-700` (dark blue)
  - Icon: Blue megaphone
- ✅ Color-code action button hovers
  - Edit button: `hover:bg-blue-50 hover:text-blue-600`
  - Copy button: `hover:bg-slate-100 hover:text-slate-700`
  - Delete button: `hover:bg-red-50 hover:text-red-600`
- ✅ Add hover-lift-sm class for tactile feedback
  - Soft shadow growth on hover
  - 1% scale increase (scale-[1.01])
  - Smooth transition (200ms duration)
- ✅ Reduce padding by 20%
  - Grid view: `p-6` → `p-5`
  - List view: `p-4` → `p-3`
  - Maintain readability with adjusted spacing
- ✅ Keep design simple and clean
  - White card backgrounds only
  - Colored left border as primary visual indicator
  - No gradient backgrounds or heavy decorations

#### 10.7.5 Workspace Layout Padding Reduction ✅
- ✅ Reduce vertical spacing by 20% throughout
  - Main container: `space-y-8` → `space-y-6`
  - Section headers: `mb-6` → `mb-5`
  - Draft grid: `gap-6` → `gap-5`
  - Card padding: `p-6` → `p-5`
- ✅ Update stats cards (no active campaign view)
  - Padding: `p-6` → `p-5`
  - Color-coded icon backgrounds (subtle)
    - Posts: `bg-orange-100` / `text-orange-600`
    - Drafts: `bg-blue-100` / `text-blue-600`
    - Ready: `bg-green-100` / `text-green-600`
    - Campaigns: `bg-purple-100` / `text-purple-600`
  - Add `hover-lift` class for interactive feel
- ✅ Refine "Create Single Post" card
  - Blue outline border: `border-2 border-blue-200`
  - Hover state: `hover:border-blue-300 hover:bg-blue-50/30`
  - Button: Secondary blue outline style
  - Consistent with blue = navigation/secondary action
- ✅ Optimize filter section spacing
  - Reduce gap: `gap-4` → `gap-3`
  - Active state: Blue underline or subtle blue background
  - Keep functional and minimal styling
  - Ensure mobile responsiveness maintained

#### 10.7.6 Text Legibility Enhancement ✅
- ✅ Apply strengthened slate tones throughout app
  - Update all `text-secondary` class usage to use new `#475569`
  - Ensure body text uses strengthened slate for better contrast
  - Maintain hierarchy with font-weight variations
  - Secondary/muted text uses `#64748B`
  - Timestamps and auxiliary info use `#94A3B8`
- ✅ Verify contrast ratios on all text elements
  - Test body text on white backgrounds (4.5:1 minimum)
  - Check secondary text readability
  - Ensure WCAG AA compliance throughout

#### 10.7.7 Hover States & Micro-interactions ✅
- ✅ Implement global hover patterns for cards
  - Transition: `transition-all duration-200`
  - Shadow: `hover:shadow-lg`
  - Scale: `hover:scale-[1.01]`
  - Apply to draft cards, stat cards, campaign widget
- ✅ Implement button hover patterns
  - Primary/Secondary: `hover:scale-[1.02]`
  - Primary: Add `hover:shadow-md`
  - Smooth transitions on all state changes
- ✅ Implement interactive element hovers
  - Blue theme elements: `hover:bg-blue-50/50`
  - Neutral elements: `hover:bg-slate-100`
  - Filter buttons, dropdowns, etc.
- ✅ Apply hover utilities consistently
  - Add utility classes to all interactive elements
  - Test tactile feedback throughout interface
  - Ensure smooth animations (no jank)

#### 10.7.8 Status Badge Minimal Refinement ✅
- ✅ Keep badges minimal and unobtrusive
  - Rounded-full shape
  - Light backgrounds with darker text
  - Small size, proper padding
- ✅ Align badge colors with left border system
  - Idea: `bg-purple-100 text-purple-700`
  - In Progress: `bg-blue-100 text-blue-700`
  - Ready to Post: `bg-green-100 text-green-700`
  - Posted: `bg-amber-100 text-amber-700`
  - Archived: `bg-gray-100 text-gray-600`
- ✅ Ensure consistent badge styling across all components
  - Draft cards, campaign detail, calendar view
  - Proper spacing and alignment
  - Readable at all screen sizes

#### 10.7.9 Accessibility Compliance Check ✅
- ✅ Verify WCAG AA contrast ratios (4.5:1 minimum)
  - Orange buttons with white text (should pass)
  - Blue buttons with dark blue text on white (verify)
  - Strengthened slate on white backgrounds (verify)
  - All status badge text/background combinations
- ✅ Ensure visible focus rings on all interactive elements
  - Buttons, inputs, dropdowns, links
  - Use blue focus ring for consistency
  - Clear indication of keyboard focus
- ✅ Test keyboard navigation
  - Tab order is logical
  - All actions accessible via keyboard
  - Enter/Space work on custom controls
- ✅ Verify disabled states
  - Proper opacity (40%)
  - Cursor: not-allowed
  - Clear visual distinction from enabled state

**Visual Hierarchy Summary:**

**Orange (Action - "Do Something"):**
- Generate/Create buttons
- Progress bars and fill animations
- Active states and selected items
- Primary CTAs throughout app
- "Do this now" action elements

**Blue (Information/Navigation - "Review or Navigate"):**
- Campaign backgrounds and containers
- View/Edit buttons (secondary actions)
- Info containers and notification areas
- Calendar and scheduling elements
- Campaign badges on draft cards
- Secondary navigation elements

**Status Colors (Clarity Only):**
- Purple: Idea phase / Creative thinking
- Blue: In progress / Active work
- Green: Ready to post / Success states
- Amber: Posted / Published content
- Gray: Archived / Inactive content

**Neutral (Foundation):**
- Strengthened slate text (#475569)
- White card backgrounds
- Light gray subtle backgrounds
- Borders and dividers

**Design Principles Applied:**
1. ✅ **Clear visual hierarchy** - Orange for action, blue for info
2. ✅ **Legible buttons** - White text on orange, proper contrast
3. ✅ **Calm + energetic balance** - Clean design with active feel
4. ✅ **20% more vertical content** - Reduced padding brings drafts higher
5. ✅ **Professional SaaS aesthetic** - Dual-color system feels modern
6. ✅ **Tactile interactions** - Hover states provide clear feedback
7. ✅ **Status clarity** - Simple borders, minimal color usage
8. ✅ **Structure maintained** - No layout reorganization, only visual refinement

**Files to Modify:**
- `app/globals.css` - Blue system variables, strengthened slate, hover utilities
- `components/ui/button.tsx` - Fix variants with white text on orange
- `components/ActiveCampaignWidget.tsx` - Blue background, orange actions only
- `components/DraftCard.tsx` - Left borders, blue badges, hover states
- `app/app/page.tsx` - 20% padding reduction, hover states, stat card colors
- Various component instances - Update padding classes and apply new color system

**Expected Outcome:**
✅ Clear visual hierarchy (orange = action, blue = info)
✅ Legible buttons with proper contrast ratios
✅ 20% more vertical content visible above fold
✅ Professional dual-color SaaS aesthetic
✅ Tactile hover interactions throughout
✅ Status clarity through minimal color usage
✅ Calm yet energetic design balance
✅ Improved text legibility on white backgrounds

**Estimated Time: 7-9 hours**

---

## Phase 12: AI Idea Generator 💡

### 12.1 Database Schema & Data Models ⚪
- ⚪ Create `user_focus_areas` collection
  - ⚪ Links to user profile
  - ⚪ Status: active/archived
  - ⚪ Generated from AI suggestions based on profile
  - ⚪ Stores strategic focus title, rationale, example topics
- ⚪ Create `generated_ideas` collection
  - ⚪ Tracks all generated ideas with content and context
  - ⚪ User rating field (1-8 scale)
  - ⚪ Status: pending/used/rejected
  - ⚪ Links to posts/campaigns if converted to content
  - ⚪ Generation source tracking (standalone/campaign/wizard)
- ⚪ Create `idea_generation_context` collection
  - ⚪ Snapshots of context used per generation
  - ⚪ Stores profile data state, campaign data (if applicable)
  - ⚪ Enables learning from what context produces highly-rated ideas
- ⚪ Create `user_idea_preferences` collection
  - ⚪ Aggregated learning data from user ratings
  - ⚪ Topic clusters user rates highly
  - ⚪ Tone/style preferences
  - ⚪ Auto-updated from rating submissions

### 12.2 Profile Enhancement - Focus Area Generator 🎯
- ⚪ Add "Your Strategic Focus" section to profile/settings
- ⚪ AI generates 2-3 focus suggestions based on profile input
  - ⚪ Analyzes: industry, role, expertise, goals
  - ⚪ Each suggestion includes: title, 2-3 sentence rationale, example topics
- ⚪ User selection interface
  - ⚪ Select one as active focus
  - ⚪ Regenerate suggestions button
  - ⚪ Customize selected focus inline editor
- ⚪ Store as default context for all idea generation
- ⚪ Create `/api/profile/generate-focus` route
  - ⚪ Uses Claude API to analyze profile
  - ⚪ Returns 2-3 strategic focus suggestions
  - ⚪ Token budget: ~200 tokens per generation

### 12.3 Standalone Idea Generator Tool 💡
- ⚪ Create new route: `/app/ideas` or `/app/idea-generator`
- ⚪ Add "Idea Generator" to left sidebar navigation
- ⚪ Build generator interface
  - ⚪ Generates **3 ideas** per request
  - ⚪ Uses: profile data + active focus + learned preferences
  - ⚪ Optional quick inputs: "I want to talk about..." or "I'm stuck on..."
  - ⚪ Loading states during generation
- ⚪ Create IdeaCard component
  - ⚪ Display topic/angle with brief outline (3-4 bullets)
  - ⚪ Rating widget (1-8 scale slider)
  - ⚪ Action buttons:
    - ⚪ "Create Post" → opens draft wizard pre-populated
    - ⚪ "Create Campaign" → opens campaign wizard pre-populated
    - ⚪ "Regenerate this idea" → creates variation
    - ⚪ "Save for later" → stores for future reference
- ⚪ Create `/api/ideas/generate` route
  - ⚪ Authenticate user
  - ⚪ Fetch profile + focus area + preferences
  - ⚪ Build AI prompt with context
  - ⚪ Generate 3 ideas via Claude API
  - ⚪ Token budget: ~450 tokens (3 × 150)
  - ⚪ Return structured JSON array
- ⚪ Create `/api/ideas/rate` route
  - ⚪ Accept idea ID and rating (1-8)
  - ⚪ Store rating in generated_ideas collection
  - ⚪ Trigger async learning algorithm update

### 12.4 Campaign Tool Integration 🎯
- ⚪ Add "Need topic ideas?" section to campaign creation/edit
- ⚪ Embed IdeaIntegrationWidget component
- ⚪ Generate **2 ideas** based on:
  - ⚪ Campaign goal, target audience, duration
  - ⚪ User profile + active focus area
  - ⚪ NOT other unrelated campaigns
- ⚪ Display ideas with same rating + action interface
- ⚪ "Use this idea" button → adds to campaign planning notes or creates draft
- ⚪ Update `/api/ideas/generate` to accept campaign context parameter
  - ⚪ Conditional logic for campaign-specific prompts
  - ⚪ Token budget: ~300 tokens (2 × 150)

### 12.5 Draft Wizard Integration ✨
- ⚪ Add optional step: "Need inspiration? Generate ideas"
  - ⚪ Available before or alongside existing wizard flow
  - ⚪ Skippable for users who already have content
- ⚪ Generate **2 ideas** based on:
  - ⚪ Any partial input user provided
  - ⚪ Profile + active focus area
  - ⚪ Current wizard settings (if selected)
- ⚪ User selects idea → **populates wizard fields**
  - ⚪ Pre-fills topic, key points
  - ⚪ User still customizes tone, length, CTA, etc.
- ⚪ Capture rating after user views generated post
- ⚪ Update wizard state management to handle idea selection
- ⚪ Token budget: ~300 tokens (2 × 150)

### 12.6 Adaptive Learning System 🧠
- ⚪ **Rating Collection & Storage**
  - ⚪ After user rates idea (1-8), store:
    - ⚪ Rating value and timestamp
    - ⚪ Idea content + context snapshot
    - ⚪ Generation source (standalone/campaign/wizard)
    - ⚪ User ID for aggregation
- ⚪ **Learning Algorithm (Initial Version)**
  - ⚪ Aggregate ratings by topic keywords
    - ⚪ Extract keywords from highly-rated ideas (7-8 ratings)
    - ⚪ Track tone patterns in top ideas
    - ⚪ Identify structure types that perform well
  - ⚪ Weight recent ratings higher (temporal decay)
    - ⚪ Last 30 days: 100% weight
    - ⚪ 30-60 days: 70% weight
    - ⚪ 60+ days: 40% weight
  - ⚪ Use aggregated preferences to:
    - ⚪ Boost similar future suggestions
    - ⚪ Filter out low-rated patterns (1-3 ratings)
- ⚪ **Create `/api/ideas/update-preferences` background job**
  - ⚪ Runs after each rating submission
  - ⚪ Updates user_idea_preferences collection
  - ⚪ Async processing to avoid blocking user
- ⚪ **Optional Advanced (Future Phase)**
  - ⚪ Track posts created from ideas → monitor engagement
  - ⚪ Feed engagement metrics back as implicit signal
  - ⚪ Engagement score: likes + comments × 2 + shares × 3
  - ⚪ Update idea preferences with engagement data

### 12.7 Idea History & Management 📚
- ⚪ Create "My Ideas" tab/section in idea generator
- ⚪ Display all generated ideas with filters:
  - ⚪ Filter by rating (1-8)
  - ⚪ Filter by status (pending/used/rejected)
  - ⚪ Filter by source (standalone/campaign/wizard)
  - ⚪ Sort by date, rating, status
- ⚪ Idea card enhancements:
  - ⚪ Show rating badge
  - ⚪ Show "Used in [Post Title]" if converted
  - ⚪ Re-use button → opens appropriate tool
  - ⚪ Delete/archive option
- ⚪ Create `/api/ideas/history` route
  - ⚪ Fetch user's generated ideas with pagination
  - ⚪ Support filtering and sorting parameters
  - ⚪ Return ideas with linked post/campaign data

### 12.8 AI Prompt Engineering & Context 🤖
- ⚪ **Build Comprehensive System Prompt**
  - ⚪ Include user profile summary (background, expertise, audience, goals)
  - ⚪ Add active focus area description
  - ⚪ Include learned preferences summary (topic clusters, tone patterns)
  - ⚪ Add generation rules (actionable, specific, grounded in reality)
  - ⚪ Specify output format: JSON array with topic, outline, rationale
- ⚪ **Context-Specific Prompts**
  - ⚪ Standalone: "Generate general LinkedIn post ideas"
  - ⚪ Campaign: "Generate ideas aligned with [campaign goal]"
  - ⚪ Wizard: "Build on this partial idea: [user input]"
- ⚪ **Token Optimization Strategies**
  - ⚪ Cache user profile + preferences (changes infrequently)
  - ⚪ Only send relevant campaign/wizard context
  - ⚪ Use structured JSON output for easy parsing
  - ⚪ Compress context where possible without losing meaning
- ⚪ **Quality Enforcement**
  - ⚪ Prompt must emphasize: specific over generic
  - ⚪ Must be rooted in user's reality (not abstract thought leadership)
  - ⚪ Must include 3-4 specific talking points
  - ⚪ Must avoid buzzwords and corporate jargon

### 12.9 UI/UX Components & Navigation 🎨
- ⚪ **Create New Components**
  - ⚪ `FocusAreaSelector.tsx` (Profile page)
    - ⚪ Display 2-3 AI suggestions as cards
    - ⚪ Selection radio buttons
    - ⚪ Regenerate button
    - ⚪ Inline edit mode for customization
  - ⚪ `IdeaGenerator.tsx` (Standalone tool main component)
    - ⚪ Optional context input field
    - ⚪ Generate button with loading state
    - ⚪ Idea cards grid/list
  - ⚪ `IdeaCard.tsx` (Reusable idea display)
    - ⚪ Topic headline
    - ⚪ 3-4 bullet outline
    - ⚪ Rating slider (1-8)
    - ⚪ Action buttons (create post/campaign, regenerate, save)
  - ⚪ `IdeaIntegrationWidget.tsx` (Campaign/Wizard embeds)
    - ⚪ Compact version of generator
    - ⚪ "Get Ideas" expandable section
    - ⚪ Context-aware generation
  - ⚪ `RatingSlider.tsx` (1-8 scale input)
    - ⚪ Visual slider with labels
    - ⚪ Submit button
    - ⚪ Confirmation feedback
  - ⚪ `IdeaHistory.tsx` (View past ideas)
    - ⚪ Filter controls
    - ⚪ Idea cards with status badges
    - ⚪ Pagination
- ⚪ **Navigation Updates**
  - ⚪ Add "💡 Idea Generator" to sidebar
  - ⚪ Add "💡 Get Ideas" buttons in Campaign + Wizard
  - ⚪ Position between "Create New Post" and "All Drafts"
- ⚪ **Design Consistency**
  - ⚪ Use existing color palette (orange accent, slate grey)
  - ⚪ Match typography (Outfit headings, Inter body)
  - ⚪ Follow 8px grid system
  - ⚪ Consistent card shadows and spacing
  - ⚪ Smooth animations for idea loading/rating

---

## Phase 11: Security & Optimization

### 11.1 Security Hardening ⚪
- ⚪ Write Firestore security rules:
  - ⚪ Users can only read/write their own documents
  - ⚪ Draft access restricted to owner
  - ⚪ Campaign access restricted to owner
  - ⚪ Campaign templates public read-only
- ⚪ Add Firebase Auth token verification to all API routes
- ⚪ Implement rate limiting on `/api/generate` route
- ⚪ Validate and sanitize all user inputs
- ⚪ Use environment variables for sensitive keys
- ⚪ Verify Stripe webhook signatures
- ⚪ Add CSRF protection
- ⚪ Implement proper error handling (no sensitive data in errors)

### 11.2 Performance Optimization ⚪
- ⚪ Use Server Components where possible
- ⚪ Implement proper data fetching patterns
- ⚪ Add loading states and skeleton screens
- ⚪ Optimize images (use Next.js Image component)
- ⚪ Optimize fonts (use next/font)
- ⚪ Implement proper caching strategies
- ⚪ Add error boundaries
- ⚪ Code splitting for large components
- ⚪ Lazy load heavy components
- ⚪ Minimize client-side JavaScript

### 11.3 Testing & Quality Assurance ⚪
- ⚪ Test authentication flows:
  - ⚪ Google OAuth
  - ⚪ Email/password signup
  - ⚪ Email verification
  - ⚪ Password reset
- ⚪ Test post generation:
  - ⚪ All wizard configurations
  - ⚪ Both languages (EN/NO)
  - ⚪ Usage limits
  - ⚪ Error handling
- ⚪ Test Stripe integration:
  - ⚪ Checkout flow
  - ⚪ Webhooks (use Stripe CLI)
  - ⚪ Usage tracking
  - ⚪ Monthly reset
- ⚪ Test campaign flow:
  - ⚪ Creation
  - ⚪ Sequential generation
  - ⚪ One active campaign limit
- ⚪ Cross-browser testing
- ⚪ Mobile responsiveness testing

### 11.4 Deployment ⚪
- ⚪ Connect GitHub repository to Vercel
- ⚪ Set up production environment variables in Vercel
- ⚪ Configure Firebase project for production
- ⚪ Set up Stripe production keys
- ⚪ Deploy to Vercel
- ⚪ Test production deployment
- ⚪ Configure custom domain (if applicable)
- ⚪ Set up monitoring and error tracking (Sentry, LogRocket, etc.)
- ⚪ Configure analytics (optional)

---

## 🗄️ Firestore Schema

### `/users/{uid}`
```typescript
{
  email: string
  displayName: string
  photoURL: string
  profile: {
    background: string
    expertise: string[]
    targetAudience: string
    goals: string
    writingStyle: string
    brandVoice: string
  }
  subscription: {
    tier: 'free' | 'pro' | 'enterprise'
    status: 'active' | 'canceled' | 'past_due'
    stripeCustomerId: string
    stripePriceId: string
    currentPeriodEnd: Timestamp
  }
  postsUsedThisMonth: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `/drafts/{draftId}`
```typescript
{
  userId: string
  content: string
  status: 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived'
  language: 'en' | 'no'
  tags: string[]
  scheduledDate: Timestamp | null
  wizardSettings: {
    input: string
    referenceUrls: string[]
    tone: string
    purpose: string
    audience: string
    style: string
    length: 'short' | 'medium' | 'long'
    includeCTA: boolean
    emojiUsage: 'none' | 'minimal' | 'moderate'
  }
  campaignId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `/drafts/{draftId}/versions/{versionId}`
```typescript
{
  content: string
  createdAt: Timestamp
}
```

### `/campaigns/{campaignId}`
```typescript
{
  userId: string
  name: string
  theme: string
  description: string
  language: 'en' | 'no'
  startDate: Timestamp
  endDate: Timestamp
  frequency: 'daily' | '3x_week' | 'weekly'
  targetPostCount: number
  style: string
  tone: 'professional' | 'casual' | 'inspirational' | 'educational'
  purpose: 'engagement' | 'lead_generation' | 'brand_awareness' | 'thought_leadership'
  audience: 'executives' | 'entrepreneurs' | 'professionals' | 'industry_specific'
  templateId: string | null
  status: 'active' | 'completed' | 'archived'
  postsGenerated: number
  aiStrategy: {
    overallApproach: string
    strategicOverview: string
    narrativeArc: string
    successMarkers: string[]
    postBlueprints: Array<{
      position: number
      topic: string
      goal: string
      locked: boolean
      userCustomized: boolean
    }>
  } | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `/campaignTemplates/{templateId}`
```typescript
{
  name: string
  description: string
  defaultSettings: {
    frequency: string
    style: string
    tone: string
    targetPostCount: number
  }
  createdAt: Timestamp
}
```

### `/user_focus_areas/{focusId}`
```typescript
{
  userId: string
  title: string
  rationale: string
  exampleTopics: string[]
  status: 'active' | 'archived'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `/generated_ideas/{ideaId}`
```typescript
{
  userId: string
  topic: string
  outline: string[]
  rationale: string
  generationSource: 'standalone' | 'campaign' | 'wizard'
  campaignId: string | null
  contextSnapshot: {
    profileData: object
    campaignData: object | null
    wizardInput: string | null
  }
  rating: number | null // 1-8 scale
  status: 'pending' | 'used' | 'rejected'
  linkedPostId: string | null
  linkedCampaignId: string | null
  createdAt: Timestamp
  ratedAt: Timestamp | null
}
```

### `/idea_generation_context/{contextId}`
```typescript
{
  userId: string
  ideaId: string
  profileState: {
    background: string
    expertise: string[]
    targetAudience: string
    goals: string
    writingStyle: string
    brandVoice: string
  }
  activeFocusArea: {
    title: string
    rationale: string
  } | null
  campaignContext: {
    name: string
    theme: string
    targetPostCount: number
  } | null
  createdAt: Timestamp
}
```

### `/user_idea_preferences/{userId}`
```typescript
{
  userId: string
  topicClusters: Array<{
    keywords: string[]
    averageRating: number
    count: number
  }>
  tonePatterns: Array<{
    tone: string
    averageRating: number
    count: number
  }>
  structureTypes: Array<{
    type: string
    averageRating: number
    count: number
  }>
  lastUpdated: Timestamp
  totalIdeasRated: number
}
```

---

## 🎯 Priority Implementation Order

1. **Phase 1** - Foundation & Setup *(Required for everything)*
2. **Phase 2** - Landing & Authentication *(User access)*
3. **Phase 3** - Onboarding & Profile *(AI personalization data)*
4. **Phase 4** - Core Dashboard *(Navigation & overview)*
5. **⚡ Phase 5 - Post Creation** *(CRITICAL - Core value proposition)*
6. **Phase 6** - Content Editor *(Refinement & versioning)*
7. **Phase 7** - Draft Management *(Organization)*
8. **Phase 8** - Campaign Planning *(Advanced feature)*
9. **💡 Phase 12 - AI Idea Generator** *(Enhances campaigns, wizard, standalone ideation)*
10. **Phase 9** - Billing & Subscriptions *(Monetization)*
11. **🎨 Phase 10 - Design & UX Enhancement** *(Visual polish & user experience)*
12. **Phase 11** - Security & Optimization *(Technical polish & launch)*

---

## 📝 Notes

- **Human-Sounding Content**: Claude system prompts must emphasize authenticity, avoiding corporate jargon and AI clichés
- **Bilingual Support**: UI in English, generated content in English or Norwegian based on user selection
- **Mobile-First**: Sidebar collapses to icon-only on mobile devices
- **Auto-Save**: Implement throughout (wizard, editor) to prevent data loss
- **Error Handling**: Graceful degradation with user-friendly messages
- **Rate Limiting**: Protect generate API from abuse
- **Version Control**: Track all content iterations for user reference
- **💡 Idea Generator**: Adaptive learning system improves suggestions over time based on user ratings (1-8 scale). Works with minimal context but improves as user adds profile data, focus areas, and rating feedback. Three entry points: standalone tool, campaign integration, draft wizard integration.

---

**Last Updated:** 2025-10-01
**Status:** Phase 1-6 Core Complete ✅ | Post Generation Working 🚀 | Deployed to Production ✅
**Live URL:** https://storyscale-v10.vercel.app
**GitHub:** https://github.com/Henninght/storyscale-v10

## ✅ Completed Milestones
- **Authentication:** Google OAuth + Email/Password ✅
- **Deployment:** Vercel with auto-deploy from GitHub ✅
- **Firebase Integration:** Firestore + Auth + Admin SDK ✅
- **Dashboard:** All routes, navigation, stats cards ✅
- **Profile & Onboarding:** 6-step wizard with AI personalization ✅
- **Post Creation Wizard:** 4-step wizard with comprehensive settings ✅
- **Claude AI Integration:** `/api/generate` with user profile context ✅
- **Draft Editor:** Edit, regenerate, save, copy, metadata ✅
- **Draft Management:** Cards with filters, sorting, status badges ✅
- **Security:** Pre-commit hooks prevent .env.local commits ✅

## 🎯 Next Priorities
1. **Phase 6.2:** Create `/api/enhance` route for AI content improvements
2. **Phase 7:** All Drafts page with search & Calendar view
3. **Phase 8:** Campaign planning with sequential generation
4. **💡 Phase 12:** AI Idea Generator - Adaptive content ideation system with three integration points
5. **Phase 9:** Stripe billing integration for monetization
6. **Phase 10:** 🎨 Design & UX Enhancement - Visual upgrades and tooltips
7. **Phase 11:** Security hardening & performance optimization
