import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function NotesLoading() {
  return (
    <AppShell title="Notes & AI Summaries" subtitle="Fetching lecture notes...">
      <div className="space-y-6">
        <SkeletonPulse className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonPulse key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
