'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatTime } from '@/lib/utils';
import { Clock, MapPin, Calendar, BookOpen, Download } from 'lucide-react';
import { DayOfWeek, TimetableItem } from '@/types';

const weeklyScheduleData: Record<DayOfWeek, TimetableItem[]> = {
  MONDAY: [
    { id: 'm1', day: 'MONDAY', startTime: '09:00', endTime: '10:30', courseName: 'Algorithms & Complexity', courseCode: 'CS301', location: 'Turing Hall 302', type: 'LECTURE', colorHex: '#7FA99B' },
    { id: 'm2', day: 'MONDAY', startTime: '11:00', endTime: '12:30', courseName: 'Deep Learning Lab', courseCode: 'AI402', location: 'Ada Lovelace Lab B', type: 'LAB', colorHex: '#D48D8D' },
    { id: 'm3', day: 'MONDAY', startTime: '14:00', endTime: '15:15', courseName: 'Database Systems & SQL', courseCode: 'DS205', location: 'Science Complex 114', type: 'LECTURE', colorHex: '#8CAECC' },
  ],
  TUESDAY: [
    { id: 't1', day: 'TUESDAY', startTime: '10:00', endTime: '11:30', courseName: 'Linear Algebra & Optimization', courseCode: 'MATH210', location: 'Euler Hall 101', type: 'LECTURE', colorHex: '#E0B36E' },
    { id: 't2', day: 'TUESDAY', startTime: '13:00', endTime: '14:30', courseName: 'Technical Communications', courseCode: 'ENG104', location: 'Humanities 204', type: 'TUTORIAL', colorHex: '#9B8EB8' },
  ],
  WEDNESDAY: [
    { id: 'w1', day: 'WEDNESDAY', startTime: '09:00', endTime: '10:30', courseName: 'Algorithms & Complexity', courseCode: 'CS301', location: 'Turing Hall 302', type: 'LECTURE', colorHex: '#7FA99B' },
    { id: 'w2', day: 'WEDNESDAY', startTime: '14:00', endTime: '16:00', courseName: 'Database SQL Benchmarking Lab', courseCode: 'DS205', location: 'Science Complex 114', type: 'LAB', colorHex: '#8CAECC' },
  ],
  THURSDAY: [
    { id: 'th1', day: 'THURSDAY', startTime: '10:00', endTime: '11:30', courseName: 'Linear Algebra & Optimization', courseCode: 'MATH210', location: 'Euler Hall 101', type: 'LECTURE', colorHex: '#E0B36E' },
    { id: 'th2', day: 'THURSDAY', startTime: '12:00', endTime: '13:30', courseName: 'Deep Learning & Neural Nets', courseCode: 'AI402', location: 'Ada Lovelace Center A', type: 'LECTURE', colorHex: '#D48D8D' },
  ],
  FRIDAY: [
    { id: 'f1', day: 'FRIDAY', startTime: '11:00', endTime: '12:30', courseName: 'AI Seminar & Paper Discussion', courseCode: 'AI402', location: 'Auditorium C', type: 'SEMINAR', colorHex: '#D48D8D' },
  ],
  SATURDAY: [],
  SUNDAY: [],
};

export default function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');

  const days: Array<{ key: DayOfWeek; label: string }> = [
    { key: 'MONDAY', label: 'Mon' },
    { key: 'TUESDAY', label: 'Tue' },
    { key: 'WEDNESDAY', label: 'Wed' },
    { key: 'THURSDAY', label: 'Thu' },
    { key: 'FRIDAY', label: 'Fri' },
  ];

  return (
    <AppShell
      title="Class Timetable"
      subtitle="Weekly schedule, lecture halls, lab sessions, and academic calendar"
    >
      <div className="space-y-6">
        {/* Top Controls & Day Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#EDE1D3] bg-white p-1 shadow-2xs">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedDay === d.key
                    ? 'bg-[#F3E6D5] text-[#5C0017] font-semibold border border-[#E8D9C8]'
                    : 'text-[#786568] hover:text-[#2A1B1E]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                alert('iCal calendar sync file ready for export.');
              }}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export .ics
            </Button>
          </div>
        </div>

        {/* Weekly Grid (Desktop: 5 Columns) */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4">
          {days.map((d) => {
            const classes = weeklyScheduleData[d.key];
            const isToday = d.key === 'MONDAY';

            return (
              <div key={d.key} className="space-y-3">
                <div
                  className={`flex items-center justify-between rounded-2xl border p-3 shadow-2xs ${
                    isToday
                      ? 'border-[#F8CCD2] bg-[#FBECEF] text-[#800020]'
                      : 'border-[#EDE1D3] bg-white text-[#2A1B1E]'
                  }`}
                >
                  <span className="text-sm font-semibold">{d.label}</span>
                  <Badge variant={isToday ? 'burgundy' : 'cream'} className="text-[10px] py-0">
                    {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {classes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#EDE1D3] p-6 text-center text-xs text-[#9E8B8E]">
                      No classes
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="rounded-2xl border border-[#EDE1D3] bg-white p-3.5 hover:border-[#D45060]/40 transition-all space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className="font-semibold px-2 py-0.5 rounded-md text-[10px]"
                            style={{
                              backgroundColor: '#FBECEF',
                              color: '#800020',
                              border: '1px solid #F8CCD2',
                            }}
                          >
                            {cls.courseCode}
                          </span>
                          <span className="text-[#800020] font-mono text-[10px]">
                            {formatTime(cls.startTime)}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#2A1B1E] leading-snug">
                          {cls.courseName}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-[#786568]">
                          <MapPin className="h-3 w-3 text-[#9E8B8E] shrink-0" />
                          <span className="truncate">{cls.location}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile / Tablet Day Detail View */}
        <div className="lg:hidden space-y-3">
          <h3 className="text-sm font-semibold text-[#2A1B1E] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#800020]" />
            {selectedDay} Schedule
          </h3>

          {weeklyScheduleData[selectedDay].length === 0 ? (
            <Card className="text-center py-8 text-sm text-[#786568]">
              No classes scheduled for {selectedDay}.
            </Card>
          ) : (
            weeklyScheduleData[selectedDay].map((cls) => (
              <Card key={cls.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="font-semibold px-2 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: '#FBECEF',
                      color: '#800020',
                      border: '1px solid #F8CCD2',
                    }}
                  >
                    {cls.courseCode}
                  </span>
                  <span className="text-[#800020] font-mono font-medium">
                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#2A1B1E]">{cls.courseName}</h4>
                <div className="flex items-center gap-1.5 text-xs text-[#786568]">
                  <MapPin className="h-3.5 w-3.5 text-[#9E8B8E]" />
                  <span>{cls.location}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
