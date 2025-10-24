import Link from "next/link";
import { Container } from "@/components/layout";
import { ArrowRight, Lightbulb, Users, Target, FileText, TrendingUp, MessageCircle, Briefcase } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <Container>
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="text-2xl font-bold text-secondary">
              Storyscale
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-white px-6 py-2.5 font-semibold text-secondary shadow-sm transition-all hover:shadow-md hover:bg-gray-50 border border-secondary/10"
            >
              Log in
            </Link>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50/30 via-white to-orange-50/30 py-16 sm:py-24 pt-32 sm:pt-40">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-orange-200/20 blur-3xl"></div>
        </div>

        <Container>
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-secondary sm:text-6xl lg:text-7xl">
              Scale Your Stories.{' '}
              <span className="text-gradient-brand">Amplify Your Impact.</span>
            </h1>

            <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-secondary/80 sm:text-2xl">
              You have expertise worth sharing. StoryScale helps you turn that knowledge into consistent LinkedIn content—without the time drain or writer's block.
            </p>

            <p className="mb-10 text-lg text-secondary/70 font-medium">
              For professionals, entrepreneurs, and personal brands ready to be seen.
            </p>

            {/* CTA Button */}
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-10 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600"
            >
              Start Your 7-Day Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>

            <p className="mt-4 text-sm text-secondary/60">
              No credit card required • Full access • Cancel anytime
            </p>
          </div>
        </Container>
      </section>

      {/* Why This Matters Section */}
      <section className="py-20 sm:py-32 bg-white">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-secondary sm:text-5xl">
              Why This Matters
            </h2>

            <div className="space-y-6 text-lg leading-relaxed text-secondary/80">
              <p className="text-xl font-semibold text-secondary">
                LinkedIn is where your future clients, partners, and opportunities are looking for someone exactly like you.
              </p>

              <p>
                But showing up consistently? That's the hard part.
              </p>

              <p>
                You want to share your insights, tell your story, build your reputation—but between running your business, doing the work, and living your life, content creation keeps falling to the bottom of the list.
              </p>

              <p className="text-xl font-semibold text-gradient-brand">
                StoryScale makes it simple.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-purple-50/30 to-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-secondary sm:text-5xl mb-4">
              How It Works
            </h2>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-200 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                <div className="relative bg-white rounded-2xl border border-purple-200 p-8 h-full">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary">Share What You Know</h3>
                  </div>
                  <p className="text-secondary/80 leading-relaxed">
                    That client breakthrough. The lesson you learned the hard way. Your perspective on industry trends. Start with what's already in your head.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-pink-200 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                <div className="relative bg-white rounded-2xl border border-pink-200 p-8 h-full">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                      <MessageCircle className="h-5 w-5 text-pink-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary">Get Posts That Sound Like You</h3>
                  </div>
                  <p className="text-secondary/80 leading-relaxed">
                    StoryScale writes in your voice—professional, casual, story-driven, whatever fits. You refine until it feels right. Every draft is saved.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-200 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                <div className="relative bg-white rounded-2xl border border-orange-200 p-8 h-full">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary">Build Content That Connects</h3>
                  </div>
                  <p className="text-secondary/80 leading-relaxed">
                    Create single posts or plan content series that unfold over time. Share your methodology across multiple posts. Tell your founder story in chapters. Build narratives that keep people coming back.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-200 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                <div className="relative bg-white rounded-2xl border border-blue-200 p-8 h-full">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary">Stay Consistent Without the Stress</h3>
                  </div>
                  <p className="text-secondary/80 leading-relaxed">
                    Track what you've created, what's ready to go, where you are with your content. No more "what should I post?" panic on Sunday night.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Who This Is For Section */}
      <section className="py-20 sm:py-32 bg-white">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-4xl font-bold tracking-tight text-secondary sm:text-5xl text-center">
              Who This Is For
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Audience 1 */}
              <div className="flex gap-4 rounded-2xl border border-purple-200 bg-purple-50/30 p-6 transition-all hover:shadow-lg hover:border-purple-300">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-secondary">
                    Professionals building personal brands
                  </h3>
                  <p className="text-secondary/70">
                    Expanding their network and establishing expertise
                  </p>
                </div>
              </div>

              {/* Audience 2 */}
              <div className="flex gap-4 rounded-2xl border border-pink-200 bg-pink-50/30 p-6 transition-all hover:shadow-lg hover:border-pink-300">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                    <Lightbulb className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-secondary">
                    Entrepreneurs sharing their journey
                  </h3>
                  <p className="text-secondary/70">
                    Attracting customers through visibility and authentic storytelling
                  </p>
                </div>
              </div>

              {/* Audience 3 */}
              <div className="flex gap-4 rounded-2xl border border-orange-200 bg-orange-50/30 p-6 transition-all hover:shadow-lg hover:border-orange-300">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-secondary">
                    Consultants and freelancers
                  </h3>
                  <p className="text-secondary/70">
                    Demonstrating expertise to generate inbound interest
                  </p>
                </div>
              </div>

              {/* Audience 4 */}
              <div className="flex gap-4 rounded-2xl border border-blue-200 bg-blue-50/30 p-6 transition-all hover:shadow-lg hover:border-blue-300">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-secondary">
                    Small business owners
                  </h3>
                  <p className="text-secondary/70">
                    Establishing credibility in their market
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 rounded-2xl border-2 border-gradient-brand bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-orange-50/50 p-8 text-center">
              <p className="text-xl font-semibold text-secondary">
                Anyone with valuable experience who wants to stop keeping it to themselves
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* What You Get Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-purple-50/20 to-white">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-4xl font-bold tracking-tight text-secondary sm:text-5xl text-center">
              What You Get
            </h2>

            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="flex gap-4 rounded-2xl border border-secondary/10 bg-white p-6 transition-all hover:shadow-md hover:border-purple-200">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-secondary/80">
                  Posts that match your voice and style, not generic robot content
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 rounded-2xl border border-secondary/10 bg-white p-6 transition-all hover:shadow-md hover:border-pink-200">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-6 w-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-secondary/80">
                  Content planning tools to think bigger than one-off posts
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 rounded-2xl border border-secondary/10 bg-white p-6 transition-all hover:shadow-md hover:border-orange-200">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-secondary/80">
                  Draft management so you never lose a good idea
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-4 rounded-2xl border border-secondary/10 bg-white p-6 transition-all hover:shadow-md hover:border-blue-200">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-secondary/80">
                  Support for English and Norwegian
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex gap-4 rounded-2xl border border-secondary/10 bg-white p-6 transition-all hover:shadow-md hover:border-purple-200">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-secondary/80">
                  A workspace built for people who create content, not content creators
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Try it free for 7 days. No credit card.
            </h2>
            <p className="mb-10 text-xl text-white/90">
              See what becomes possible when creating content doesn't feel like a chore.
            </p>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 text-lg font-semibold text-purple-600 shadow-xl transition-all hover:shadow-2xl hover:scale-105 hover:bg-gray-50"
            >
              Start Your 7-Day Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>

            <p className="mt-6 text-white/80">
              Join professionals who are scaling their stories and amplifying their impact
            </p>
          </div>
        </Container>
      </section>
    </main>
    </PageTransition>
  );
}
