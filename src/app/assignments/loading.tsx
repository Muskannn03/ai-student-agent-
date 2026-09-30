import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function AssignmentsLoading() {
  return (
    <AppShell title="Assignments & Coursework" subtitle="Loading tasks and deadlines...">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <SkeletonPulse className="h-10 w-48 rounded-xl" />
          <SkeletonPulse className="h-10 w-32 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonPulse key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
