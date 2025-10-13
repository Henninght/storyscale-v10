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

## Phase 3: Onboarding & Profile (Setup)

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

## Phase 8: Campaign Planning & Intelligence 🎯

**Note:** Phase 8 sections 8.1-8.12 are complete and archived in finished-tasks.md. See that file for implementation details.

### 8.13 Enhanced Campaign Detail Page with Post Details ✅
- ✅ **Timeline Post Cards Enhancement**
  - ✅ Show AI-suggested topic from aiStrategy.postBlueprints[index].topic
  - ✅ Display post goal/purpose from blueprint
  - ✅ Increase content preview from 150 to 300 characters (400 chars)
  - ✅ Add strategic position label (e.g., "Opening • Awareness phase")
  - ✅ Show connection to previous post ("Builds on: [previous topic]")
  - ✅ Expandable section for full AI strategy details
- ✅ **Campaign Strategy Display Section**
  - ✅ Show strategic overview at top of timeline
  - ✅ Display narrative arc description
  - ✅ Show success markers in dedicated section
  - ✅ Add campaign metadata: tone, purpose, audience (if available)

### 8.14 Campaign Wizard Advanced Configuration ✅
- ✅ **Add Configuration Dropdowns to Step 1**
  - ✅ Tone dropdown: Professional, Casual, Inspirational, Educational
  - ✅ Purpose dropdown: Engagement, Lead Generation, Brand Awareness, Thought Leadership
  - ✅ Target Audience dropdown: Executives, Entrepreneurs, Professionals, Industry-Specific
  - ✅ Keep all in single card with 2-column grid layout
  - ✅ Add after template selection, before name/theme inputs
- ✅ **Update Form State & Database**
  - ✅ Add tone, purpose, audience to formData
  - ✅ Save to Firestore campaigns collection
  - ✅ Pass to /api/campaigns/brief for better AI strategy
- ✅ **Update Campaign TypeScript Interface**
  - ✅ Add tone, purpose, audience fields
  - ✅ Ensure aiStrategy structure is properly typed

### 8.15 AI Campaign Input Validator (Bilingual Support) ✅
- ✅ **Create Validation API Endpoint**
  - ✅ Route: /api/campaigns/validate-input
  - ✅ Accept: text, language (en/no), fieldType (theme/description)
  - ✅ Use Claude API to analyze input quality
  - ✅ Return: scores (clarity, specificity, actionability), feedback, suggestions
  - ✅ Support both English and Norwegian responses
- ✅ **Create Validation UI Component**
  - ✅ Component: components/CampaignInputValidator.tsx
  - ✅ Debounced validation (500ms after typing stops)
  - ✅ Quality indicator: 🔴 red / 🟡 yellow / 🟢 green badges
  - ✅ Expandable "AI Suggestions" section
  - ✅ Non-blocking (users can proceed regardless)
  - ✅ Clean, minimal design
- ✅ **Integration Points**
  - ✅ Add to Campaign Theme input field
  - ✅ Add to Campaign Description textarea
  - ✅ Real-time feedback as user types
  - ✅ Loading state during validation

### 8.16 Campaign System Overhaul 🔄 (Major Refactor)

**Context:** The current campaign system has fundamental disconnect issues between creation and post generation, resulting in poor post quality and user confusion.

**Problems Identified:**
1. **Disconnected Creation Flow**
   - Users enter vague campaign themes in freeform textarea
   - No structured data collection about actual product/topic
   - AI generates generic campaign briefs from minimal input
   - Post blueprints lack specificity despite AI strategy

2. **Generic Post Generation**
   - Post wizard requires manual user input for each post
   - Users don't know what specific information to provide
   - Campaign context not effectively leveraged
   - Generated posts contain "jibberish" and aren't rooted in campaign

3. **Too Many Template Choices**
   - Six templates causing decision paralysis
   - Users unsure which template fits their needs
   - Templates don't drive meaningful differentiation

**Solution: Template-Driven Structured Workflow**

#### Phase 1: Reduce & Refine Templates (2-3 hours) ⏳

**Objective:** Simplify template options to two highly focused choices

**Files to Modify:**
- `lib/campaignTemplates.ts` - Reduce from 6 to 2 templates ✅

**Implementation:**
- ✅ **Keep only 2 templates:**
  - ✅ **Product Launch** - For announcing new products/features/services
  - ✅ **Thought Leadership** - For establishing expertise and industry authority
- ✅ **Remove templates:**
  - ✅ Educational Series (can be covered by Thought Leadership)
  - ✅ Company Updates (too generic)
  - ✅ Case Study Series (can be part of Product Launch or Thought Leadership)
  - ✅ Industry Insights (covered by Thought Leadership)
- ⚪ **Update template structure** to include structured field definitions:
  ```typescript
  interface CampaignTemplate {
    id: string
    name: string
    description: string
    icon: string
    defaultSettings: {
      frequency: string
      style: string
      targetPostCount: number
      tone: string
      purpose: string
    }
    requiredFields: Array<{
      id: string
      label: string
      type: 'text' | 'textarea' | 'select' | 'multiselect'
      placeholder: string
      helperText: string
      required: boolean
      options?: string[]  // For select/multiselect
    }>
  }
  ```
- ⚪ **Define Product Launch required fields:**
  - ⚪ Product/Feature Name
  - ⚪ What problem does it solve? (textarea)
  - ⚪ Key features/benefits (multiselect or bullet list)
  - ⚪ Target customers (text)
  - ⚪ Launch date/timeline (date)
  - ⚪ Unique selling proposition (textarea)
- ⚪ **Define Thought Leadership required fields:**
  - ⚪ Core topic/expertise area
  - ⚪ Key insights/perspectives to share (textarea)
  - ⚪ Supporting evidence (case studies, data, experience)
  - ⚪ Target audience pain points (textarea)
  - ⚪ Desired audience action/takeaway

#### Phase 2: Template-Specific Input Wizards (4-5 hours) ⚪

**Objective:** Create dynamic wizard forms that collect structured data based on template selection

**Files to Create:**
- `components/campaigns/ProductLaunchWizard.tsx` - Product Launch specific form
- `components/campaigns/ThoughtLeadershipWizard.tsx` - Thought Leadership specific form
- `components/campaigns/TemplateFieldRenderer.tsx` - Reusable field renderer component

**Files to Modify:**
- `app/app/campaigns/page.tsx` - Update campaign creation wizard

**Implementation:**
- ⚪ **Create ProductLaunchWizard component**
  - ⚪ Step 1: Basic campaign info (name, dates, frequency)
  - ⚪ Step 2: Product details form (all required fields from template)
  - ⚪ Step 3: AI strategy generation with structured inputs
  - ⚪ Step 4: Review and confirm
  - ⚪ Form validation ensuring all required fields completed
  - ⚪ Save structured data to campaign document
- ⚪ **Create ThoughtLeadershipWizard component**
  - ⚪ Same 4-step structure but with different fields
  - ⚪ Expertise area, insights, evidence collection
  - ⚪ Audience pain points and desired outcomes
- ⚪ **Create TemplateFieldRenderer component**
  - ⚪ Renders appropriate input based on field type
  - ⚪ Handles validation and helper text display
  - ⚪ Consistent styling across all template forms
  - ⚪ Support for text, textarea, select, multiselect, date inputs
- ⚪ **Update campaign creation page**
  - ⚪ Template selection as first step
  - ⚪ Conditionally render appropriate wizard based on selection
  - ⚪ Pass template configuration to wizard component
  - ⚪ Store template ID and structured data in campaign document

#### Phase 3: Structured Brief Generation (3-4 hours) ⚪

**Objective:** Enhance AI campaign brief generation to use structured inputs instead of vague text

**Files to Modify:**
- `app/api/campaigns/brief/route.ts` - Enhance with structured input handling

**Implementation:**
- ⚪ **Update request body to accept structured data:**
  ```typescript
  interface BriefRequest {
    templateId: 'product-launch' | 'thought-leadership'
    campaignGoal: string  // Keep for backward compatibility
    postCount: number
    structuredInputs: {
      [key: string]: any  // Template-specific fields
    }
    style: string
    tone: string
    purpose: string
    audience: string
  }
  ```
- ⚪ **Build template-specific prompts:**
  - ⚪ Product Launch prompt includes: product name, problem, features, USP, target customers
  - ⚪ Thought Leadership prompt includes: expertise area, insights, evidence, audience pain points
  - ⚪ Structured format makes it clear what each post should cover
- ⚪ **Enhance post blueprint generation:**
  - ⚪ Use specific product features/benefits for Product Launch posts
  - ⚪ Use specific insights/perspectives for Thought Leadership posts
  - ⚪ Generate topics that directly reference structured inputs
  - ⚪ Create more specific goals for each post (not generic)
- ⚪ **Example Product Launch blueprint:**
  ```
  Post 1: Teaser - "The problem with [specific pain point]"
  Post 2: Solution intro - "Introducing [product name]"
  Post 3: Feature spotlight - "[Specific feature 1] and why it matters"
  Post 4: Use case - "How [target customer] uses [product]"
  Post 5: Social proof - "Early results from beta users"
  Post 6: Launch day - "Available now: Here's how to get started"
  ```
- ⚪ **Update campaign document structure:**
  - ⚪ Store `templateId` field
  - ⚪ Store `structuredInputs` object with all template fields
  - ⚪ Keep `aiStrategy` with enhanced blueprints

#### Phase 4: Smart Post Input Pre-filling (3-4 hours) ⚪

**Objective:** Pre-populate post wizard with campaign context and required elements to guide users

**Files to Modify:**
- `components/PostWizard.tsx` - Enhance campaign context handling
- `app/api/generate/route.ts` - Already has good campaign context (lines 419-478)

**Implementation:**
- ⚪ **Enhance PostWizard Step 1 (Input) for campaign posts:**
  - ⚪ Load campaign document with structured inputs
  - ⚪ Load post blueprint for current post number
  - ⚪ Pre-fill input textarea with helpful scaffold:
    ```
    [Campaign: Product Launch for {productName}]

    Post {X} of {Y}: {blueprintTopic}
    Goal: {blueprintGoal}

    Key points to cover:
    • {Relevant structured input 1}
    • {Relevant structured input 2}
    • {Relevant structured input 3}

    Your thoughts:
    [Cursor starts here - user adds their angle/story]
    ```
  - ⚪ Show campaign context card with reminder of product/topic details
  - ⚪ Make it clear user should expand on the scaffold, not replace it
- ⚪ **Update wizard data loading (PostWizard.tsx lines 116-165):**
  - ⚪ Fetch campaign document including `structuredInputs`
  - ⚪ Extract relevant fields for current post
  - ⚪ Build scaffold text based on template type
  - ⚪ Set as initial `input` value in wizard state
- ⚪ **Enhance generate API prompt (already good, minor additions):**
  - ⚪ Explicitly reference structured inputs in prompt
  - ⚪ Remind AI to use specific product features/insights
  - ⚪ Include scaffold in user message so AI sees full context
  - ⚪ Keep existing campaign context handling (lines 419-478)

#### Phase 5: Update Campaign Creation Flow (2-3 hours) ⚪

**Objective:** Wire up new template-driven wizard to campaign creation page

**Files to Modify:**
- `app/app/campaigns/page.tsx` - Major refactor of wizard structure

**Implementation:**
- ⚪ **Update wizard steps:**
  1. **Step 1: Template Selection**
     - ⚪ Display 2 template cards (Product Launch, Thought Leadership)
     - ⚪ Show description, icon, use cases for each
     - ⚪ Select button sets `selectedTemplate` state
  2. **Step 2: Basic Info**
     - ⚪ Campaign name, dates, frequency (keep existing)
     - ⚪ Remove vague "theme" textarea (replaced by structured inputs)
  3. **Step 3: Template-Specific Details**
     - ⚪ Render `ProductLaunchWizard` or `ThoughtLeadershipWizard`
     - ⚪ Collect all structured inputs
     - ⚪ Validation before proceeding
  4. **Step 4: AI Strategy Generation**
     - ⚪ Call `/api/campaigns/brief` with structured data
     - ⚪ Show generated strategy with specific post topics
     - ⚪ Allow editing individual topics (existing feature)
  5. **Step 5: Confirmation**
     - ⚪ Review all inputs and strategy
     - ⚪ Create campaign button
- ⚪ **Update form state management:**
  - ⚪ Add `templateId` field
  - ⚪ Add `structuredInputs` object
  - ⚪ Remove generic `theme` field
  - ⚪ Update validation logic
- ⚪ **Update campaign creation:**
  - ⚪ Save template ID and structured inputs to Firestore
  - ⚪ Ensure all data properly stored for later use

#### Phase 6: Testing & Validation (2 hours) ⚪

**Objective:** Ensure end-to-end flow works and posts are higher quality

**Testing Checklist:**
- ⚪ **Template selection:**
  - ⚪ Both templates display correctly
  - ⚪ Selection triggers correct wizard component
- ⚪ **Structured data collection:**
  - ⚪ All required fields validated
  - ⚪ Helper text displays correctly
  - ⚪ Form saves properly to state
- ⚪ **AI strategy generation:**
  - ⚪ Structured inputs passed to API
  - ⚪ Generated blueprints reference specific inputs
  - ⚪ Topics are specific, not generic
- ⚪ **Post generation:**
  - ⚪ Wizard pre-fills with campaign context
  - ⚪ User can expand on scaffold
  - ⚪ Generated posts reference actual product/topic
  - ⚪ Posts feel cohesive within campaign
- ⚪ **Edge cases:**
  - ⚪ Missing required fields blocked at validation
  - ⚪ Error handling for API failures
  - ⚪ Existing campaigns still viewable (backward compatibility)

**Success Criteria:**
✅ Users can only select from 2 clear templates
✅ Campaign creation collects specific, actionable information
✅ AI generates specific post topics based on structured inputs
✅ Post wizard guides users with pre-filled campaign context
✅ Generated posts actually reference the product/topic/insights
✅ Posts feel rooted in the campaign, not generic

**Estimated Total Time: 16-21 hours**

**Files Summary:**
- **To Create:**
  - `components/campaigns/ProductLaunchWizard.tsx`
  - `components/campaigns/ThoughtLeadershipWizard.tsx`
  - `components/campaigns/TemplateFieldRenderer.tsx`
- **To Modify:**
  - `lib/campaignTemplates.ts` (reduce to 2 templates, add field definitions)
  - `app/app/campaigns/page.tsx` (refactor wizard structure)
  - `app/api/campaigns/brief/route.ts` (handle structured inputs)
  - `components/PostWizard.tsx` (pre-fill with campaign context)
  - `app/api/generate/route.ts` (minor enhancements, mostly already good)

**Database Schema Update:**
```typescript
// Add to /campaigns/{campaignId}
{
  // ... existing fields ...
  templateId: 'product-launch' | 'thought-leadership'
  structuredInputs: {
    // Product Launch example:
    productName: string
    problemSolved: string
    keyFeatures: string[]
    targetCustomers: string
    launchDate: string
    uniqueSellingProposition: string

    // Thought Leadership example:
    expertiseArea: string
    keyInsights: string
    evidence: string
    audiencePainPoints: string
    desiredAction: string
  }
}
```

---

## Phase 13: AI Style & Tone Training System 🎯

### 13.1 Few-Shot Example System ⚪
**Purpose:** Improve AI generation quality by providing style/tone-specific examples

**Implementation:**
- ⚪ Create `styleExamples` object with 12 curated LinkedIn post examples
  - ⚪ Story-based + Professional (Challenge-Action-Result framework)
  - ⚪ Story-based + Casual (Personal anecdote with lesson)
  - ⚪ Story-based + Inspirational (Overcoming challenge narrative)
  - ⚪ Story-based + Educational (Case study structure)
  - ⚪ List format + Professional (Strategic framework)
  - ⚪ List format + Educational (Numbered insights with takeaways)
  - ⚪ List format + Casual (Quick tips with personality)
  - ⚪ List format + Inspirational (Motivational lessons list)
  - ⚪ Question-based + Professional (Thought-provoking with context)
  - ⚪ Question-based + Casual (Simple engaging question)
  - ⚪ How-to + Professional (Step-by-step framework)
  - ⚪ How-to + Casual (Practical tips with personal touch)
- ⚪ Build helper function `getExampleForStyle(style, tone)` to match examples
- ⚪ Inject relevant example into system prompt before generation
- ⚪ Add "EXAMPLE OF THIS STYLE" section with matched example
- ⚪ Instruct AI to emulate structure but use user's specific content

**Files Modified:**
- `app/api/generate/route.ts` (lines 166-342)

**Expected Outcome:** 30-50% improvement in style/tone accuracy

**Time Estimate:** 3-4 hours

### 13.2 User Feedback Collection System ⚪
**Purpose:** Gather data on generation quality through explicit + behavioral feedback

**Database Schema:**
```typescript
// New Firestore collection: /post_feedback/{feedbackId}
{
  draftId: string
  userId: string
  rating: 'thumbs_up' | 'thumbs_down' | null
  regenerated: boolean  // User clicked regenerate
  editPercentage: number  // Content change amount
  timeToReady: number  // Minutes to mark ready_to_post
  wizardSettings: WizardSettings  // Generation parameters
  originalLength: number
  finalLength: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Implementation:**
- ⚪ Add `PostFeedback` interface to `types/index.ts`
- ⚪ Add feedback widget to `components/DraftEditor.tsx`
  - ⚪ Thumbs up/down buttons with clean styling
  - ⚪ "How's this draft?" prompt text
  - ⚪ Saves feedback to Firestore on click
- ⚪ Track behavioral metrics automatically:
  - ⚪ Regeneration: Already tracked via handleRegenerate()
  - ⚪ Edit percentage: Calculate on save comparing lengths
  - ⚪ Time to ready: Track when status → ready_to_post
- ⚪ Store feedback in `/post_feedback` collection
  - ⚪ Include all wizard settings for analysis
  - ⚪ Link to draft ID for reference
  - ⚪ Timestamp all feedback events

**Files Modified:**
- `types/index.ts` - Add PostFeedback interface
- `components/DraftEditor.tsx` - Add UI widget + tracking
- Firestore schema - New collection

**Expected Outcome:** Data-driven insights into quality patterns

**Time Estimate:** 4-5 hours

### 13.3 Analytics Dashboard (Optional) ⚪
**Purpose:** Visualize feedback data to identify optimization opportunities

**Implementation:**
- ⚪ Create `/app/app/analytics/page.tsx`
- ⚪ Display key metrics:
  - ⚪ Most used style/tone/purpose combinations
  - ⚪ Average rating by combination
  - ⚪ Regeneration rate by settings
  - ⚪ Edit percentage by parameters
  - ⚪ Time to ready by configuration
- ⚪ Build visualizations:
  - ⚪ Heatmap: style × tone performance grid
  - ⚪ Bar charts: regeneration rates
  - ⚪ Tables: detailed breakdown with filters
- ⚪ Add filters:
  - ⚪ Date range selector
  - ⚪ Tone/style/purpose filters
  - ⚪ Rating threshold
- ⚪ Create `/api/analytics/feedback` route
  - ⚪ Aggregate feedback data
  - ⚪ Calculate averages and trends
  - ⚪ Return JSON for dashboard display

**Files Created:**
- `app/app/analytics/page.tsx` - Analytics dashboard
- `app/api/analytics/feedback/route.ts` - Data aggregation API

**Expected Outcome:** Clear visibility into what's working

**Time Estimate:** 5-6 hours

### 13.4 Prompt Optimization Loop (Ongoing) ⚪
**Purpose:** Continuously improve prompts based on feedback data

**Process:**
1. **Monthly Review** (Manual)
   - ⚪ Review analytics dashboard
   - ⚪ Identify underperforming combinations (high regeneration, low thumbs-up)
   - ⚪ Analyze successful patterns (low regeneration, high thumbs-up)
   - ⚪ Note common edit patterns

2. **Refinement** (Manual)
   - ⚪ Update `styleExamples` for underperforming combinations
   - ⚪ Refine system prompt instructions
   - ⚪ Adjust tone descriptions based on feedback
   - ⚪ Document changes and reasons

3. **Testing** (Manual)
   - ⚪ Generate test posts with updated prompts
   - ⚪ Compare quality to previous versions
   - ⚪ Deploy if improved

4. **Future Automation** (Phase 2)
   - ⚪ AI analyzes feedback patterns
   - ⚪ Suggests prompt improvements
   - ⚪ A/B tests variations
   - ⚪ Auto-updates best performers

**Expected Outcome:** Iterative quality improvements over time

**Time Estimate:** 2-3 hours/month ongoing

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
**Note:** Section 10.1 is complete and archived in finished-tasks.md.

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
**Note:** Section 10.3 is complete and archived in finished-tasks.md.

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
**Note:** Section 10.7 and all subsections (10.7.1-10.7.9) are complete and archived in finished-tasks.md.

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

## Phase 14: User Feedback System 💬

### 14.1 Beta User Feedback Form ⚪
**Purpose:** Collect structured feedback from beta users to improve product

**Implementation:**
- ⚪ Create `FeedbackButton.tsx` component
  - ⚪ Floating button (bottom-right) with "Feedback" label
  - ⚪ Non-intrusive trigger - only visible when needed
  - ⚪ Slide-in panel (not modal) to avoid disruption
- ⚪ Feedback form fields (~1 minute to complete)
  - ⚪ Star rating (1-5) for overall impression
  - ⚪ Category dropdown: Bug, Feature Request, Design, Other
  - ⚪ Description textarea (optional)
  - ⚪ Email input (optional, for follow-up)
- ⚪ Form submission
  - ⚪ Submit button with loading state
  - ⚪ Success animation with thank you message
  - ⚪ Auto-close after 2 seconds
- ⚪ Best practices applied
  - ⚪ Minimal required fields (only star rating)
  - ⚪ Clear completion time indicator
  - ⚪ Non-blocking, can be dismissed anytime
  - ⚪ Smooth animations using Framer Motion

**Files Created:**
- `components/FeedbackButton.tsx` - Floating button + slide-in panel

**Design Notes:**
- Blue theme for secondary action (feedback = information gathering)
- Floating button doesn't interfere with main actions
- Slide-in panel preserves page context
- Simple, clean design matching app aesthetic

### 14.2 Testimonial/Star Rating Widget ⚪
**Purpose:** Display social proof with customer testimonials and ratings

**Implementation:**
- ⚪ Create `TestimonialWidget.tsx` component
  - ⚪ Carousel-based display with navigation
  - ⚪ Smooth transitions between testimonials
  - ⚪ Auto-play option (optional parameter)
- ⚪ Testimonial card structure
  - ⚪ 5-star rating display at top
  - ⚪ Quote text (large, readable typography)
  - ⚪ Author info with avatar/initial
  - ⚪ Role and company display
- ⚪ Navigation controls
  - ⚪ Previous/Next buttons
  - ⚪ Dot indicators for position
  - ⚪ Click dots to jump to specific testimonial
- ⚪ Create compact `TestimonialCard.tsx` variant
  - ⚪ Single card display for sidebars
  - ⚪ Hover effects for interactivity
  - ⚪ Smaller footprint, same information

**Files Created:**
- `components/TestimonialWidget.tsx` - Main carousel component + compact card variant

**Data Structure:**
```typescript
interface Testimonial {
  id: string
  name: string
  role: string
  company?: string
  rating: number
  quote: string
  avatar?: string
}
```

**Design Notes:**
- Minimal, clean card design with ample whitespace
- Star ratings provide quick trust signals
- Decorative quote icon for visual interest
- Placement: Dedicated section, not on every page
- Avoids "spam" feel through intentional placement

### 14.3 Feedback API Endpoint ⚪
**Purpose:** Store user feedback in database for review

**Implementation:**
- ⚪ Create `/api/feedback` route
- ⚪ Accept POST requests with feedback data
  - ⚪ rating: number (1-5)
  - ⚪ category: string
  - ⚪ description: string (optional)
  - ⚪ email: string (optional)
  - ⚪ timestamp: ISO string
- ⚪ Authenticate user via Firebase Auth token
- ⚪ Store in Firestore `/feedback/{feedbackId}` collection
- ⚪ Return success/error response
- ⚪ Rate limiting to prevent abuse
- ⚪ Input validation and sanitization

**Database Schema:**
```typescript
// /feedback/{feedbackId}
{
  userId: string
  rating: number  // 1-5
  category: 'bug' | 'feature' | 'design' | 'other'
  description: string
  email: string | null
  userAgent: string  // Browser info
  page: string  // Where feedback was submitted
  createdAt: Timestamp
}
```

**Files Created:**
- `app/api/feedback/route.ts` - Feedback submission endpoint

### 14.4 Testimonials Management ⚪
**Purpose:** Admin interface for managing testimonials (future phase)

**Initial Implementation:**
- ⚪ Seed testimonials in code (hardcoded array)
- ⚪ Create sample data with 5-10 testimonials
- ⚪ Ensure variety: different roles, companies, ratings
- ⚪ Focus on specific benefits and outcomes

**Future Enhancement (Optional):**
- ⚪ Admin dashboard for adding/editing testimonials
- ⚪ Store testimonials in Firestore
- ⚪ Approval workflow for user-submitted testimonials
- ⚪ Analytics on testimonial views/interactions

### 14.5 Integration Points ⚪
**Where to place feedback system:**

- ⚪ **FeedbackButton (Floating)**
  - ⚪ Globally available on all authenticated pages
  - ⚪ Add to main layout component
  - ⚪ Only show for logged-in users
  - ⚪ Hide on mobile if screen too narrow

- ⚪ **Testimonial Widget**
  - ⚪ Landing page above pricing section
  - ⚪ Optional: Settings page (social proof for upgrading)
  - ⚪ Optional: Campaign success examples
  - ⚪ Avoid placing on every page (reduces impact)

**Files to Modify:**
- `app/layout.tsx` - Add FeedbackButton for authenticated users
- `app/page.tsx` (landing) - Add TestimonialWidget section
- Optional: `app/app/settings/page.tsx` - Add compact testimonial cards

### 14.6 UX Considerations ✅
**Note:** Section 14.6 is complete and archived in finished-tasks.md.

### 14.7 Analytics & Review (Future) ⚪
**Track feedback effectiveness:**

- ⚪ Monitor feedback submission rate
- ⚪ Categorize feedback by type
- ⚪ Track rating distribution over time
- ⚪ Identify common themes in descriptions
- ⚪ Create admin dashboard for reviewing feedback
- ⚪ Export feedback data for analysis

**Expected Outcomes:**
- Clear understanding of user pain points
- Feature prioritization based on requests
- Bug identification and tracking
- Product-market fit validation
- User satisfaction trends over time

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
