import React from 'react';
import Link from 'next/link';
import { TimetableItem } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTime, cn } from '@/lib/utils';
import { Clock, MapPin, ArrowRight, Calendar } from 'lucide-react';

interface DailyScheduleProps {
  schedule: TimetableItem[];
}

export function DailySchedule({ schedule }: DailyScheduleProps) {
  if (!schedule || schedule.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <EmptyState
          icon={Calendar}
          title="No classes scheduled for today"
          description="It's a free study day. Use this time to catch up on assignments or project research."
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          <CardTitle>Today's Schedule</CardTitle>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
            {schedule.length} classes
          </span>
        </div>
        <Link
          href="/timetable"
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Full Week <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <div className="space-y-3 flex-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {schedule.map((item) => {
          return (
            <div
              key={item.id}
              className="relative pl-7 group transition-all"
            >
              {/* Timeline indicator dot */}
              <div
                className="absolute left-1.5 top-3 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-slate-950 transition-transform group-hover:scale-125"
                style={{ backgroundColor: item.colorHex || '#6366f1' }}
              />

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 hover:border-slate-700/80 hover:bg-slate-900/70 transition-all">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono font-medium text-indigo-400">
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </span>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      item.type === 'LAB'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    )}
                  >
                    {item.type}
                  </span>
                </div>

                <div className="text-sm font-semibold text-white">
                  {item.courseCode} • {item.courseName}
                </div>

                {item.location && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span>{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
