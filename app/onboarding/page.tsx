"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ProfileData {
  background: string;
  expertise: string[];
  targetAudience: string;
  goals: string[];
  writingStyle: string;
  brandVoice: string;
}

const EXPERTISE_OPTIONS = [
  "Marketing",
  "Sales",
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Consulting",
  "Entrepreneurship",
  "Product Management",
  "Design",
  "HR & Recruiting",
  "Legal",
  "Real Estate",
  "Other",
];

const TARGET_AUDIENCES = [
  { value: "executives", label: "C-Suite Executives" },
  { value: "entrepreneurs", label: "Entrepreneurs & Founders" },
  { value: "professionals", label: "Industry Professionals" },
  { value: "managers", label: "Managers & Team Leaders" },
  { value: "specialists", label: "Technical Specialists" },
  { value: "consultants", label: "Consultants & Advisors" },
  { value: "job_seekers", label: "Job Seekers & Career Changers" },
  { value: "students", label: "Students & Recent Graduates" },
];

const GOALS = [
  { value: "thought_leadership", label: "Build thought leadership" },
  { value: "lead_generation", label: "Generate leads & customers" },
  { value: "brand_awareness", label: "Increase brand awareness" },
  { value: "network_growth", label: "Grow professional network" },
  { value: "job_opportunities", label: "Attract job opportunities" },
  { value: "share_knowledge", label: "Share knowledge & insights" },
  { value: "promote_business", label: "Promote products/services" },
  { value: "personal_brand", label: "Build personal brand" },
];

const WRITING_STYLES = [
  { value: "professional", label: "Professional & Formal" },
  { value: "casual", label: "Casual & Conversational" },
  { value: "inspirational", label: "Inspirational & Motivational" },
  { value: "educational", label: "Educational & Informative" },
  { value: "storytelling", label: "Story-Driven & Narrative" },
];

const BRAND_VOICES = [
  { value: "authoritative", label: "Authoritative & Expert" },
  { value: "friendly", label: "Friendly & Approachable" },
  { value: "bold", label: "Bold & Confident" },
  { value: "thoughtful", label: "Thoughtful & Reflective" },
  { value: "energetic", label: "Energetic & Enthusiastic" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const totalSteps = 6;

  const [profileData, setProfileData] = useState<ProfileData>({
    background: "",
    expertise: [],
    targetAudience: "",
    goals: [],
    writingStyle: "",
    brandVoice: "",
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!user) return;

    const autoSaveInterval = setInterval(async () => {
      if (profileData.background || profileData.expertise.length > 0) {
        setAutoSaving(true);
        try {
          const userRef = doc(db, "users", user.uid);
          await setDoc(
            userRef,
            {
              profile: profileData,
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setAutoSaving(false);
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [user, profileData]);

  // Load existing profile data if any
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().profile) {
          setProfileData(userDoc.data().profile);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleExpertiseToggle = (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(value)
        ? prev.expertise.filter((e) => e !== value)
        : [...prev.expertise, value],
    }));
  };

  const handleComplete = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          profile: profileData,
          subscription: {
            tier: "free",
            status: "active",
            stripeCustomerId: "",
            stripePriceId: "",
            currentPeriodEnd: null,
          },
          postsUsedThisMonth: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      router.push("/app");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleGoalsToggle = (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      goals: prev.goals.includes(value)
        ? prev.goals.filter((g) => g !== value)
        : [...prev.goals, value],
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileData.background.trim().length >= 20;
      case 2:
        return profileData.expertise.length > 0;
      case 3:
        return profileData.targetAudience !== "";
      case 4:
        return profileData.goals.length > 0;
      case 5:
        return profileData.writingStyle !== "";
      case 6:
        return profileData.brandVoice !== "";
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-outfit font-bold text-slate-900">
              Welcome to Storyscale
            </h1>
            <span className="text-sm text-slate-600">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          {autoSaving && (
            <p className="text-xs text-slate-500 mt-2">Auto-saving...</p>
          )}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold text-slate-900 mb-2">
                  Tell us about your professional background
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  This helps us understand your expertise and create content that
                  reflects your unique perspective.
                </p>
              </div>
              <div>
                <Label htmlFor="background">Professional Background</Label>
                <Textarea
                  id="background"
                  placeholder="e.g., I'm a digital marketing consultant with 8 years of experience helping B2B SaaS companies grow their online presence..."
                  value={profileData.background}
                  onChange={(e) =>
                    setProfileData({ ...profileData, background: e.target.value })
                  }
                  className="min-h-[150px]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {profileData.background.length} characters (minimum 20)
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold text-slate-900 mb-2">
                  What are your areas of expertise?
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  Select all that apply. This helps us tailor content topics to your
                  knowledge.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EXPERTISE_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={profileData.expertise.includes(option)}
                      onCheckedChange={() => handleExpertiseToggle(option)}
                    />
                    <label
                      htmlFor={option}
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Selected: {profileData.expertise.length}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold text-slate-900 mb-2">
                  Who is your target audience?
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  Choose who you want to reach with your LinkedIn content.
                </p>
              </div>
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={profileData.targetAudience}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, targetAudience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCES.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold text-slate-900 mb-2">
                  What are your goals for using Storyscale?
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  Select all that apply. This helps us create content aligned with your objectives.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {GOALS.map((goal) => (
                  <div key={goal.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal.value}
                      checked={profileData.goals.includes(goal.value)}
                      onCheckedChange={() => handleGoalsToggle(goal.value)}
                    />
                    <label
                      htmlFor={goal.value}
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      {goal.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Selected: {profileData.goals.length}
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold text-slate-900 mb-2">
                  What's your preferred writing style?
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  This determines the overall tone and structure of your posts.
                </p>
              </div>
              <div>
                <Label htmlFor="style">Writing Style</Label>
                <Select
                  value={profileData.writingStyle}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, writingStyle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a writing style" />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold text-slate-900 mb-2">
                  What best describes your brand voice?
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  This shapes the personality and character of your content.
                </p>
              </div>
              <div>
                <Label htmlFor="voice">Brand Voice</Label>
                <Select
                  value={profileData.brandVoice}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, brandVoice: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your brand voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAND_VOICES.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid() || saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
