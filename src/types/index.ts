// ==========================================
// AI Student Agent Type Definitions
// ==========================================

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type ScheduleType = 'LECTURE' | 'LAB' | 'TUTORIAL' | 'WORKSHOP' | 'EXAM' | 'SEMINAR';
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  major: string;
  semester: number;
  gpa: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor?: string;
  credits: number;
  colorHex: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  dueDate: string; // ISO string
  priority: Priority;
  status: Status;
  courseCode: string;
  courseName: string;
  colorHex?: string;
  score?: number;
  totalPoints?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  keyPoints: string[];
  tags: string[];
  courseCode: string;
  courseName: string;
  updatedAt: string;
}

export interface TimetableItem {
  id: string;
  day: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  courseName: string;
  courseCode: string;
  location: string;
  type: ScheduleType;
  colorHex?: string;
}

export interface StudyPlanTask {
  id: string;
  title: string;
  durationMinutes: number;
  isCompleted: boolean;
  scheduledDate?: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  targetHours: number;
  completedHours: number;
  status: Status;
  tasks: StudyPlanTask[];
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    sources?: string[];
    suggestedFollowups?: string[];
  };
}

export interface DashboardMetrics {
  gpa: number;
  targetGpa: number;
  pendingAssignmentsCount: number;
  completedAssignmentsCount: number;
  weeklyStudyHoursCompleted: number;
  weeklyStudyHoursTarget: number;
  todayClassesCount: number;
  activeCoursesCount: number;
}

export interface SubjectProgress {
  subjectName: string;
  courseCode: string;
  hoursSpent: number;
  targetHours: number;
  completionPercentage: number;
  colorHex: string;
}

export interface DashboardData {
  student: StudentProfile;
  motivationalMessage?: string;
  metrics: DashboardMetrics;
  upcomingAssignments: Assignment[];
  todaySchedule: TimetableItem[];
  recentNotes: Note[];
  studyPlan: StudyPlan;
  subjectProgress?: SubjectProgress[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
