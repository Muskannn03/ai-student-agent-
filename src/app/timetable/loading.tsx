import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function TimetableLoading() {
  return (
    <AppShell title="Class Timetable" subtitle="Loading weekly schedule...">
      <div className="space-y-6">
        <SkeletonPulse className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonPulse key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
