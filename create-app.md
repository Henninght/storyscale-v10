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

### 6.2 Enhance Functionality ⏳
- ⚪ Create `/api/enhance` route
- ⚪ Send current content to Claude with improvement prompt
- ⚪ Maintain user's original settings and context
- ⚪ Update editor with enhanced content
- ⚪ Create new version entry

### 6.3 Regenerate Functionality ✅
- ✅ Load original wizard settings
- ✅ Call generate API with same parameters
- ✅ Replace content in editor
- ⚪ Create new version entry

### 6.4 Version Management ⚪
- ⚪ Version history sidebar component
- ⚪ Create `/drafts/{draftId}/versions` subcollection on save
- ⚪ Display version list with timestamps
- ⚪ Load previous version functionality
- ⚪ Track which version is current
- ⚪ Diff view (optional enhancement)

### 6.5 Draft Metadata ✅
- ✅ Status dropdown component:
  - ✅ Idea, In Progress, Ready to Post, Posted, Archived
- ✅ Tag input with autocomplete
- ⚪ Scheduled date picker
- ✅ Manual save functionality
- ✅ Update Firestore document

---

## Phase 7: Draft Management

### 7.1 All Drafts Page ⚪
- ⚪ Create drafts list layout
- ⚪ Search functionality (title/content)
- ⚪ Filter controls:
  - ⚪ Status filter
  - ⚪ Language filter
  - ⚪ Tag filter
- ⚪ Sort controls:
  - ⚪ Date created
  - ⚪ Last modified
  - ⚪ Status
- ⚪ Grid/list view toggle
- ⚪ Bulk selection checkboxes
- ⚪ Bulk action buttons (status change, tag, delete)
- ⚪ Pagination or infinite scroll
- ⚪ Empty state component

### 7.2 Calendar View ⚪
- ⚪ Create monthly calendar component
- ⚪ Fetch drafts with scheduled dates
- ⚪ Display draft indicators on dates
- ⚪ Color-code indicators by status
- ⚪ Day detail modal/popover
- ⚪ Show all drafts for selected date
- ⚪ Navigate to draft editor from calendar
- ⚪ Optional: Drag-and-drop reschedule

---

## Phase 8: Campaign Planning

### 8.1 Campaign Creation ⚪
- ⚪ Create campaign modal/page
- ⚪ Campaign form fields:
  - ⚪ Name input
  - ⚪ Theme and description textarea
  - ⚪ Language selection (EN/NO)
  - ⚪ Start and end date pickers
  - ⚪ Posting frequency dropdown (Daily, 3x/week, Weekly)
  - ⚪ Target number of posts input
  - ⚪ Content style dropdown
  - ⚪ Optional template selection
- ⚪ Enforce one active campaign limit
- ⚪ Generate first post immediately on creation
- ⚪ Store campaign in Firestore `/campaigns/{campaignId}`

### 8.2 Campaign Detail Page ⚪
- ⚪ Campaign header with name and description
- ⚪ Progress bar (posts completed/target)
- ⚪ Timeline component showing all posts
- ⚪ Status indicators for each post
- ⚪ Scheduled dates (calculated from frequency)
- ⚪ "Generate Next Post" button:
  - ⚪ Show only after previous post marked Posted/Ready
  - ⚪ Include campaign context in generation
  - ⚪ Pass previous post content for continuity
  - ⚪ Display post number (e.g., "Post 3 of 10")
- ⚪ Edit campaign settings button
- ⚪ Complete/archive campaign action

### 8.3 Campaign Templates ⚪
- ⚪ Create `/campaignTemplates` collection in Firestore
- ⚪ Seed templates:
  - ⚪ Product Launch
  - ⚪ Thought Leadership Series
  - ⚪ Educational Series
  - ⚪ Company Updates
- ⚪ Template selection UI in campaign creation
- ⚪ Pre-populate campaign settings from template
- ⚪ Template preview component

### 8.4 Sequential Post Generation ⚪
- ⚪ Update generate API to handle campaign context
- ⚪ Pass campaign theme to Claude
- ⚪ Include previous post content
- ⚪ Add post sequence number (e.g., "This is post 3 of 10")
- ⚪ Maintain continuity in tone and messaging
- ⚪ Link generated draft to campaign

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

### 10.1 Welcome/Onboarding Wizard Visual Upgrade ⚪
- ⚪ Add gradient backgrounds and visual hierarchy
  - ⚪ Implement subtle gradient overlays on wizard steps
  - ⚪ Add visual progress animations (step completion effects)
  - ⚪ Create modern card shadows with soft depth
  - ⚪ Add smooth transitions between steps (slide/fade effects)
- ⚪ Enhance typography and spacing
  - ⚪ Implement better heading hierarchy (larger, bolder step titles)
  - ⚪ Add descriptive subtitles with improved color contrast
  - ⚪ Increase whitespace for breathing room
  - ⚪ Add decorative icons for each step
- ⚪ Add micro-interactions and feedback
  - ⚪ Checkbox/radio button animations (checkmark animation, ripple effect)
  - ⚪ Input field focus animations (border glow, label lift)
  - ⚪ Button hover effects (lift, color shift, shadow expansion)
  - ⚪ Progress bar pulse animation on step completion
- ⚪ Implement contextual illustrations
  - ⚪ Add welcome hero illustration/icon
  - ⚪ Step-specific decorative graphics
  - ⚪ Success celebration animation on completion
  - ⚪ Background patterns or shapes for visual interest

### 10.2 Draft Creation Wizard Visual Upgrade ⚪
- ⚪ Enhanced step indicators
  - ⚪ Animated progress ring/circle design
  - ⚪ Step icons with state changes (pending, active, completed)
  - ⚪ Smooth color transitions between steps
  - ⚪ Add step preview breadcrumbs
- ⚪ Step 1 (Input) improvements
  - ⚪ Character counter with visual feedback (color changes at milestones)
  - ⚪ Animated placeholder text rotation
  - ⚪ Textarea auto-expand with smooth animation
  - ⚪ URL input with validation icons (checkmark/error)
  - ⚪ Add example snippets as quick-fill options
- ⚪ Step 2 (Configuration) improvements
  - ⚪ Replace dropdowns with modern card-based selectors
  - ⚪ Add visual icons for each option
  - ⚪ Implement hover preview cards with descriptions
  - ⚪ Active state with accent border and background tint
  - ⚪ Smooth scale/elevation on hover
- ⚪ Step 3 (Preferences) improvements
  - ⚪ Toggle switches with smooth animations
  - ⚪ Visual length indicators (word count visualization)
  - ⚪ Language selector with flag icons
  - ⚪ CTA toggle with preview example
  - ⚪ Emoji usage slider with live preview
- ⚪ Step 4 (Review) improvements
  - ⚪ Summary cards with collapsible sections
  - ⚪ Edit quick-links with smooth scroll back
  - ⚪ Credit usage visualization (progress bar/gauge)
  - ⚪ Generate button with loading animation
  - ⚪ Success confetti/celebration animation

### 10.3 Interactive Tooltips & Descriptions ⚪
- ⚪ Implement tooltip system
  - ⚪ Add @radix-ui/react-tooltip or similar library
  - ⚪ Create reusable Tooltip component
  - ⚪ Design consistent tooltip styling (dark theme with arrow)
  - ⚪ Add smooth fade-in animations (200-300ms delay)
- ⚪ Tone option tooltips
  - ⚪ **Professional**: "Formal, polished language that establishes credibility. Best for corporate audiences, thought leadership, and executive networking. Uses industry terminology appropriately."
  - ⚪ **Casual**: "Conversational and approachable tone. Perfect for building authentic connections, sharing personal stories, and engaging with peers. Uses everyday language."
  - ⚪ **Inspirational**: "Motivating and uplifting language that energizes readers. Great for sharing success stories, lessons learned, and encouraging action. Focuses on possibility and growth."
  - ⚪ **Educational**: "Clear, informative tone focused on teaching. Ideal for how-to content, industry insights, and knowledge sharing. Breaks down complex topics simply."
- ⚪ Purpose option tooltips
  - ⚪ **Engagement**: "Designed to spark conversations and comments. Uses questions, relatable stories, and interactive elements to encourage audience participation."
  - ⚪ **Lead Generation**: "Strategically drives reader action toward your services. Includes subtle CTAs, value demonstrations, and problem-solution framing."
  - ⚪ **Brand Awareness**: "Increases visibility and recognition of your expertise. Focuses on memorable content, consistent messaging, and shareability."
  - ⚪ **Thought Leadership**: "Establishes you as an industry authority. Shares unique insights, forward-thinking perspectives, and expert analysis."
- ⚪ Audience option tooltips
  - ⚪ **Executives**: "C-suite and senior decision-makers. Content emphasizes strategic value, ROI, and high-level insights. Respects their time with concise, impactful messaging."
  - ⚪ **Entrepreneurs**: "Business owners and startup founders. Focuses on growth strategies, practical advice, and real-world challenges. Action-oriented and results-focused."
  - ⚪ **Professionals**: "Individual contributors and specialists in their fields. Balances tactical tips with career development insights. Peer-to-peer conversational tone."
  - ⚪ **Industry-Specific**: "Tailored to your niche audience. Uses industry terminology, references sector trends, and addresses specialized challenges."
- ⚪ Style option tooltips
  - ⚪ **Story-Based**: "Narrative structure with beginning, middle, and end. Highly engaging and memorable. Perfect for sharing experiences, case studies, and lessons learned."
  - ⚪ **List Format**: "Organized bullet points or numbered lists. Easy to scan and digest. Great for tips, frameworks, and step-by-step processes."
  - ⚪ **Question-Based**: "Opens with a thought-provoking question. Drives curiosity and engagement. Ideal for sparking discussions and challenging assumptions."
  - ⚪ **How-To**: "Educational, instructional format. Walks readers through a process or solution. Provides actionable, practical value."
- ⚪ Length option tooltips
  - ⚪ **Short (50-150 words)**: "Quick, punchy posts that grab attention fast. Perfect for single insights, quotes, or quick updates. High engagement rate, easy to consume."
  - ⚪ **Medium (150-300 words)**: "Balanced length for most content types. Enough space to develop an idea without losing attention. Optimal for LinkedIn algorithm."
  - ⚪ **Long (300-500 words)**: "In-depth explorations of complex topics. Best for thought leadership, detailed case studies, and comprehensive guides. Demonstrates expertise."
- ⚪ Additional setting tooltips
  - ⚪ **Include CTA**: "Adds a call-to-action encouraging readers to engage. Can be a question, invitation to comment, or request to share. Increases post interaction by 30-50%."
  - ⚪ **Emoji Usage**:
    - "None - Professional, text-only approach"
    - "Minimal - 1-2 strategic emojis for visual breaks"
    - "Moderate - 3-5 emojis to add personality and improve scannability"

### 10.4 Visual Design System Enhancements ⚪
- ⚪ Color palette expansion
  - ⚪ Add success/warning/error semantic colors
  - ⚪ Create light/dark variants for all colors
  - ⚪ Define gradient combinations for accents
  - ⚪ Add subtle background patterns
- ⚪ Typography improvements
  - ⚪ Define complete type scale (12px - 48px)
  - ⚪ Add font weight variations (300, 400, 500, 600, 700)
  - ⚪ Set line-height and letter-spacing standards
  - ⚪ Create heading/body text pairings
- ⚪ Spacing system refinement
  - ⚪ Document 8px grid usage patterns
  - ⚪ Define component spacing constants
  - ⚪ Create margin/padding utility classes
  - ⚪ Establish container max-widths
- ⚪ Shadow and elevation system
  - ⚪ Define 5 elevation levels (sm, md, lg, xl, 2xl)
  - ⚪ Create hover state shadows
  - ⚪ Add focus ring styles
  - ⚪ Implement subtle inner shadows for depth

### 10.5 Animation & Transition Library ⚪
- ⚪ Page transitions
  - ⚪ Fade-in on route change
  - ⚪ Slide transitions for wizard steps
  - ⚪ Scale animations for modals
- ⚪ Component animations
  - ⚪ Card hover lift effect (translateY + shadow)
  - ⚪ Button press animation (scale down)
  - ⚪ Loading spinner variations
  - ⚪ Skeleton screen placeholders
- ⚪ Feedback animations
  - ⚪ Success checkmark animation
  - ⚪ Error shake animation
  - ⚪ Copy-to-clipboard confirmation
  - ⚪ Save indicator pulse
- ⚪ Decorative animations
  - ⚪ Background gradient shifts
  - ⚪ Floating particles/shapes
  - ⚪ Progress bar fills
  - ⚪ Confetti on milestone completion

### 10.6 Accessibility & Polish ⚪
- ⚪ ARIA labels and roles
  - ⚪ Add proper labels to all interactive elements
  - ⚪ Implement focus management for wizards
  - ⚪ Add screen reader announcements
- ⚪ Keyboard navigation
  - ⚪ Tab order optimization
  - ⚪ Enter/Space key support for custom controls
  - ⚪ Escape key to close modals/tooltips
- ⚪ Color contrast compliance
  - ⚪ Verify WCAG AA compliance for all text
  - ⚪ Add high-contrast mode support
  - ⚪ Test with color blindness simulators
- ⚪ Responsive refinements
  - ⚪ Mobile-optimized touch targets (min 44px)
  - ⚪ Tablet layout adjustments
  - ⚪ Desktop large-screen optimizations

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

### 10.2 Performance Optimization ⚪
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

### 10.3 Testing & Quality Assurance ⚪
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

### 10.4 Deployment ⚪
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
  templateId: string | null
  status: 'active' | 'completed' | 'archived'
  postsGenerated: number
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
9. **Phase 9** - Billing & Subscriptions *(Monetization)*
10. **Phase 10** - Security & Optimization *(Polish & launch)*

---

## 📝 Notes

- **Human-Sounding Content**: Claude system prompts must emphasize authenticity, avoiding corporate jargon and AI clichés
- **Bilingual Support**: UI in English, generated content in English or Norwegian based on user selection
- **Mobile-First**: Sidebar collapses to icon-only on mobile devices
- **Auto-Save**: Implement throughout (wizard, editor) to prevent data loss
- **Error Handling**: Graceful degradation with user-friendly messages
- **Rate Limiting**: Protect generate API from abuse
- **Version Control**: Track all content iterations for user reference

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
4. **Phase 9:** Stripe billing integration for monetization
5. **Phase 10:** Security hardening & performance optimization
