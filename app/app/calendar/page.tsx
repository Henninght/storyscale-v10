import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Calendar View</h1>
        <p className="mt-2 text-secondary/80">
          Visualize your scheduled posts on a calendar timeline.
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-secondary">
          Calendar coming soon
        </h3>
        <p className="mb-6 text-secondary/80">
          Schedule and view your posts in a monthly calendar format.
        </p>
      </div>
    </div>
  );
}
