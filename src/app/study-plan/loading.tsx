import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function StudyPlanLoading() {
  return (
    <AppShell title="AI Study Plan" subtitle="Generating your weekly milestones...">
      <div className="space-y-6">
        <SkeletonPulse className="h-28 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonPulse className="h-64 rounded-2xl md:col-span-2" />
          <SkeletonPulse className="h-64 rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
