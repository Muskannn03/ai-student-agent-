import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <AppShell title="Student Dashboard" subtitle="Loading your academic hub...">
      <div className="space-y-6">
        {/* Quick action skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonPulse key={i} className="h-16 rounded-2xl" />
          ))}
        </div>

        {/* AI Prompt card skeleton */}
        <SkeletonPulse className="h-36 rounded-2xl" />

        {/* Stats Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonPulse key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        {/* Main Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonPulse className="h-80 lg:col-span-2 rounded-2xl" />
          <SkeletonPulse className="h-80 rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
