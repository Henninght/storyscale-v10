'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { CampaignStrip } from "@/components/CampaignStrip";
import { DraftRow } from "@/components/DraftRow";
import { MentorshipSuggestion } from "@/components/MentorshipSuggestion";
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import type { Campaign, Draft, UserProfile, MentorshipSuggestion as MentorshipSuggestionType } from '@/types';
import { PageTransition } from '@/components/PageTransition';
import { generateSuggestions, createSuggestion } from '@/lib/mentorshipEngine';
import { Timestamp } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<(Draft & { id: string })[]>([]);
  const [campaigns, setCampaigns] = useState<(Campaign & { id: string })[]>([]);
  const [campaignMap, setCampaignMap] = useState<Map<string, string>>(new Map());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mentorshipSuggestions, setMentorshipSuggestions] = useState<MentorshipSuggestionType[]>([]);
  const [showParked, setShowParked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();

        // Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        let userData: any = null;

        if (userDoc.exists()) {
          userData = userDoc.data();
          setUserProfile(userData.profile || null);
        }

        // Fetch drafts
        const draftsRef = collection(db, 'drafts');
        const draftsQuery = query(draftsRef, where('userId', '==', user.uid));
        const draftsSnapshot = await getDocs(draftsQuery);
        const fetchedDrafts = draftsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt,
        })) as (Draft & { id: string })[];

        // Sort by most recent
        fetchedDrafts.sort((a, b) => {
          const aTime = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0;
          const bTime = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0;
          return bTime - aTime;
        });

        setDrafts(fetchedDrafts);

        // Fetch campaigns
        const campaignsRef = collection(db, 'campaigns');
        const campaignsQuery = query(
          campaignsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'active')
        );
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const fetchedCampaigns = campaignsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (Campaign & { id: string })[];

        setCampaigns(fetchedCampaigns);

        // Create campaign map
        const newCampaignMap = new Map<string, string>();
        fetchedCampaigns.forEach(campaign => {
          newCampaignMap.set(campaign.id, campaign.name);
        });
        setCampaignMap(newCampaignMap);

        // Generate mentorship suggestions (if enabled)
        if (userData?.profile?.mentorshipSettings?.enabled) {
          const settings = userData.profile.mentorshipSettings;
          const suggestions = generateSuggestions({
            temperature: settings.temperature || 3,
            customInstructions: settings.customInstructions || '',
            userProfile: userData.profile,
            recentDrafts: fetchedDrafts.slice(0, 10),
          });

          // Create suggestion objects
          const now = Timestamp.now();
          const expiresAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000); // 24h

          const suggestionObjects: MentorshipSuggestionType[] = suggestions.map((msg, idx) => ({
            id: `temp-${idx}`,
            userId: user.uid,
            message: msg,
            type: 'variety' as const,
            slot: idx === 0 ? ('after_welcome' as const) : ('after_drafts' as const),
            temperature: settings.temperature || 3,
            context: {
              draftCount: fetchedDrafts.length,
              patterns: [],
            },
            createdAt: now,
            expiresAt,
          }));

          setMentorshipSuggestions(suggestionObjects);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    setDrafts(drafts.filter(d => d.id !== id));
  };

  const handleDismissSuggestion = (id: string) => {
    setMentorshipSuggestions(suggestions => suggestions.filter(s => s.id !== id));
  };

  // Filter drafts
  const activeDrafts = drafts.filter(d => d.status === 'in_progress' || d.status === 'ready_to_post');
  const parkedDrafts = drafts.filter(d => d.status === 'idea');

  const filteredActiveDrafts = activeDrafts
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .filter(d => languageFilter === 'all' || d.language === languageFilter);

  const filteredParkedDrafts = parkedDrafts
    .filter(d => languageFilter === 'all' || d.language === languageFilter);

  // Get user's first name
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  // Mentorship suggestions by slot
  const welcomeSuggestions = mentorshipSuggestions.filter(s => s.slot === 'after_welcome');
  const draftsSuggestions = mentorshipSuggestions.filter(s => s.slot === 'after_drafts');

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        {/* Personal Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-slate-600">
            Ready to continue your writing?
          </p>
        </div>

        {/* Mentorship Suggestion (after welcome) - DISABLED */}
        {/* {welcomeSuggestions.length > 0 && (
          <div>
            {welcomeSuggestions.slice(0, 1).map(suggestion => (
              <MentorshipSuggestion
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={() => handleDismissSuggestion(suggestion.id)}
              />
            ))}
          </div>
        )} */}

        {/* Campaign Strip */}
        {campaigns.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Active Campaigns</h2>
            <CampaignStrip campaigns={campaigns} maxVisible={3} />
          </div>
        )}

        {/* Resume Your Writing */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Resume Your Writing</h2>

            {/* Filter & Sort Dropdown */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All</option>
                  <option value="in_progress">In Progress</option>
                  <option value="ready_to_post">Ready to Post</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Language:</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All</option>
                  <option value="en">English</option>
                  <option value="no">Norwegian</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Drafts List */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-600">Loading...</p>
            </div>
          ) : filteredActiveDrafts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-600">No active drafts. Start something new below!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActiveDrafts.slice(0, 5).map(draft => (
                <DraftRow
                  key={draft.id}
                  draft={draft}
                  campaignName={draft.campaignId ? campaignMap.get(draft.campaignId) : undefined}
                  onDelete={handleDelete}
                />
              ))}
              {filteredActiveDrafts.length > 5 && (
                <button
                  onClick={() => router.push('/app/drafts')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  View all {filteredActiveDrafts.length} drafts →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mentorship Suggestion (after drafts) - DISABLED */}
        {/* {draftsSuggestions.length > 0 && (
          <div>
            {draftsSuggestions.slice(0, 1).map(suggestion => (
              <MentorshipSuggestion
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={() => handleDismissSuggestion(suggestion.id)}
              />
            ))}
          </div>
        )} */}

        {/* Parked Ideas (Expandable) */}
        {parkedDrafts.length > 0 && (
          <div>
            <button
              onClick={() => setShowParked(!showParked)}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              <span>Parked Ideas ({parkedDrafts.length})</span>
              {showParked ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showParked && (
              <div className="space-y-2">
                {filteredParkedDrafts.map(draft => (
                  <DraftRow
                    key={draft.id}
                    draft={draft}
                    campaignName={draft.campaignId ? campaignMap.get(draft.campaignId) : undefined}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Start Something New */}
        <div className="pt-4">
          <h2 className="mb-3 text-xl font-semibold text-slate-800">Start Something New</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Create Single Post */}
            <button
              onClick={() => router.push('/app/create')}
              className="group flex items-center gap-4 rounded-2xl border-2 border-orange-200 bg-white px-6 py-5 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-md"
            >
              <div className="rounded-xl bg-orange-100 p-3 group-hover:bg-orange-200 transition-colors">
                <Plus className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800">Create Single Post</h3>
                <p className="text-sm text-slate-600">Start a new LinkedIn post with AI</p>
              </div>
            </button>

            {/* Start Campaign */}
            <button
              onClick={() => router.push('/app/campaigns?new=true')}
              className="group flex items-center gap-4 rounded-2xl border-2 border-purple-200 bg-white px-6 py-5 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-md"
            >
              <div className="rounded-xl bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800">Start Campaign</h3>
                <p className="text-sm text-slate-600">Plan a content series with AI</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
