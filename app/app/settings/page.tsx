"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile, deleteUser, linkWithPopup, unlink, GoogleAuthProvider } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings, Save, User, Building2, Check, Lock, Upload, Trash2,
  AlertTriangle, Download, Chrome, Link2, Unlink, Sparkles, Bell,
  Palette, Sliders, Moon, Sun, Monitor, ChevronDown, ChevronUp,
  Mail, Calendar, BarChart, Shield, Info
} from "lucide-react";
import { MentorshipTemperatureSlider } from "@/components/MentorshipTemperatureSlider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AccountType } from "@/types";

interface ProfileData {
  language: string;
  accountType: AccountType;
  background: string;
  expertise: string[];
  targetAudience: string;
  goals: string[];
  writingStyle: string;
  brandVoice: string;
  companyName?: string;
  companyIndustry?: string;
  mentorshipSettings?: {
    enabled: boolean;
    temperature: number;
    customInstructions: string;
    snoozedUntil?: any;
  };
  notificationSettings?: {
    draftReminders: boolean;
    weeklyDigest: boolean;
    mentorshipAlerts: boolean;
    campaignCompletion: boolean;
    monthlyAnalytics: boolean;
  };
  appearanceSettings?: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact';
  };
  advancedSettings?: {
    timezone: string;
    linkedInUrl: string;
    defaultPostLength: 'short' | 'medium' | 'long';
  };
}

const EXPERTISE_OPTIONS = [
  "Marketing", "Sales", "Technology", "Finance", "Healthcare",
  "Education", "Consulting", "Entrepreneurship", "Product Management",
  "Design", "HR & Recruiting", "Legal", "Real Estate", "Other",
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

const LANGUAGES = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "no", label: "Norsk", flag: "🇳🇴" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Oslo", label: "Oslo (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    language: "en",
    accountType: "private",
    background: "",
    expertise: [],
    targetAudience: "",
    goals: [],
    writingStyle: "",
    brandVoice: "",
    companyName: "",
    companyIndustry: "",
    mentorshipSettings: {
      enabled: false,
      temperature: 3,
      customInstructions: "",
      snoozedUntil: undefined,
    },
    notificationSettings: {
      draftReminders: true,
      weeklyDigest: true,
      mentorshipAlerts: true,
      campaignCompletion: true,
      monthlyAnalytics: false,
    },
    appearanceSettings: {
      theme: 'system',
      density: 'comfortable',
    },
    advancedSettings: {
      timezone: 'America/New_York',
      linkedInUrl: '',
      defaultPostLength: 'medium',
    },
  });

  const [initialData, setInitialData] = useState<ProfileData | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Profile photo state
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // Save error state
  const [saveError, setSaveError] = useState("");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Data export state
  const [exporting, setExporting] = useState(false);

  // Provider management state
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  // Mentorship management state
  const [snoozingMentorship, setSnoozingMentorship] = useState(false);
  const [clearingDismissed, setClearingDismissed] = useState(false);

  // Collapsible sections state
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [isDeleteSectionOpen, setIsDeleteSectionOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userDoc.exists() && userData?.profile) {
          const loadedProfile = {
            language: userData.profile.language || "en",
            accountType: userData.profile.accountType || "private",
            background: userData.profile.background || "",
            expertise: userData.profile.expertise || [],
            targetAudience: userData.profile.targetAudience || "",
            goals: Array.isArray(userData.profile.goals) ? userData.profile.goals : [],
            writingStyle: userData.profile.writingStyle || "",
            brandVoice: userData.profile.brandVoice || "",
            companyName: userData.profile.companyName || "",
            companyIndustry: userData.profile.companyIndustry || "",
            mentorshipSettings: {
              enabled: userData.profile.mentorshipSettings?.enabled || false,
              temperature: userData.profile.mentorshipSettings?.temperature || 3,
              customInstructions: userData.profile.mentorshipSettings?.customInstructions || "",
              snoozedUntil: userData.profile.mentorshipSettings?.snoozedUntil,
            },
            notificationSettings: {
              draftReminders: userData.profile.notificationSettings?.draftReminders ?? true,
              weeklyDigest: userData.profile.notificationSettings?.weeklyDigest ?? true,
              mentorshipAlerts: userData.profile.notificationSettings?.mentorshipAlerts ?? true,
              campaignCompletion: userData.profile.notificationSettings?.campaignCompletion ?? true,
              monthlyAnalytics: userData.profile.notificationSettings?.monthlyAnalytics ?? false,
            },
            appearanceSettings: {
              theme: userData.profile.appearanceSettings?.theme || 'system',
              density: userData.profile.appearanceSettings?.density || 'comfortable',
            },
            advancedSettings: {
              timezone: userData.profile.advancedSettings?.timezone || 'America/New_York',
              linkedInUrl: userData.profile.advancedSettings?.linkedInUrl || '',
              defaultPostLength: userData.profile.advancedSettings?.defaultPostLength || 'medium',
            },
          };
          setProfileData(loadedProfile);
          setInitialData(loadedProfile);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const providers = user.providerData.map(provider => provider.providerId);
    setLinkedProviders(providers);

    loadProfile();
  }, [user]);

  // Check for unsaved changes
  useEffect(() => {
    if (!initialData) return;
    const hasChanges = JSON.stringify(profileData) !== JSON.stringify(initialData);
    setHasUnsavedChanges(hasChanges);
  }, [profileData, initialData]);

  const handleExpertiseToggle = (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(value)
        ? prev.expertise.filter((e) => e !== value)
        : [...prev.expertise, value],
    }));
  };

  const handleGoalsToggle = (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      goals: prev.goals.includes(value)
        ? prev.goals.filter((g) => g !== value)
        : [...prev.goals, value],
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const userRef = doc(db, "users", user.uid);

      // Clean up undefined values (Firestore doesn't support undefined)
      const cleanProfileData = JSON.parse(JSON.stringify(profileData, (key, value) => {
        return value === undefined ? null : value;
      }));

      // Remove null snoozedUntil if it exists
      if (cleanProfileData.mentorshipSettings?.snoozedUntil === null) {
        delete cleanProfileData.mentorshipSettings.snoozedUntil;
      }

      await setDoc(
        userRef,
        {
          profile: cleanProfileData,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setSaved(true);
      setInitialData(profileData);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      console.error("Error details:", error.message, error.code);

      // Set user-friendly error message
      let errorMessage = "Unable to save your settings. ";
      if (error.code === 'permission-denied') {
        errorMessage += "You don't have permission to update your profile. Please try logging out and back in.";
      } else if (error.code === 'unavailable') {
        errorMessage += "Connection to the server failed. Please check your internet connection.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again.";
      }

      setSaveError(errorMessage);
      setTimeout(() => setSaveError(""), 8000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !user.email) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordChanging(true);
    setPasswordChanged(false);
    setPasswordError("");

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordChanged(false), 5000);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError("Please sign out and sign in again before changing your password");
      } else {
        setPasswordError(error.message || "Failed to change password");
      }
    } finally {
      setPasswordChanging(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be less than 5MB");
      return;
    }

    setPhotoUploading(true);
    setPhotoError("");

    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { photoURL }, { merge: true });
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to upload photo:", error);
      setPhotoError(error.message || "Failed to upload photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);

    try {
      const draftsQuery = query(collection(db, "drafts"), where("userId", "==", user.uid));
      const draftsSnapshot = await getDocs(draftsQuery);
      const draftDeletes = draftsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(draftDeletes);

      const campaignsQuery = query(collection(db, "campaigns"), where("userId", "==", user.uid));
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaignDeletes = campaignsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(campaignDeletes);

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      router.push("/");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      if (error.code === "auth/requires-recent-login") {
        alert("For security reasons, please sign out and sign in again before deleting your account.");
      } else {
        alert(error.message || "Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setExporting(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      const draftsQuery = query(collection(db, "drafts"), where("userId", "==", user.uid));
      const draftsSnapshot = await getDocs(draftsQuery);
      const drafts = draftsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const campaignsQuery = query(collection(db, "campaigns"), where("userId", "==", user.uid));
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaigns = campaignsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const exportData = {
        exportDate: new Date().toISOString(),
        account: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        profile: userData?.profile || {},
        subscription: userData?.subscription || {},
        drafts: drafts,
        campaigns: campaigns,
        metadata: {
          totalDrafts: drafts.length,
          totalCampaigns: campaigns.length,
          postsUsedThisMonth: userData?.postsUsedThisMonth || 0,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `storyscale-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export data:", error);
      alert(error.message || "Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleLinkProvider = async (providerId: 'google.com') => {
    if (!user) return;

    setLinkingProvider(providerId);

    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      const providers = user.providerData.map(p => p.providerId);
      setLinkedProviders(providers);
    } catch (error: any) {
      console.error("Failed to link provider:", error);
      if (error.code === "auth/credential-already-in-use") {
        alert("This account is already linked to another user.");
      } else if (error.code === "auth/provider-already-linked") {
        alert("This provider is already linked to your account.");
      } else {
        alert(error.message || "Failed to link account. Please try again.");
      }
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    if (!user) return;

    if (linkedProviders.length <= 1) {
      alert("You must have at least one sign-in method linked to your account.");
      return;
    }

    if (!confirm(`Are you sure you want to unlink this account?`)) {
      return;
    }

    setLinkingProvider(providerId);

    try {
      await unlink(user, providerId);
      const providers = user.providerData.map(p => p.providerId);
      setLinkedProviders(providers);
    } catch (error: any) {
      console.error("Failed to unlink provider:", error);
      alert(error.message || "Failed to unlink account. Please try again.");
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleSnoozeMentorship = async () => {
    if (!user) return;

    setSnoozingMentorship(true);

    try {
      const snoozedUntil = new Date();
      snoozedUntil.setHours(snoozedUntil.getHours() + 24);

      setProfileData(prev => ({
        ...prev,
        mentorshipSettings: {
          ...prev.mentorshipSettings!,
          snoozedUntil: snoozedUntil,
        }
      }));

      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          profile: {
            mentorshipSettings: {
              ...profileData.mentorshipSettings,
              snoozedUntil: snoozedUntil,
            }
          },
          updatedAt: new Date(),
        },
        { merge: true }
      );

      alert("All suggestions snoozed for 24 hours");
    } catch (error: any) {
      console.error("Failed to snooze mentorship:", error);
      alert(error.message || "Failed to snooze suggestions. Please try again.");
    } finally {
      setSnoozingMentorship(false);
    }
  };

  const handleClearDismissed = async () => {
    if (!user) return;

    if (!confirm("This will show all previously dismissed suggestions again. Continue?")) {
      return;
    }

    setClearingDismissed(true);

    try {
      alert("All dismissed suggestions have been cleared");
    } catch (error: any) {
      console.error("Failed to clear dismissed suggestions:", error);
      alert(error.message || "Failed to clear dismissed suggestions. Please try again.");
    } finally {
      setClearingDismissed(false);
    }
  };

  const handleResetMentorship = () => {
    if (!confirm("Reset mentorship settings to defaults?")) {
      return;
    }

    setProfileData(prev => ({
      ...prev,
      mentorshipSettings: {
        enabled: false,
        temperature: 3,
        customInstructions: "",
        snoozedUntil: undefined,
      }
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-700">Settings</h1>
          <p className="mt-2 text-slate-700/80">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-700">Settings</h1>
            <p className="mt-1 text-sm text-slate-700/80">
              Manage your profile, preferences, and account settings
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {saveError && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-red-900 text-sm mb-1">Failed to Save</div>
                <div className="text-sm text-red-800">{saveError}</div>
              </div>
              <button
                onClick={() => setSaveError("")}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Sticky Save Button */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2">
            <div className="rounded-lg bg-white shadow-lg border-2 border-orange-200 p-4 flex items-center gap-3">
              <div className="text-sm text-slate-700">
                <div className="font-medium">You have unsaved changes</div>
                <div className="text-xs text-slate-500">Don't forget to save your settings</div>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className={saved ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
                size="sm"
              >
                {saved ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Now"}
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="account" className="gap-1.5 px-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Account</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="profile" className="gap-1.5 px-3">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Profile</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="content" className="gap-1.5 px-3">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Content</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="mentorship" className="gap-1.5 px-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Mentor</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Mentorship</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="notifications" className="gap-1.5 px-3">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Notifications</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="appearance" className="gap-1.5 px-3">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Theme</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Appearance</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="privacy" className="gap-1.5 px-3">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Privacy & Security</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="advanced" className="gap-1.5 px-3">
                  <Sliders className="h-4 w-4" />
                  <span className="hidden sm:inline">More</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">Advanced</TooltipContent>
            </Tooltip>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-700">
                  Account Information
                </h2>
                <Button
                  variant="outline"
                  onClick={() => router.push("/onboarding")}
                  size="sm"
                >
                  Re-run Onboarding
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Account Type</Label>
                  <div className="mt-2 flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    {profileData.accountType === "private" ? (
                      <>
                        <User className="h-4 w-4 text-orange-600" />
                        <div className="text-sm">
                          <span className="font-medium text-slate-900">Private Account</span>
                          <span className="text-slate-600 ml-2">· Individual posting</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 text-orange-600" />
                        <div className="text-sm">
                          <span className="font-medium text-slate-900">Company Account</span>
                          <span className="text-slate-600 ml-2">· Business posting</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled className="bg-slate-50 mt-1.5" />
                  </div>
                  <div>
                    <Label>Display Name</Label>
                    <Input value={user?.displayName || ""} disabled className="bg-slate-50 mt-1.5" />
                  </div>
                </div>

                <div>
                  <Label>Profile Photo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="relative">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-slate-200">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      {photoUploading && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={photoUploading}
                      />
                      <label htmlFor="photo-upload">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={photoUploading}
                          onClick={() => document.getElementById("photo-upload")?.click()}
                          className="cursor-pointer"
                          size="sm"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {photoUploading ? "Uploading..." : "Upload Photo"}
                        </Button>
                      </label>
                      <p className="text-xs text-slate-500 mt-1.5">
                        JPG, PNG or GIF. Max 5MB.
                      </p>
                      {photoError && (
                        <p className="text-xs text-red-600 mt-1">{photoError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-3">
                Connected Accounts
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Link multiple sign-in methods for easier access to your account.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Chrome className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-slate-700">Google</h3>
                      <p className="text-xs text-slate-600">
                        {linkedProviders.includes('google.com') ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {linkedProviders.includes('google.com') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlinkProvider('google.com')}
                      disabled={linkingProvider === 'google.com' || linkedProviders.length <= 1}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs"
                    >
                      <Unlink className="mr-1.5 h-3.5 w-3.5" />
                      {linkingProvider === 'google.com' ? 'Unlinking...' : 'Unlink'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkProvider('google.com')}
                      disabled={linkingProvider === 'google.com'}
                      className="text-xs"
                    >
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      {linkingProvider === 'google.com' ? 'Linking...' : 'Link'}
                    </Button>
                  )}
                </div>

                {linkedProviders.includes('password') && (
                  <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <Lock className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-slate-700">Email & Password</h3>
                        <p className="text-xs text-slate-600">{user?.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 px-2.5 py-1 bg-slate-100 rounded">
                      Primary
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Billing */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-3">
                Subscription & Billing
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Manage your subscription plan and billing information.
              </p>
              <Button variant="outline" onClick={() => router.push("/app/billing")} size="sm">
                Go to Billing
              </Button>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Company Details (only for company accounts) */}
            {profileData.accountType === "company" && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-700 mb-4">
                  Company Information
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={profileData.companyName || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, companyName: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyIndustry">Industry</Label>
                    <Input
                      id="companyIndustry"
                      placeholder="e.g., SaaS, Healthcare, Finance"
                      value={profileData.companyIndustry || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, companyIndustry: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Professional Background */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                {profileData.accountType === "company" ? "Company Background" : "Professional Background"}
              </h2>
              <div>
                <Textarea
                  id="background"
                  placeholder="Tell us about your professional experience and what makes you unique..."
                  value={profileData.background}
                  onChange={(e) =>
                    setProfileData({ ...profileData, background: e.target.value })
                  }
                  className="min-h-[180px]"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  {profileData.background.length} characters
                </p>
              </div>
            </div>

            {/* Areas of Expertise */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-700">Areas of Expertise</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Select topics you're knowledgeable about. This helps generate more relevant content.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              <p className="text-xs text-slate-500 mt-3">
                {profileData.expertise.length} selected
              </p>
            </div>

            {/* Target Audience & Goals */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Target Audience & Goals
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Who do you want to reach with your content?
                  </p>
                  <Select
                    value={profileData.targetAudience}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, targetAudience: value })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
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

                <div>
                  <Label>Your Goals</Label>
                  <p className="text-xs text-slate-500 mb-3">
                    What do you want to achieve? (Select all that apply)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {GOALS.map((goal) => (
                      <div key={goal.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal.value}`}
                          checked={profileData.goals.includes(goal.value)}
                          onCheckedChange={() => handleGoalsToggle(goal.value)}
                        />
                        <label
                          htmlFor={`goal-${goal.value}`}
                          className="text-sm text-slate-700 cursor-pointer"
                        >
                          {goal.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {profileData.goals.length} selected
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Content Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="language">Content Language</Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Language for all generated content
                  </p>
                  <Select
                    value={profileData.language}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          <span className="flex items-center gap-2">
                            <span>{language.flag}</span>
                            <span>{language.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="style">Writing Style</Label>
                    <Select
                      value={profileData.writingStyle}
                      onValueChange={(value) =>
                        setProfileData({ ...profileData, writingStyle: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
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

                  <div>
                    <Label htmlFor="voice">Brand Voice</Label>
                    <Select
                      value={profileData.brandVoice}
                      onValueChange={(value) =>
                        setProfileData({ ...profileData, brandVoice: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
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

                <div>
                  <Label htmlFor="postLength">Default Post Length</Label>
                  <Select
                    value={profileData.advancedSettings?.defaultPostLength || 'medium'}
                    onValueChange={(value: 'short' | 'medium' | 'long') =>
                      setProfileData({
                        ...profileData,
                        advancedSettings: {
                          ...profileData.advancedSettings!,
                          defaultPostLength: value,
                        }
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (&lt;800 characters)</SelectItem>
                      <SelectItem value="medium">Medium (800-1500 characters)</SelectItem>
                      <SelectItem value="long">Long (1500+ characters)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Mentorship Tab */}
          <TabsContent value="mentorship" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-700">
                    Mentorship Mode
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Get AI-powered suggestions to improve your content variety and quality
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="font-medium text-sm text-slate-700">Enable Mentorship</div>
                    <div className="text-xs text-slate-600">
                      Receive contextual suggestions while drafting
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileData(prev => ({
                        ...prev,
                        mentorshipSettings: {
                          ...prev.mentorshipSettings!,
                          enabled: !prev.mentorshipSettings?.enabled,
                        }
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      profileData.mentorshipSettings?.enabled
                        ? "bg-orange-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out ${
                        profileData.mentorshipSettings?.enabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Expanded Controls */}
                {profileData.mentorshipSettings?.enabled && (
                  <>
                    <div className="border-t border-slate-200 pt-5">
                      <h3 className="mb-3 text-base font-semibold text-slate-700">
                        Mentor Personality
                      </h3>
                      <MentorshipTemperatureSlider
                        value={profileData.mentorshipSettings?.temperature || 3}
                        onChange={(value) =>
                          setProfileData(prev => ({
                            ...prev,
                            mentorshipSettings: {
                              ...prev.mentorshipSettings!,
                              temperature: value,
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="border-t border-slate-200 pt-5">
                      <h3 className="mb-2 text-base font-semibold text-slate-700">
                        Custom Instructions
                      </h3>
                      <p className="mb-3 text-xs text-slate-600">
                        Guide your mentor's focus. Your instructions override default suggestions.
                      </p>
                      <textarea
                        value={profileData.mentorshipSettings?.customInstructions || ""}
                        onChange={(e) =>
                          setProfileData(prev => ({
                            ...prev,
                            mentorshipSettings: {
                              ...prev.mentorshipSettings!,
                              customInstructions: e.target.value,
                            }
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        rows={4}
                        maxLength={500}
                        placeholder="Focus on helping me balance technical content with personal stories..."
                      />
                      <div className="mt-1.5 text-xs text-slate-600">
                        {(profileData.mentorshipSettings?.customInstructions || "").length} / 500
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-5">
                      <h3 className="mb-3 text-base font-semibold text-slate-700">
                        Quick Actions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={handleSnoozeMentorship}
                          disabled={snoozingMentorship}
                          variant="outline"
                          size="sm"
                        >
                          {snoozingMentorship ? "Snoozing..." : "Snooze All (24h)"}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleClearDismissed}
                          disabled={clearingDismissed}
                          variant="outline"
                          size="sm"
                        >
                          {clearingDismissed ? "Clearing..." : "Clear Dismissed"}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleResetMentorship}
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          Reset Defaults
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-700">
                  Email Notifications
                </h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Choose which email notifications you'd like to receive
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-sm text-slate-700">Draft Reminders</div>
                    <div className="text-xs text-slate-600">Get reminded about incomplete drafts</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileData(prev => ({
                        ...prev,
                        notificationSettings: {
                          ...prev.notificationSettings!,
                          draftReminders: !prev.notificationSettings?.draftReminders,
                        }
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      profileData.notificationSettings?.draftReminders
                        ? "bg-orange-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                        profileData.notificationSettings?.draftReminders
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-sm text-slate-700">Weekly Content Ideas</div>
                    <div className="text-xs text-slate-600">Weekly digest of trending topics</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileData(prev => ({
                        ...prev,
                        notificationSettings: {
                          ...prev.notificationSettings!,
                          weeklyDigest: !prev.notificationSettings?.weeklyDigest,
                        }
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      profileData.notificationSettings?.weeklyDigest
                        ? "bg-orange-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                        profileData.notificationSettings?.weeklyDigest
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-sm text-slate-700">Mentorship Suggestions</div>
                    <div className="text-xs text-slate-600">Alerts when new suggestions are available</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileData(prev => ({
                        ...prev,
                        notificationSettings: {
                          ...prev.notificationSettings!,
                          mentorshipAlerts: !prev.notificationSettings?.mentorshipAlerts,
                        }
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      profileData.notificationSettings?.mentorshipAlerts
                        ? "bg-orange-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                        profileData.notificationSettings?.mentorshipAlerts
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-sm text-slate-700">Campaign Completion</div>
                    <div className="text-xs text-slate-600">Notify when campaigns finish</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileData(prev => ({
                        ...prev,
                        notificationSettings: {
                          ...prev.notificationSettings!,
                          campaignCompletion: !prev.notificationSettings?.campaignCompletion,
                        }
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      profileData.notificationSettings?.campaignCompletion
                        ? "bg-orange-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                        profileData.notificationSettings?.campaignCompletion
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-sm text-slate-700">Monthly Analytics Summary</div>
                    <div className="text-xs text-slate-600">Monthly performance insights</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileData(prev => ({
                        ...prev,
                        notificationSettings: {
                          ...prev.notificationSettings!,
                          monthlyAnalytics: !prev.notificationSettings?.monthlyAnalytics,
                        }
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      profileData.notificationSettings?.monthlyAnalytics
                        ? "bg-orange-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                        profileData.notificationSettings?.monthlyAnalytics
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-700">
                  Appearance Settings
                </h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Customize how Storyscale looks and feels
              </p>

              <div className="space-y-5">
                <div>
                  <Label>Theme</Label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <button
                      onClick={() =>
                        setProfileData(prev => ({
                          ...prev,
                          appearanceSettings: {
                            ...prev.appearanceSettings!,
                            theme: 'light',
                          }
                        }))
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        profileData.appearanceSettings?.theme === 'light'
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      onClick={() =>
                        setProfileData(prev => ({
                          ...prev,
                          appearanceSettings: {
                            ...prev.appearanceSettings!,
                            theme: 'dark',
                          }
                        }))
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        profileData.appearanceSettings?.theme === 'dark'
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button
                      onClick={() =>
                        setProfileData(prev => ({
                          ...prev,
                          appearanceSettings: {
                            ...prev.appearanceSettings!,
                            theme: 'system',
                          }
                        }))
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        profileData.appearanceSettings?.theme === 'system'
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Monitor className="h-5 w-5" />
                      <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Note: Dark mode UI coming soon
                  </p>
                </div>

                <div>
                  <Label>Interface Density</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setProfileData(prev => ({
                          ...prev,
                          appearanceSettings: {
                            ...prev.appearanceSettings!,
                            density: 'comfortable',
                          }
                        }))
                      }
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        profileData.appearanceSettings?.density === 'comfortable'
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm">Comfortable</div>
                      <div className="text-xs text-slate-600">More spacing, easier on the eyes</div>
                    </button>
                    <button
                      onClick={() =>
                        setProfileData(prev => ({
                          ...prev,
                          appearanceSettings: {
                            ...prev.appearanceSettings!,
                            density: 'compact',
                          }
                        }))
                      }
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        profileData.appearanceSettings?.density === 'compact'
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm">Compact</div>
                      <div className="text-xs text-slate-600">Denser layout, more content visible</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy" className="space-y-4">
            {/* Password Section (Collapsible) */}
            {linkedProviders.includes('password') && (
              <Collapsible open={isPasswordSectionOpen} onOpenChange={setIsPasswordSectionOpen}>
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-slate-700" />
                      <div className="text-left">
                        <h2 className="text-lg font-semibold text-slate-700">Password & Security</h2>
                        <p className="text-sm text-slate-600">Change your account password</p>
                      </div>
                    </div>
                    {isPasswordSectionOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6">
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1.5"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1.5"
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1.5"
                          placeholder="Re-enter new password"
                        />
                      </div>
                      {passwordError && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                          {passwordError}
                        </div>
                      )}
                      {passwordChanged && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Password changed successfully!
                        </div>
                      )}
                      <Button
                        onClick={handlePasswordChange}
                        disabled={passwordChanging}
                        variant="outline"
                        size="sm"
                        className={passwordChanged ? "border-green-600 text-green-600" : ""}
                      >
                        {passwordChanging ? "Changing..." : passwordChanged ? "Changed!" : "Change Password"}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Data Export */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-700">
                  Data Export
                </h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Download all your data in JSON format. Complies with GDPR data portability requirements.
              </p>
              <Button
                onClick={handleExportData}
                disabled={exporting}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export My Data"}
              </Button>
            </div>

            {/* Delete Account (Collapsible) */}
            <Collapsible open={isDeleteSectionOpen} onOpenChange={setIsDeleteSectionOpen}>
              <div className="rounded-xl border-2 border-red-200 bg-red-50 shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-red-100/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                      <p className="text-sm text-red-800">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  {isDeleteSectionOpen ? (
                    <ChevronUp className="h-5 w-5 text-red-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-red-600" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                  <div className="pt-2">
                    <p className="text-sm text-red-800 mb-3">
                      This action is permanent and will:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1 mb-4">
                      <li>Delete all your drafts and campaigns</li>
                      <li>Remove all your profile data</li>
                      <li>Cancel your subscription</li>
                      <li>Permanently delete your account</li>
                    </ul>

                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-red-300">
                          <Label htmlFor="deleteConfirm" className="text-red-900 font-semibold text-sm">
                            Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                          </Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="mt-2 border-red-300 focus:border-red-500"
                            placeholder="Type DELETE"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== "DELETE" || deleting}
                            className="bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting ? "Deleting..." : "Yes, Delete Forever"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText("");
                            }}
                            disabled={deleting}
                            className="border-red-300 text-red-900 hover:bg-red-100"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-700">
                  Advanced Settings
                </h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Fine-tune your Storyscale experience
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.advancedSettings?.timezone || 'America/New_York'}
                    onValueChange={(value) =>
                      setProfileData({
                        ...profileData,
                        advancedSettings: {
                          ...profileData.advancedSettings!,
                          timezone: value,
                        }
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="linkedInUrl">LinkedIn Profile URL</Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Optional: Helps generate more personalized content
                  </p>
                  <Input
                    id="linkedInUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={profileData.advancedSettings?.linkedInUrl || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        advancedSettings: {
                          ...profileData.advancedSettings!,
                          linkedInUrl: e.target.value,
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={saved ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
          >
            {saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save All Changes"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
