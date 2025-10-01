# Storyscale

> AI-powered SaaS platform to help professionals create viral LinkedIn content

## 🚀 Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Lucide Icons
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Anthropic Claude Sonnet 4.5
- **Payments**: Stripe
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase account
- Anthropic API account
- Stripe account

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Storyscale
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory and add the following:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Stripe Price IDs
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up Firebase

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Google OAuth and Email/Password)
4. Copy your Firebase config to `.env.local`
5. Generate a service account key for Firebase Admin SDK

### 5. Set up Anthropic API

1. Sign up at [Anthropic](https://www.anthropic.com/)
2. Generate an API key
3. Add it to `.env.local`

### 6. Set up Stripe

1. Create a Stripe account at [Stripe](https://stripe.com/)
2. Create three products with pricing:
   - Free: $0/month (handled in code)
   - Pro: $20/month
   - Enterprise: $40/month
3. Copy the price IDs and keys to `.env.local`

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
storyscale/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (landing)/         # Landing page
│   ├── app/               # Protected app routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── pricing/          # Pricing components
│   └── ui/               # Shadcn UI components
├── lib/                   # Utility functions
│   ├── firebase.ts       # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   ├── stripe.ts         # Stripe config
│   ├── anthropic.ts      # Anthropic config
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript types
│   └── index.ts          # Database types
├── public/               # Static files
├── .env.example          # Environment variables template
├── create-app.md         # Implementation plan
└── README.md             # This file
```

## 🎨 Design System

### Colors
- **Primary**: Orange (#F97316)
- **Secondary**: Slate Grey (#64748B)
- **Background**: Light Grey (#F8FAFC)
- **Card**: White (#FFFFFF)
- **Accent**: Amber (#F59E0B)

### Typography
- **Headings**: Outfit (600, 700)
- **Body**: Inter (400, 500, 600)

### Spacing
- 8px grid system
- Sidebar: 240px (desktop), collapsible on mobile
- Container: max-width 1280px

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🗄️ Database Schema

See `types/index.ts` for complete TypeScript definitions.

### Collections

- `/users/{uid}` - User profiles and subscription data
- `/drafts/{draftId}` - Draft posts
- `/drafts/{draftId}/versions/{versionId}` - Version history
- `/campaigns/{campaignId}` - Campaign data
- `/campaignTemplates/{templateId}` - Campaign templates

## 🚧 Development Status

**Phase 1: Foundation & Setup** ✅ Complete
- Next.js setup with TypeScript
- Tailwind CSS configuration
- Core dependencies installed
- Layout components created

**Phase 2: Landing Page** ✅ Complete
- Hero section with animations
- Feature highlights
- Pricing table

**Phase 3: Authentication** 🔄 In Progress

See `create-app.md` for detailed implementation plan.

## 📝 License

This project is proprietary software.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

**Built with ❤️ using Next.js and Claude AI**
