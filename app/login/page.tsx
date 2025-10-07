"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Chrome, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      // Check if user needs onboarding
      const user = await import("firebase/auth").then(m => m.getAuth().currentUser);
      if (user) {
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Create new user document
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString(),
          });
          router.push("/onboarding");
        } else if (!userDoc.data()?.profile) {
          router.push("/onboarding");
        } else {
          router.push("/app");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signInWithEmail(email, password);
      // Check if user needs onboarding
      const user = await import("firebase/auth").then(m => m.getAuth().currentUser);
      if (user) {
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Create new user document
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString(),
          });
          router.push("/onboarding");
        } else if (!userDoc.data()?.profile) {
          router.push("/onboarding");
        } else {
          router.push("/app");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              Welcome back
            </h2>
            <p className="mt-2 text-secondary/80">
              Sign in to your account to continue
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
          <form onSubmit={handleEmailSignIn} className="space-y-6">
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-secondary/80">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary-hover">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Brand */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex h-full items-center justify-center p-12">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-secondary mb-6">
              Create content that scales
            </h2>
            <p className="text-lg text-secondary/80">
              Join professionals who are using AI to amplify their LinkedIn presence and reach more people with authentic stories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
