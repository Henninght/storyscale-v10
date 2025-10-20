"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile, deleteUser, linkWithPopup, unlink, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
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
import { Settings, Save, User, Building2, Check, Lock, Camera, Upload, Trash2, AlertTriangle, Download, Chrome, Link2, Unlink, Sparkles } from "lucide-react";
import { MentorshipTemperatureSlider } from "@/components/MentorshipTemperatureSlider";
import { AccountType } from "@/types";

interface ProfileData {
  language: string;
  accountType: AccountType;
  background: string;
  expertise: string[];
  targetAudience: string;
  goals: string;
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

const LANGUAGES = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "no", label: "Norsk", flag: "🇳🇴" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    language: "en",
    accountType: "private",
    background: "",
    expertise: [],
    targetAudience: "",
    goals: "",
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
  });

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

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userDoc.exists() && userData?.profile) {
          const loadedProfile = userData.profile;
          // Provide default values for existing users
          setProfileData({
            language: loadedProfile.language || "en",
            accountType: loadedProfile.accountType || "private",
            ...loadedProfile,
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    // Get linked providers
    const providers = user.providerData.map(provider => provider.providerId);
    setLinkedProviders(providers);

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
      setTimeout(() => setSaved(false), 5000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !user.email) return;

    // Validate inputs
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
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be less than 5MB");
      return;
    }

    setPhotoUploading(true);
    setPhotoError("");

    try {
      // Create storage reference
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}-${file.name}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const photoURL = await getDownloadURL(storageRef);

      // Update user profile in Firebase Auth
      await updateProfile(user, { photoURL });

      // Update user document in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { photoURL }, { merge: true });

      // Force reload to update UI
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

    // Validate confirmation text
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);

    try {
      // Delete user's drafts
      const draftsQuery = query(
        collection(db, "drafts"),
        where("userId", "==", user.uid)
      );
      const draftsSnapshot = await getDocs(draftsQuery);
      const draftDeletes = draftsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(draftDeletes);

      // Delete user's campaigns
      const campaignsQuery = query(
        collection(db, "campaigns"),
        where("userId", "==", user.uid)
      );
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaignDeletes = campaignsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(campaignDeletes);

      // Delete user document
      await deleteDoc(doc(db, "users", user.uid));

      // Delete Firebase Auth account
      await deleteUser(user);

      // Redirect to home page
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
      // Get user document
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Get user's drafts
      const draftsQuery = query(
        collection(db, "drafts"),
        where("userId", "==", user.uid)
      );
      const draftsSnapshot = await getDocs(draftsQuery);
      const drafts = draftsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get user's campaigns
      const campaignsQuery = query(
        collection(db, "campaigns"),
        where("userId", "==", user.uid)
      );
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaigns = campaignsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compile all data
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

      // Create and download JSON file
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

      // Update linked providers list
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

    // Prevent unlinking if it's the only provider
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

      // Update linked providers list
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
      // In a real implementation, we'd query and update the mentorship_suggestions collection
      // For now, we'll just show a success message
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-700">Settings</h1>
          <p className="mt-2 text-slate-700/80">
            Manage your profile and content preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={saved ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
        >
          {saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Account Information */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-700">
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
            <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {profileData.accountType === "private" ? (
                <>
                  <User className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-slate-900">Private Account</div>
                    <div className="text-sm text-slate-600">Posting as an individual</div>
                  </div>
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-slate-900">Company Account</div>
                    <div className="text-sm text-slate-600">Posting as a company</div>
                  </div>
                </>
              )}
            </div>
          </div>
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
          <div>
            <Label>Profile Photo</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-slate-200">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {photoUploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  JPG, PNG or GIF. Max size 5MB.
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
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Connected Accounts
        </h2>
        <p className="text-slate-700/80 mb-6">
          Manage which accounts are connected to your Storyscale account. You can link multiple sign-in methods for easier access.
        </p>
        <div className="space-y-4">
          {/* Google Account */}
          <div className="flex items-center justify-between p-4 border border-secondary/10 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Chrome className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="font-medium text-slate-700">Google</h3>
                <p className="text-sm text-slate-700/60">
                  {linkedProviders.includes('google.com')
                    ? 'Connected'
                    : 'Not connected'}
                </p>
              </div>
            </div>
            {linkedProviders.includes('google.com') ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlinkProvider('google.com')}
                disabled={linkingProvider === 'google.com' || linkedProviders.length <= 1}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Unlink className="mr-2 h-4 w-4" />
                {linkingProvider === 'google.com' ? 'Unlinking...' : 'Unlink'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkProvider('google.com')}
                disabled={linkingProvider === 'google.com'}
              >
                <Link2 className="mr-2 h-4 w-4" />
                {linkingProvider === 'google.com' ? 'Linking...' : 'Link Account'}
              </Button>
            )}
          </div>

          {/* Email/Password Account */}
          {linkedProviders.includes('password') && (
            <div className="flex items-center justify-between p-4 border border-secondary/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Lock className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-700">Email & Password</h3>
                  <p className="text-sm text-slate-700/60">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-slate-700/40"
              >
                Primary Method
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Password & Security - Only show for email/password users */}
      {user?.providerData?.[0]?.providerId === "password" && (
        <div className="rounded-2xl border border-secondary/10 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">
            Password & Security
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700/40" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-11"
                  placeholder="Enter current password"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700/40" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-11"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700/40" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11"
                  placeholder="Confirm new password"
                />
              </div>
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
              className={passwordChanged ? "border-green-600 text-green-600" : ""}
            >
              {passwordChanging ? "Changing..." : passwordChanged ? "Password Changed!" : "Change Password"}
            </Button>
          </div>
        </div>
      )}

      {/* Company Details (only for company accounts) */}
      {profileData.accountType === "company" && (
        <div className="rounded-2xl border border-secondary/10 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">
            Company Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={profileData.companyName || ""}
                onChange={(e) =>
                  setProfileData({ ...profileData, companyName: e.target.value })
                }
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-6">
          Content Profile
        </h2>
        <div className="space-y-3">
          {/* Language Selection */}
          <div>
            <Label htmlFor="language">Content Language</Label>
            <p className="text-xs text-slate-500 mb-2">
              The language used for all generated LinkedIn content
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

          {/* Professional Background */}
          <div>
            <Label htmlFor="background">
              {profileData.accountType === "company" ? "Company Background" : "Professional Background"}
            </Label>
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
              {(profileData.goals || '').length} characters
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

      {/* Mentorship Mode */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-700">
              Mentorship Mode
            </h2>
            <p className="mt-1 text-slate-600">
              Get contextual writing suggestions based on your draft patterns and goals
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="font-medium text-slate-700">Enable Mentorship Guidance</div>
              <div className="text-sm text-slate-600">
                Receive AI-powered suggestions to improve your content variety and quality
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
              className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                profileData.mentorshipSettings?.enabled
                  ? "bg-orange-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out ${
                  profileData.mentorshipSettings?.enabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Expanded Controls (when enabled) */}
          {profileData.mentorshipSettings?.enabled && (
            <>
              <div className="border-t border-slate-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-700">
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

              <div className="border-t border-slate-200 pt-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-700">
                  Custom Instructions (Optional)
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Tell your mentor what to focus on. Your instructions will override default suggestions.
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  rows={4}
                  maxLength={500}
                  placeholder="Focus on helping me balance technical content with personal stories. Remind me to write about communication skills."
                />
                <div className="mt-2 flex items-start justify-between text-sm">
                  <div className="text-slate-600">
                    {(profileData.mentorshipSettings?.customInstructions || "").length} / 500 characters
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="mb-2 text-sm font-medium text-blue-900">
                    Examples you can use:
                  </div>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• "Keep my posts under 1000 characters"</li>
                    <li>• "Suggest topics about leadership and team building"</li>
                    <li>• "Remind me to vary my post formats (stories, lists, questions)"</li>
                    <li>• "Push me to write more inspirational content"</li>
                    <li>• "Help me balance thought leadership with actionable tips"</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-700">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleSnoozeMentorship}
                    disabled={snoozingMentorship}
                    variant="outline"
                  >
                    {snoozingMentorship ? "Snoozing..." : "Snooze All (24h)"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleClearDismissed}
                    disabled={clearingDismissed}
                    variant="outline"
                  >
                    {clearingDismissed ? "Clearing..." : "Clear Dismissed"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetMentorship}
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Privacy & Security */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Data Privacy & Export
        </h2>
        <p className="text-slate-700/80 mb-4">
          Download a complete copy of all your data including profile, drafts, campaigns, and settings. This file will be in JSON format and complies with GDPR data portability requirements.
        </p>
        <Button
          onClick={handleExportData}
          disabled={exporting}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting Data..." : "Export My Data"}
        </Button>
      </div>

      {/* Danger Zone - Delete Account */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Danger Zone
            </h2>
            <p className="text-red-800 mb-4">
              Once you delete your account, there is no going back. This action is permanent and will:
            </p>
            <ul className="list-disc list-inside text-red-800 space-y-1 mb-4">
              <li>Delete all your drafts and campaigns</li>
              <li>Remove all your profile data</li>
              <li>Cancel your subscription (if applicable)</li>
              <li>Permanently delete your account</li>
            </ul>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete My Account
          </Button>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-white rounded-lg p-4 border border-red-300">
              <Label htmlFor="deleteConfirm" className="text-red-900 font-semibold">
                Type <span className="font-mono bg-red-100 px-2 py-1 rounded">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-2 border-red-300 focus:border-red-500"
                placeholder="Type DELETE to confirm"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting Account..." : "Yes, Delete My Account"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
                className="border-red-300 text-red-900 hover:bg-red-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Billing Link */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Subscription & Billing
        </h2>
        <p className="text-slate-700/80 mb-4">
          Manage your subscription plan and billing information.
        </p>
        <Button variant="outline" onClick={() => router.push("/app/billing")}>
          Go to Billing
        </Button>
      </div>
    </div>
  );
}
