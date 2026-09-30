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
            <Clock className="h-5 w-5 text-[#7FA99B]" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <EmptyState
          icon={Calendar}
          title="No classes scheduled for today"
          description="Your schedule is clear for today."
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">Today's Schedule</CardTitle>
            <p className="text-xs text-[#786568]">{schedule.length} sessions planned</p>
          </div>
        </div>
        <Link
          href="/timetable"
          className="flex items-center gap-1 text-xs font-medium text-[#5C4549] hover:text-[#800020] transition-colors"
        >
          Full Week <ArrowRight className="h-3.5 w-3.5 text-[#800020]" />
        </Link>
      </CardHeader>

      <div className="space-y-3 flex-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EDE1D3]">
        {schedule.map((item) => {
          return (
            <div
              key={item.id}
              className="relative pl-7 group transition-all"
            >
              {/* Timeline indicator dot */}
              <div
                className="absolute left-1.5 top-3.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white transition-transform group-hover:scale-110 shadow-2xs"
                style={{ backgroundColor: '#800020' }}
              />

              <div className="rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE]/40 p-3.5 hover:border-[#D45060]/40 hover:bg-white transition-all shadow-2xs">
                <div className="flex items-center justify-between text-xs text-[#786568] mb-1">
                  <span className="font-mono font-medium text-[#800020]">
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </span>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      item.type === 'LAB'
                        ? 'bg-[#FDF2F3] text-[#D45060] border border-[#F8CCD2]'
                        : 'bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]'
                    )}
                  >
                    {item.type}
                  </span>
                </div>

                <div className="text-sm font-semibold text-[#2A1B1E]">
                  {item.courseCode} • {item.courseName}
                </div>

                {item.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#786568]">
                    <MapPin className="h-3 w-3 text-[#9E8B8E]" />
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
