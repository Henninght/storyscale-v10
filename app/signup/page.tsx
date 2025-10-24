"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Chrome, Mail, Lock, User, ArrowRight, Linkedin } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

export default function SignupPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithLinkedIn, signUpWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithLinkedIn();
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with LinkedIn");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signUpWithEmail(email, password);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please sign in instead.");
      } else {
        setError(err.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-secondary">Check your email</h2>
          <p className="text-secondary/80">
            We've sent a verification link to <strong>{email}</strong>.
            Please verify your email to complete registration.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover"
          >
            Go to Login
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div>
            <Link href="/" className="text-3xl font-heading font-bold text-primary">
              Storyscale
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-secondary">
              Create your account
            </h2>
            <p className="mt-2 text-secondary/80">
              Start creating viral LinkedIn content today
            </p>
          </div>

          {/* OAuth Sign In Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-secondary/20 bg-white px-6 py-3 font-semibold text-secondary transition-all hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Chrome className="h-5 w-5" />
              Continue with Google
            </button>
            <button
              onClick={handleLinkedInSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-secondary/20 bg-white px-6 py-3 font-semibold text-secondary transition-all hover:border-[#0A66C2] hover:text-[#0A66C2] disabled:opacity-50"
            >
              <Linkedin className="h-5 w-5" />
              Continue with LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-secondary/60">Or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-secondary/20 bg-white py-3 pl-11 pr-4 text-secondary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-secondary/20 bg-white py-3 pl-11 pr-4 text-secondary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-secondary/60">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/40" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-secondary/20 bg-white py-3 pl-11 pr-4 text-secondary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-secondary/80">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Brand */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex h-full items-center justify-center p-12">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-secondary mb-6">
              Join thousands of creators
            </h2>
            <p className="text-lg text-secondary/80 mb-8">
              Use AI to generate authentic, engaging LinkedIn content that resonates with your audience and builds your professional brand.
            </p>
            <ul className="space-y-4 text-secondary/80">
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-primary/20 p-1">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>AI-powered content generation</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-primary/20 p-1">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Campaign planning and management</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-primary/20 p-1">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Version history and content refinement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
