import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function CareerLoading() {
  return (
    <AppShell title="Career & Internship Hub" subtitle="Loading roadmap and interview resources...">
      <div className="space-y-6">
        <SkeletonPulse className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonPulse className="h-72 rounded-2xl md:col-span-2" />
          <SkeletonPulse className="h-72 rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
