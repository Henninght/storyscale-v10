import Link from "next/link";
import { Container } from "@/components/layout";
import { PricingCard } from "@/components/pricing/pricing-card";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
// import { TestimonialWidget } from "@/components/TestimonialWidget"; // Commented out until real testimonials are added

export default function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-background py-20 sm:py-32">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Animated Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>Transform Your LinkedIn Presence</span>
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-secondary sm:text-6xl md:text-7xl animate-fade-in-up">
              Create{" "}
              <span className="text-primary">Viral LinkedIn Content</span>{" "}
              with AI
            </h1>

            {/* Subheading */}
            <p className="mb-10 text-lg text-secondary/80 sm:text-xl animate-fade-in-up delay-100">
              Scale your professional stories and turn your expertise into engaging posts
              that resonate with your audience. Powered by Claude AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-secondary/20 bg-white px-8 py-3 text-base font-semibold text-secondary transition-all hover:border-primary hover:text-primary"
              >
                Sign In
              </Link>
            </div>

            {/* Metaphorical Animation - Scaling Text */}
            <div className="mt-16 relative h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-scale-up">
                  <div className="text-4xl font-bold text-primary/20">Your Story</div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center animation-delay-1000">
                <div className="animate-scale-up">
                  <div className="text-5xl font-bold text-primary/40">Amplified</div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center animation-delay-2000">
                <div className="animate-scale-up">
                  <div className="text-6xl font-bold text-primary">Viral</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
              Everything you need to scale your content
            </h2>
            <p className="mt-4 text-lg text-secondary/80">
              AI-powered features designed to help professionals create authentic,
              engaging LinkedIn posts
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative rounded-2xl border border-secondary/10 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-secondary">
                AI-Powered Generation
              </h3>
              <p className="text-secondary/80">
                Claude AI analyzes your profile and creates personalized content that
                sounds authentically you, not robotic or generic.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative rounded-2xl border border-secondary/10 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-secondary">
                Campaign Planning
              </h3>
              <p className="text-secondary/80">
                Plan and execute content campaigns with sequential posts that build on
                each other for maximum impact and consistency.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative rounded-2xl border border-secondary/10 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-secondary">
                Smart Refinement
              </h3>
              <p className="text-secondary/80">
                Iterate and enhance your content with AI-powered suggestions. Track
                version history and never lose a great idea.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section - Hidden until real testimonials are added */}
      {/* <section className="py-20 sm:py-32 bg-gradient-to-b from-white to-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
              Loved by professionals worldwide
            </h2>
            <p className="mt-4 text-lg text-secondary/80">
              Join thousands of content creators who trust Storyscale to amplify their LinkedIn presence
            </p>
          </div>

          <TestimonialWidget />
        </Container>
      </section> */}

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32 bg-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-secondary/80">
              Choose the plan that fits your content creation needs
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            <PricingCard
              name="Free"
              price={0}
              description="Perfect for getting started"
              features={[
                "5 AI-generated posts per month",
                "Basic post customization",
                "English and Norwegian support",
                "Draft management",
                "Version history",
              ]}
              ctaText="Start Free"
            />

            <PricingCard
              name="Pro"
              price={20}
              description="For active content creators"
              features={[
                "50 AI-generated posts per month",
                "Advanced post customization",
                "Campaign planning",
                "Sequential post generation",
                "Content enhancement",
                "Priority support",
              ]}
              highlighted={true}
              ctaText="Start Pro Trial"
            />

            <PricingCard
              name="Enterprise"
              price={40}
              description="For power users and teams"
              features={[
                "Unlimited AI-generated posts",
                "All Pro features included",
                "Campaign templates",
                "Advanced analytics",
                "Priority AI processing",
                "Dedicated support",
              ]}
              ctaText="Start Enterprise"
            />
          </div>
        </Container>
      </section>
    </main>
    </PageTransition>
  );
}
