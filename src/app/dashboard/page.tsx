'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { TodaysOverview } from '@/components/dashboard/TodaysOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AIAssistantCard } from '@/components/dashboard/AIAssistantCard';
import { UpcomingAssignments } from '@/components/dashboard/UpcomingAssignments';
import { StudyProgress } from '@/components/dashboard/StudyProgress';
import { DailySchedule } from '@/components/dashboard/DailySchedule';
import { AddAssignmentModal } from '@/components/dashboard/AddAssignmentModal';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { mockDashboardData } from '@/lib/mock-data';
import { DashboardData, Assignment, Status } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(mockDashboardData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.warn('Dashboard live sync using fallback:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleAssignmentStatus = (id: string) => {
    setData((prev) => {
      const updatedAssignments: Assignment[] = prev.upcomingAssignments.map((a) => {
        if (a.id === id) {
          const nextStatus: Status = a.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...a, status: nextStatus };
        }
        return a;
      });

      const pendingCount = updatedAssignments.filter((a) => a.status !== 'COMPLETED').length;

      return {
        ...prev,
        upcomingAssignments: updatedAssignments,
        metrics: {
          ...prev.metrics,
          pendingAssignmentsCount: pendingCount,
          completedAssignmentsCount: updatedAssignments.length - pendingCount,
        },
      };
    });
  };

  const handleAddAssignment = (newAssignment: Assignment) => {
    setData((prev) => ({
      ...prev,
      upcomingAssignments: [newAssignment, ...prev.upcomingAssignments],
      metrics: {
        ...prev.metrics,
        pendingAssignmentsCount: prev.metrics.pendingAssignmentsCount + 1,
      },
    }));
  };

  const handleToggleSprintTask = (taskId: string) => {
    setData((prev) => {
      const updatedTasks = prev.studyPlan.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, isCompleted: !t.isCompleted };
        }
        return t;
      });

      return {
        ...prev,
        studyPlan: {
          ...prev.studyPlan,
          tasks: updatedTasks,
        },
      };
    });
  };

  const { student, metrics, upcomingAssignments, todaySchedule, studyPlan, subjectProgress, motivationalMessage } = data;

  return (
    <AppShell
      title="Student Academic Dashboard"
      subtitle={`${student.major} • Semester ${student.semester}`}
    >
      <div className="space-y-7 pb-10">
        {error && (
          <ErrorAlert
            title="Notice"
            message={error}
            onRetry={fetchDashboardData}
          />
        )}

        {/* 1. Welcome Section */}
        <WelcomeSection
          student={student}
          motivationalMessage={motivationalMessage}
          streakDays={5}
        />

        {/* 2. Today's Overview */}
        <TodaysOverview
          classesCount={todaySchedule.length}
          assignmentsDueCount={metrics.pendingAssignmentsCount}
          studyHoursLogged={metrics.weeklyStudyHoursCompleted}
          studyHoursTarget={metrics.weeklyStudyHoursTarget}
          pendingTasksCount={metrics.pendingAssignmentsCount}
        />

        {/* 3. Quick Actions */}
        <QuickActions
          onOpenAddAssignmentModal={() => setIsAddModalOpen(true)}
          onOpenUploadNotesModal={() => window.location.href = '/notes'}
        />

        {/* 4. AI Assistant Card */}
        <AIAssistantCard />

        {/* 5. Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols on lg): Upcoming Assignments & Study Progress */}
          <div className="space-y-6 lg:col-span-2">
            <UpcomingAssignments
              assignments={upcomingAssignments}
              onToggleStatus={handleToggleAssignmentStatus}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />

            <StudyProgress
              studyPlan={studyPlan}
              subjectProgress={subjectProgress}
              onToggleTask={handleToggleSprintTask}
            />
          </div>

          {/* Right Column (1 Col on lg): Daily Schedule Timeline */}
          <div className="space-y-6">
            <DailySchedule schedule={todaySchedule} />
          </div>
        </div>

        {/* Add Assignment Modal */}
        <AddAssignmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddAssignment={handleAddAssignment}
        />
      </div>
    </AppShell>
  );
}
