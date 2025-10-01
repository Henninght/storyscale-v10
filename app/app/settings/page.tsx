"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
import { Settings, Save } from "lucide-react";

interface ProfileData {
  background: string;
  expertise: string[];
  targetAudience: string;
  goals: string | string[];
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

const WRITING_STYLES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Conversational" },
  { value: "inspirational", label: "Inspirational" },
  { value: "educational", label: "Educational" },
  { value: "storytelling", label: "Story-Driven" },
];

const BRAND_VOICES = [
  { value: "authoritative", label: "Authoritative & Expert" },
  { value: "friendly", label: "Friendly & Approachable" },
  { value: "bold", label: "Bold & Confident" },
  { value: "thoughtful", label: "Thoughtful & Reflective" },
  { value: "energetic", label: "Energetic & Enthusiastic" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    background: "",
    expertise: [],
    targetAudience: "",
    goals: "",
    writingStyle: "",
    brandVoice: "",
  });

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
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleExpertiseToggle = (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(value)
        ? prev.expertise.filter((e) => e !== value)
        : [...prev.expertise, value],
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Settings</h1>
          <p className="mt-2 text-secondary/80">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Settings</h1>
          <p className="mt-2 text-secondary/80">
            Manage your profile and content preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Account Information */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary">
            Account Information
          </h2>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/onboarding"}
            size="sm"
          >
            Re-run Onboarding
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-slate-50" />
          </div>
          <div>
            <Label>Display Name</Label>
            <Input
              value={user?.displayName || ""}
              disabled
              className="bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <h2 className="text-xl font-semibold text-secondary mb-6">
          Content Profile
        </h2>
        <div className="space-y-6">
          {/* Professional Background */}
          <div>
            <Label htmlFor="background">Professional Background</Label>
            <Textarea
              id="background"
              placeholder="Tell us about your professional experience..."
              value={profileData.background}
              onChange={(e) =>
                setProfileData({ ...profileData, background: e.target.value })
              }
              className="min-h-[120px]"
            />
            <p className="text-xs text-slate-500 mt-1">
              {profileData.background.length} characters
            </p>
          </div>

          {/* Areas of Expertise */}
          <div>
            <Label>Areas of Expertise</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {EXPERTISE_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`settings-${option}`}
                    checked={profileData.expertise.includes(option)}
                    onCheckedChange={() => handleExpertiseToggle(option)}
                  />
                  <label
                    htmlFor={`settings-${option}`}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Selected: {profileData.expertise.length}
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Textarea
              id="audience"
              placeholder="Describe who you want to reach with your content..."
              value={profileData.targetAudience}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  targetAudience: e.target.value,
                })
              }
              className="min-h-[100px]"
            />
            <p className="text-xs text-slate-500 mt-1">
              {profileData.targetAudience.length} characters
            </p>
          </div>

          {/* Goals */}
          <div>
            <Label htmlFor="goals">Your Goals</Label>
            <Textarea
              id="goals"
              placeholder="What do you want to achieve with your LinkedIn content..."
              value={profileData.goals}
              onChange={(e) =>
                setProfileData({ ...profileData, goals: e.target.value })
              }
              className="min-h-[100px]"
            />
            <p className="text-xs text-slate-500 mt-1">
              {profileData.goals.length} characters
            </p>
          </div>

          {/* Writing Style */}
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

          {/* Brand Voice */}
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
      </div>

      {/* Billing Link */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <h2 className="text-xl font-semibold text-secondary mb-4">
          Subscription & Billing
        </h2>
        <p className="text-secondary/80 mb-4">
          Manage your subscription plan and billing information.
        </p>
        <Button variant="outline" onClick={() => window.location.href = "/app/billing"}>
          Go to Billing
        </Button>
      </div>
    </div>
  );
}
