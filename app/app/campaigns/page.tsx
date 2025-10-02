'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Megaphone, Plus, Calendar, Target, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { campaignTemplates, CampaignTemplate } from '@/lib/campaignTemplates';
import { CampaignInputValidator } from '@/components/CampaignInputValidator';

interface Campaign {
  id: string;
  userId: string;
  name: string;
  theme: string;
  description: string;
  language: 'en' | 'no';
  startDate: Date;
  endDate: Date;
  frequency: 'daily' | '3x_week' | 'weekly';
  targetPostCount: number;
  style: string;
  tone: 'professional' | 'casual' | 'inspirational' | 'educational';
  purpose: 'engagement' | 'lead_generation' | 'brand_awareness' | 'thought_leadership';
  audience: 'executives' | 'entrepreneurs' | 'professionals' | 'industry_specific';
  templateId: string | null;
  status: 'active' | 'completed' | 'archived';
  postsGenerated: number;
  createdAt: Date;
  aiStrategy?: {
    overallApproach: string;
    strategicOverview: string;
    narrativeArc: string;
    successMarkers: string[];
    postBlueprints: Array<{
      position: number;
      topic: string;
      goal: string;
      locked: boolean;
      userCustomized: boolean;
    }>;
  };
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [aiBrief, setAiBrief] = useState<any>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [editingPostIndex, setEditingPostIndex] = useState<number | null>(null);
  const [editedTopic, setEditedTopic] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    theme: '',
    description: '',
    language: 'en' as 'en' | 'no',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    frequency: 'weekly' as 'daily' | '3x_week' | 'weekly',
    targetPostCount: 5,
    style: 'story-based',
    tone: 'professional' as 'professional' | 'casual' | 'inspirational' | 'educational',
    purpose: 'engagement' as 'engagement' | 'lead_generation' | 'brand_awareness' | 'thought_leadership',
    audience: 'professionals' as 'executives' | 'entrepreneurs' | 'professionals' | 'industry_specific',
    templateId: null as string | null,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push('/login');
        return;
      }

      const db = getFirestore();
      const campaignsRef = collection(db, 'campaigns');
      const q = query(campaignsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const campaignsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
        } as Campaign;
      });

      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!formData.theme.trim()) {
      alert('Please enter a campaign goal first');
      return;
    }

    setGeneratingBrief(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/campaigns/brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignGoal: formData.theme,
          postCount: formData.targetPostCount,
          style: formData.style,
          tone: formData.tone,
          purpose: formData.purpose,
          audience: formData.audience,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiBrief(data.brief);
        setWizardStep(2);
      } else {
        alert('Failed to generate strategy. Please try again.');
      }
    } catch (error) {
      console.error('Error generating brief:', error);
      alert('Failed to generate strategy. Please try again.');
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleEditPostTopic = (index: number, currentTopic: string) => {
    setEditingPostIndex(index);
    setEditedTopic(currentTopic);
  };

  const handleSavePostTopic = (index: number) => {
    if (!editedTopic.trim()) {
      alert('Post topic cannot be empty');
      return;
    }

    // Update the brief with the new topic
    const updatedBlueprints = [...aiBrief.postBlueprints];
    updatedBlueprints[index] = {
      ...updatedBlueprints[index],
      topic: editedTopic,
    };

    setAiBrief({
      ...aiBrief,
      postBlueprints: updatedBlueprints,
    });

    setEditingPostIndex(null);
    setEditedTopic('');
  };

  const handleCancelEdit = () => {
    setEditingPostIndex(null);
    setEditedTopic('');
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.theme.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // No limit on active campaigns - users can run multiple campaigns

    setCreating(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push('/login');
        return;
      }

      const db = getFirestore();

      // Create campaign with AI strategy
      const campaignData = {
        userId: user.uid,
        name: formData.name,
        theme: formData.theme,
        description: formData.description,
        language: formData.language,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        frequency: formData.frequency,
        targetPostCount: formData.targetPostCount,
        style: formData.style,
        tone: formData.tone,
        purpose: formData.purpose,
        audience: formData.audience,
        templateId: formData.templateId,
        status: 'active',
        postsGenerated: 0,
        aiStrategy: aiBrief ? {
          overallApproach: aiBrief.narrativeArc,
          postBlueprints: aiBrief.postBlueprints.map((bp: any) => ({
            position: bp.position,
            topic: bp.topic,
            goal: bp.goal,
            locked: false,
            userCustomized: false,
          })),
          strategicOverview: aiBrief.strategicOverview,
          narrativeArc: aiBrief.narrativeArc,
          successMarkers: aiBrief.successMarkers,
        } : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const campaignRef = await addDoc(collection(db, 'campaigns'), campaignData);

      // Redirect to campaign detail page
      router.push(`/app/campaigns/${campaignRef.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCampaignClick = (campaignId: string) => {
    router.push(`/app/campaigns/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-secondary/60">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Campaigns</h1>
          <p className="mt-2 text-secondary/80">
            Plan and manage your content campaigns with sequential posts.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Active Campaigns */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-secondary">
            No active campaigns
          </h3>
          <p className="mb-6 text-secondary/80">
            Create your first campaign to generate a series of related posts.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const progress = (campaign.postsGenerated / campaign.targetPostCount) * 100;

            return (
              <button
                key={campaign.id}
                onClick={() => handleCampaignClick(campaign.id)}
                className="rounded-2xl border border-secondary/10 bg-white p-6 text-left transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary">{campaign.name}</h3>
                    <p className="mt-1 text-sm text-secondary/60 line-clamp-2">{campaign.theme}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {campaign.status}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-secondary/60">Progress</span>
                    <span className="font-medium text-secondary">
                      {campaign.postsGenerated} / {campaign.targetPostCount}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary/10">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-secondary/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{campaign.frequency.replace('_', '/').replace('x', '×')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="uppercase">{campaign.language}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="capitalize">{campaign.style.replace('-', ' ')}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8">
            {/* Wizard Progress */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary">Create New Campaign</h2>
              <div className="text-sm text-secondary/60">Step {wizardStep} of 3</div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-6">
              {/* Step 1: Basic Info */}
              {wizardStep === 1 && (
                <>
              {/* Template Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-secondary">
                  Choose a Template (Optional)
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {campaignTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setFormData({
                          ...formData,
                          frequency: template.defaultSettings.frequency,
                          style: template.defaultSettings.style,
                          targetPostCount: template.defaultSettings.targetPostCount,
                          tone: template.defaultSettings.tone as any,
                          purpose: template.defaultSettings.purpose as any,
                          audience: 'professionals', // Default audience
                          templateId: template.id,
                        });
                      }}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-secondary/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <span className="font-medium text-secondary">{template.name}</span>
                      </div>
                      <p className="text-xs text-secondary/60">{template.description}</p>
                    </button>
                  ))}
                </div>
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setFormData({
                        ...formData,
                        frequency: 'weekly',
                        style: 'story-based',
                        targetPostCount: 5,
                        templateId: null,
                      });
                    }}
                    className="mt-3 flex items-center gap-2 text-sm text-secondary/60 hover:text-primary"
                  >
                    <Sparkles className="h-4 w-4" />
                    Start from scratch instead
                  </button>
                )}
              </div>

              {/* Configuration Dropdowns */}
              <div>
                <label className="mb-3 block text-sm font-medium text-secondary">
                  Campaign Configuration
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-secondary/70">
                      Tone *
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                      className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="inspirational">Inspirational</option>
                      <option value="educational">Educational</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-secondary/70">
                      Purpose *
                    </label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                      className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="engagement">Engagement</option>
                      <option value="lead_generation">Lead Generation</option>
                      <option value="brand_awareness">Brand Awareness</option>
                      <option value="thought_leadership">Thought Leadership</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-secondary/70">
                      Target Audience *
                    </label>
                    <select
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value as any })}
                      className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="executives">Executives</option>
                      <option value="entrepreneurs">Entrepreneurs</option>
                      <option value="professionals">Professionals</option>
                      <option value="industry_specific">Industry-Specific</option>
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-xs text-secondary/60">
                  These settings help AI generate a more targeted campaign strategy
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  placeholder="e.g., Product Launch 2024"
                  required
                />
              </div>

              {/* Theme */}
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">
                  Campaign Theme *
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  placeholder="e.g., Launching our new AI-powered analytics tool"
                  required
                />
                <CampaignInputValidator
                  text={formData.theme}
                  language={formData.language}
                  fieldType="theme"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  rows={3}
                  placeholder="Brief description of your campaign goals..."
                />
                {formData.description && (
                  <CampaignInputValidator
                    text={formData.description}
                    language={formData.language}
                    fieldType="description"
                  />
                )}
              </div>

              {/* Language & Style */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'no' })}
                    className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="en">English</option>
                    <option value="no">Norwegian</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    Content Style
                  </label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="story-based">Story-Based</option>
                    <option value="list-format">List Format</option>
                    <option value="question-based">Question-Based</option>
                    <option value="how-to">How-To</option>
                  </select>
                </div>
              </div>

              {/* Dates & Frequency */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | '3x_week' | 'weekly' })}
                    className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="3x_week">3× per week</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Target Post Count */}
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">
                  Target Number of Posts
                </label>
                <input
                  type="number"
                  value={formData.targetPostCount}
                  onChange={(e) => setFormData({ ...formData, targetPostCount: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-secondary/20 px-4 py-3 outline-none focus:border-primary"
                  min="1"
                  max="50"
                  required
                />
              </div>

              {/* Step 1 Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setWizardStep(1);
                    setAiBrief(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateBrief}
                  className="flex-1"
                  disabled={generatingBrief || !formData.theme.trim()}
                >
                  {generatingBrief ? 'Generating Strategy...' : 'Next: Generate Strategy'}
                </Button>
              </div>
                </>
              )}

              {/* Step 2: AI Strategy Review */}
              {wizardStep === 2 && aiBrief && (
                <>
                  <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-6">
                    <h3 className="mb-3 text-lg font-semibold text-secondary">
                      Your Campaign Strategy
                    </h3>
                    <p className="mb-4 text-secondary/80">{aiBrief.strategicOverview}</p>

                    <div className="mb-4">
                      <div className="text-sm font-medium text-secondary/60">Narrative Arc</div>
                      <div className="text-secondary">{aiBrief.narrativeArc}</div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-medium text-secondary/60">Post Sequence</div>
                        <div className="text-xs text-secondary/50">Click any post to edit</div>
                      </div>
                      <div className="space-y-2">
                        {aiBrief.postBlueprints.map((bp: any, index: number) => (
                          <div key={bp.position} className="group rounded border border-secondary/10 p-3 transition-all hover:border-primary/30">
                            {editingPostIndex === index ? (
                              // Edit mode
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editedTopic}
                                  onChange={(e) => setEditedTopic(e.target.value)}
                                  className="w-full rounded border border-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                  placeholder="Enter post topic..."
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSavePostTopic(index)}
                                    className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="rounded border border-secondary/20 px-3 py-1 text-xs font-medium text-secondary hover:bg-secondary/5"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="font-medium text-secondary">
                                    Post {bp.position}: {bp.topic}
                                  </div>
                                  <div className="text-sm text-secondary/60">{bp.goal}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleEditPostTopic(index, bp.topic)}
                                  className="rounded border border-secondary/20 px-2 py-1 text-xs text-secondary opacity-0 transition-opacity hover:bg-secondary/5 group-hover:opacity-100"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGenerateBrief}
                      variant="outline"
                      disabled={generatingBrief}
                      className="flex-1"
                    >
                      {generatingBrief ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="flex-1"
                    >
                      Accept Strategy
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Final Confirmation */}
              {wizardStep === 3 && (
                <>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-secondary/20 p-4">
                      <h3 className="mb-3 font-semibold text-secondary">Campaign Summary</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-secondary/60">Name:</dt>
                          <dd className="font-medium text-secondary">{formData.name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary/60">Goal:</dt>
                          <dd className="font-medium text-secondary">{formData.theme}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary/60">Posts:</dt>
                          <dd className="font-medium text-secondary">{formData.targetPostCount}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary/60">Frequency:</dt>
                          <dd className="font-medium text-secondary">{formData.frequency.replace('_', '/').replace('x', '×')}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-secondary/60">Language:</dt>
                          <dd className="font-medium text-secondary uppercase">{formData.language}</dd>
                        </div>
                      </dl>
                    </div>

                    {aiBrief && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="text-sm text-secondary/80">
                          <strong>Strategy:</strong> {aiBrief.narrativeArc}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3 Actions */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      variant="outline"
                      className="flex-1"
                      disabled={creating}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={creating}
                    >
                      {creating ? 'Creating Campaign...' : 'Create Campaign'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
