import { DashboardData, Course, Assignment, Note, TimetableItem, StudyPlan, StudentProfile } from '@/types';

export const mockStudent: StudentProfile = {
  id: 'std_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  major: 'Computer Science & AI',
  semester: 4,
  gpa: 3.84,
};

export const mockCourses: Course[] = [
  { id: 'c1', code: 'CS301', name: 'Algorithms & Complexity', instructor: 'Dr. Evelyn Foster', credits: 4, colorHex: '#6366f1' },
  { id: 'c2', code: 'AI402', name: 'Deep Learning & Neural Nets', instructor: 'Prof. David Chen', credits: 3, colorHex: '#ec4899' },
  { id: 'c3', code: 'DS205', name: 'Database Systems & SQL', instructor: 'Dr. Sarah Jenkins', credits: 3, colorHex: '#14b8a6' },
  { id: 'c4', code: 'MATH210', name: 'Linear Algebra & Optimization', instructor: 'Prof. Marcus Bell', credits: 4, colorHex: '#f59e0b' },
  { id: 'c5', code: 'ENG104', name: 'Technical Communications', instructor: 'Elena Ross', credits: 2, colorHex: '#8b5cf6' },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'as_1',
    title: 'Dynamic Programming & Graph Theory Problem Set',
    description: 'Solve Bellman-Ford optimization and longest common subsequence proofs with code implementation.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(), // ~1 day
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    courseCode: 'CS301',
    courseName: 'Algorithms & Complexity',
    colorHex: '#6366f1',
    score: undefined,
    totalPoints: 100,
  },
  {
    id: 'as_2',
    title: 'Convolutional Neural Network Architecture Report',
    description: 'Implement ResNet-18 benchmark on CIFAR-10 and write 4-page analysis on loss landscape.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), // ~3 days
    priority: 'HIGH',
    status: 'PENDING',
    courseCode: 'AI402',
    courseName: 'Deep Learning & Neural Nets',
    colorHex: '#ec4899',
    totalPoints: 150,
  },
  {
    id: 'as_3',
    title: 'Relational Schema Normalization & Query Tuning',
    description: 'Convert BCNF tables to 3NF where appropriate and optimize indexed PostgreSQL queries.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(), // 5 days
    priority: 'MEDIUM',
    status: 'PENDING',
    courseCode: 'DS205',
    courseName: 'Database Systems & SQL',
    colorHex: '#14b8a6',
    totalPoints: 80,
  },
  {
    id: 'as_4',
    title: 'Eigenvalues & SVD Decomposition Lab',
    description: 'Analyze principal component analysis projection on high-dimensional vectors.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 168).toISOString(), // 7 days
    priority: 'LOW',
    status: 'COMPLETED',
    courseCode: 'MATH210',
    courseName: 'Linear Algebra & Optimization',
    colorHex: '#f59e0b',
    score: 95,
    totalPoints: 100,
  },
];

export const mockTodaySchedule: TimetableItem[] = [
  {
    id: 'tt_1',
    day: 'MONDAY',
    startTime: '09:00',
    endTime: '10:30',
    courseName: 'Algorithms & Complexity',
    courseCode: 'CS301',
    location: 'Turing Hall 302',
    type: 'LECTURE',
    colorHex: '#6366f1',
  },
  {
    id: 'tt_2',
    day: 'MONDAY',
    startTime: '11:00',
    endTime: '12:30',
    courseName: 'Deep Learning Lab',
    courseCode: 'AI402',
    location: 'Ada Lovelace AI Center B',
    type: 'LAB',
    colorHex: '#ec4899',
  },
  {
    id: 'tt_3',
    day: 'MONDAY',
    startTime: '14:00',
    endTime: '15:15',
    courseName: 'Database Systems & SQL',
    courseCode: 'DS205',
    location: 'Science Complex 114',
    type: 'LECTURE',
    colorHex: '#14b8a6',
  },
];

export const mockNotes: Note[] = [
  {
    id: 'n_1',
    title: 'Bellman-Ford vs Dijkstra Complexity Tradeoffs',
    content: 'Dijkstra operates in O(E + V log V) with Min-Heap but cannot handle negative edge weights. Bellman-Ford runs in O(V*E) and detects negative weight cycles.',
    summary: 'Core comparison between shortest-path algorithms and conditions for negative cycle detection.',
    keyPoints: [
      'Dijkstra requires all edge weights >= 0',
      'Bellman-Ford relaxes all edges |V| - 1 times',
      'SPFA (Shortest Path Faster Algorithm) is an optimized FIFO queue variation',
    ],
    tags: ['Algorithms', 'Graphs', 'Exam Prep'],
    courseCode: 'CS301',
    courseName: 'Algorithms & Complexity',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n_2',
    title: 'Backpropagation and Computational Graphs',
    content: 'Reverse-mode automatic differentiation computes gradients through the chain rule in a single backward pass, with time complexity proportional to forward pass.',
    summary: 'Mechanism of reverse-mode automatic differentiation in deep learning frameworks.',
    keyPoints: [
      'Forward pass caches intermediate activations',
      'Backward pass computes Jacobians via chain rule',
      'Memory consumption scales linearly with depth without checkpointing',
    ],
    tags: ['AI', 'Calculus', 'Neural Networks'],
    courseCode: 'AI402',
    courseName: 'Deep Learning & Neural Nets',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export const mockStudyPlan: StudyPlan = {
  id: 'sp_1',
  title: 'Midterm Prep: Algorithms & Deep Learning Sprint',
  description: 'Structured 5-day focus on dynamic programming review and CNN architecture tuning.',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  targetHours: 18,
  completedHours: 12.5,
  status: 'IN_PROGRESS',
  tasks: [
    { id: 'spt_1', title: 'Review Floyd-Warshall and Bellman-Ford proofs', durationMinutes: 60, isCompleted: true },
    { id: 'spt_2', title: 'Implement CNN forward pass from scratch in PyTorch', durationMinutes: 90, isCompleted: true },
    { id: 'spt_3', title: 'Solve 4 LeetCode Hard graph problems', durationMinutes: 120, isCompleted: false },
    { id: 'spt_4', title: 'Database indexing EXPLAIN ANALYZE benchmarks', durationMinutes: 45, isCompleted: false },
  ],
};

export const mockMotivationalMessage =
  "Focus on deep work today — mastering dynamic programming and graph proofs will pay compounding dividends for your upcoming midterms. You're making tremendous progress!";

export const mockSubjectProgress = [
  {
    subjectName: 'Algorithms & Complexity',
    courseCode: 'CS301',
    hoursSpent: 5.5,
    targetHours: 6.0,
    completionPercentage: 92,
    colorHex: '#6366f1',
  },
  {
    subjectName: 'Deep Learning & Neural Nets',
    courseCode: 'AI402',
    hoursSpent: 4.0,
    targetHours: 5.0,
    completionPercentage: 80,
    colorHex: '#ec4899',
  },
  {
    subjectName: 'Database Systems & SQL',
    courseCode: 'DS205',
    hoursSpent: 3.0,
    targetHours: 4.0,
    completionPercentage: 75,
    colorHex: '#14b8a6',
  },
  {
    subjectName: 'Linear Algebra & Optimization',
    courseCode: 'MATH210',
    hoursSpent: 2.0,
    targetHours: 3.0,
    completionPercentage: 67,
    colorHex: '#f59e0b',
  },
];

export const mockDashboardData: DashboardData = {
  student: mockStudent,
  motivationalMessage: mockMotivationalMessage,
  metrics: {
    gpa: 3.84,
    targetGpa: 3.9,
    pendingAssignmentsCount: 3,
    completedAssignmentsCount: 14,
    weeklyStudyHoursCompleted: 14.5,
    weeklyStudyHoursTarget: 18,
    todayClassesCount: 3,
    activeCoursesCount: 5,
  },
  upcomingAssignments: mockAssignments,
  todaySchedule: mockTodaySchedule,
  recentNotes: mockNotes,
  studyPlan: mockStudyPlan,
  subjectProgress: mockSubjectProgress,
};
