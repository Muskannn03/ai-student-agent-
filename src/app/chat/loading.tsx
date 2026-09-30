import { AppShell } from '@/components/layout/AppShell';
import { SkeletonPulse } from '@/components/ui/LoadingSpinner';

export default function ChatLoading() {
  return (
    <AppShell title="AI Student Agent Chat" subtitle="Initializing conversational agent session...">
      <div className="flex flex-col h-[calc(100vh-12rem)] rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
        <SkeletonPulse className="h-12 w-full rounded-xl" />
        <div className="flex-1 space-y-4">
          <SkeletonPulse className="h-20 w-3/4 rounded-xl" />
          <SkeletonPulse className="h-24 w-2/3 ml-auto rounded-xl" />
          <SkeletonPulse className="h-28 w-3/4 rounded-xl" />
        </div>
        <SkeletonPulse className="h-14 w-full rounded-xl" />
      </div>
    </AppShell>
  );
}
