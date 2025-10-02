'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';

interface Draft {
  id: string;
  content: string;
  status: DraftStatus;
  scheduledDate: Date | null;
}

const statusColors: Record<DraftStatus, string> = {
  idea: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  ready_to_post: 'bg-green-500',
  posted: 'bg-amber-500',
  archived: 'bg-gray-400',
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push('/login');
        return;
      }

      const db = getFirestore();
      const draftsRef = collection(db, 'drafts');
      const q = query(draftsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const draftsData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content || '',
            status: data.status || 'idea',
            scheduledDate: data.scheduledDate?.toDate() || null,
          };
        })
        .filter((draft) => draft.scheduledDate !== null);

      setDrafts(draftsData);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getDraftsForDate = (date: Date) => {
    return drafts.filter((draft) => {
      if (!draft.scheduledDate) return false;
      return (
        draft.scheduledDate.getDate() === date.getDate() &&
        draft.scheduledDate.getMonth() === date.getMonth() &&
        draft.scheduledDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const handleDraftClick = (draftId: string) => {
    router.push(`/app/drafts/${draftId}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-secondary/60">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary">Calendar View</h1>
        <p className="mt-2 text-secondary/80">
          Visualize your scheduled posts on a calendar timeline.
        </p>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between rounded-2xl border border-secondary/10 bg-white p-4">
        <Button onClick={previousMonth} variant="outline" size="sm" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <h2 className="text-xl font-semibold text-secondary">
          {monthName} {year}
        </h2>
        <Button onClick={nextMonth} variant="outline" size="sm" className="gap-2">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        {/* Day Headers */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-secondary/60">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before first day of month */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const dayDrafts = getDraftsForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();
            const isSelected =
              selectedDate && date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-lg border p-2 transition-all hover:border-primary hover:bg-primary/5 ${
                  isToday
                    ? 'border-primary bg-primary/10'
                    : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-secondary/10'
                }`}
              >
                <div className="flex h-full flex-col">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {day}
                  </span>
                  {dayDrafts.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dayDrafts.slice(0, 3).map((draft) => (
                        <div
                          key={draft.id}
                          className={`h-2 w-2 rounded-full ${statusColors[draft.status]}`}
                          title={draft.content.slice(0, 50)}
                        />
                      ))}
                      {dayDrafts.length > 3 && (
                        <span className="text-xs text-secondary/60">
                          +{dayDrafts.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="rounded-2xl border border-secondary/10 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-secondary">
            {selectedDate.toLocaleDateString('default', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>

          {getDraftsForDate(selectedDate).length === 0 ? (
            <p className="text-secondary/60">No posts scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {getDraftsForDate(selectedDate).map((draft) => {
                const preview =
                  draft.content.length > 100
                    ? `${draft.content.slice(0, 100)}...`
                    : draft.content;

                return (
                  <button
                    key={draft.id}
                    onClick={() => handleDraftClick(draft.id)}
                    className="w-full rounded-lg border border-secondary/10 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${statusColors[draft.status]}`} />
                      <span className="text-sm font-medium capitalize text-secondary/60">
                        {draft.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-secondary">{preview}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-secondary">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${color}`} />
              <span className="text-sm capitalize text-secondary/60">
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
