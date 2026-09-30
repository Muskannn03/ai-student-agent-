'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTime } from '@/lib/utils';
import { Clock, MapPin, Calendar, Plus, Trash2 } from 'lucide-react';
import { DayOfWeek, TimetableItem } from '@/types';

const TIMETABLE_STORAGE_KEY = 'aisa_timetable_schedule';

const initialDefaultSchedule: Record<DayOfWeek, TimetableItem[]> = {
  MONDAY: [],
  TUESDAY: [],
  WEDNESDAY: [],
  THURSDAY: [],
  FRIDAY: [],
  SATURDAY: [],
  SUNDAY: [],
};

export default function TimetablePage() {
  const [scheduleData, setScheduleData] = useState<Record<DayOfWeek, TimetableItem[]>>(initialDefaultSchedule);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [isAdding, setIsAdding] = useState(false);

  // New Class Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [classType, setClassType] = useState<'LECTURE' | 'LAB' | 'TUTORIAL' | 'SEMINAR'>('LECTURE');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMETABLE_STORAGE_KEY);
      if (saved) {
        setScheduleData(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSchedule = (updated: Record<DayOfWeek, TimetableItem[]>) => {
    setScheduleData(updated);
    try {
      localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    const newItem: TimetableItem = {
      id: `tt_${Date.now()}`,
      day: selectedDay,
      startTime,
      endTime,
      courseCode: courseCode.trim() || 'CLASS',
      courseName: courseName.trim(),
      location: location.trim() || 'Classroom',
      type: classType,
      colorHex: '#800020',
    };

    const updated = {
      ...scheduleData,
      [selectedDay]: [...(scheduleData[selectedDay] || []), newItem],
    };

    saveSchedule(updated);
    setCourseCode('');
    setCourseName('');
    setLocation('');
    setIsAdding(false);
  };

  const handleDeleteClass = (id: string) => {
    const updated = {
      ...scheduleData,
      [selectedDay]: (scheduleData[selectedDay] || []).filter((item) => item.id !== id),
    };
    saveSchedule(updated);
  };

  const days: Array<{ key: DayOfWeek; label: string }> = [
    { key: 'MONDAY', label: 'Mon' },
    { key: 'TUESDAY', label: 'Tue' },
    { key: 'WEDNESDAY', label: 'Wed' },
    { key: 'THURSDAY', label: 'Thu' },
    { key: 'FRIDAY', label: 'Fri' },
  ];

  const currentItems = scheduleData[selectedDay] || [];

  return (
    <AppShell
      title="Class Timetable"
      subtitle="Weekly schedule, lecture halls, and academic sessions"
    >
      <div className="space-y-6">
        {/* Top Controls & Day Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#EDE1D3] bg-white p-1 shadow-2xs">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => {
                  setSelectedDay(d.key);
                  setIsAdding(false);
                }}
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

          <Button
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1.5 text-xs cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{isAdding ? 'Cancel' : 'Add Class'}</span>
          </Button>
        </div>

        {/* Add Class Form */}
        {isAdding && (
          <Card className="p-5 border border-[#EDE1D3] bg-[#FAF5EE]">
            <form onSubmit={handleAddClass} className="space-y-4">
              <h3 className="text-sm font-semibold text-[#2A1B1E]">
                Add Class for {selectedDay}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#786568] mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. CS301"
                    className="w-full rounded-xl border border-[#EDE1D3] bg-white px-3 py-2 text-xs text-[#2A1B1E] focus:border-[#800020] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#786568] mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Algorithms & Complexity"
                    className="w-full rounded-xl border border-[#EDE1D3] bg-white px-3 py-2 text-xs text-[#2A1B1E] focus:border-[#800020] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#786568] mb-1">
                    Time Window
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-[#EDE1D3] bg-white px-2 py-2 text-xs text-[#2A1B1E] focus:border-[#800020] focus:outline-none"
                    />
                    <span className="text-xs text-[#786568]">-</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-[#EDE1D3] bg-white px-2 py-2 text-xs text-[#2A1B1E] focus:border-[#800020] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#786568] mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Room 302"
                    className="w-full rounded-xl border border-[#EDE1D3] bg-white px-3 py-2 text-xs text-[#2A1B1E] focus:border-[#800020] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs">
                  Save Class
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Timetable Items Display */}
        {currentItems.length === 0 ? (
          <Card className="p-8 text-center border border-[#EDE1D3] bg-white">
            <EmptyState
              icon={Calendar}
              title={`No classes scheduled for ${selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}`}
              description="Keep your week organized. Add your lecture, seminar, or lab sessions."
              actionLabel="Add Class"
              onAction={() => setIsAdding(true)}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 border border-[#EDE1D3] bg-white hover:border-[#D45060]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#FAF5EE] text-[#800020] border border-[#EDE1D3]">
                        {item.courseCode}
                      </span>
                      <h4 className="text-sm font-semibold text-[#2A1B1E]">{item.courseName}</h4>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#786568]">
                      <span>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#9E8B8E]" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant="rose" className="text-[10px] uppercase font-semibold">
                    {item.type}
                  </Badge>
                  <button
                    onClick={() => handleDeleteClass(item.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-[#9E8B8E] hover:text-[#D45060] hover:bg-[#FDF2F3] transition-colors"
                    title="Remove class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
