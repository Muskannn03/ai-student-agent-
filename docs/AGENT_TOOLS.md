# Agent Tools Specification & Implementation Guide

The **AI Student Agent** registers exactly **5 core tools** within `src/lib/agent/toolRegistry.ts`. Every tool implements the generic `AgentTool<TInput, TOutput>` interface, receives an authenticated `AgentContext`, and executes server-side with strict input validation.

---

## 1. `searchNotes`

### Purpose
Performs semantic vector retrieval across the student's personal course notes and lecture slides in PostgreSQL using cosine similarity over `nomic-embed-text` embeddings.

### Input Schema
```typescript
interface SearchNotesInput {
  query: string;           // Semantic question or search topic (max 500 chars)
  courseId?: string;       // Optional subject or course code filter (e.g. "CS301")
}
```

### Output Schema
```typescript
interface SearchNotesOutput {
  hasResults: boolean;
  totalResults: number;
  results: Array<{
    content: string;
    source: {
      documentId: string;
      documentName: string;
      similarity: number;
      chunkIndex: number;
    };
  }>;
  chunks: Array<{
    documentId: string;
    documentTitle: string;
    content: string;
    similarity: number;
  }>;
}
```

### Trigger Examples
- *"Explain Timsort using my uploaded notes."*
- *"What does my CS301 syllabus say about the midterm?"*
- *"Search my notes for Dijkstra's invariant."*
- *"Look up binary search in my lecture notes."*

### Security & Isolation
- **Authentication**: Evaluates `where: { userId: context.userId }`.
- **Injection Safety**: Text inside retrieved chunks is isolated within the tool message payload and cannot override system prompts.
- **Client Sanitization**: Does not accept `userId` from model or client arguments.

---

## 2. `getAssignments`

### Purpose
Queries coursework, problem sets, and homework deliverables from PostgreSQL. Provides status filtering and dynamic overdue detection based on current server timestamp.

### Input Schema
```typescript
interface GetAssignmentsInput {
  status?: 'pending' | 'completed' | 'overdue' | 'all'; // Defaults to "all"
}
```

### Output Schema
```typescript
interface GetAssignmentsOutput {
  total: number;
  status: string;
  assignments: Array<{
    id: string;
    title: string;
    description: string | null;
    subject: string | null;
    dueDate: string;         // ISO date string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    isOverdue: boolean;      // Calculated at runtime: dueDate < now && status != COMPLETED
  }>;
  summary: {
    pending: number;
    completed: number;
    overdue: number;
  };
}
```

### Trigger Examples
- *"What assignments do I have?"*
- *"Show my pending assignments."*
- *"Do I have any overdue tasks?"*
- *"What assignments are completed?"*

### Security & Isolation
- **Authentication**: Enforces `where: { userId: context.userId }`.
- **Dynamic Overdue**: Overdue is computed using server-side `now = new Date()`, preventing client time-skew exploits.

---

## 3. `getUpcomingDeadlines`

### Purpose
Retrieves upcoming, non-completed assignments due within a specified forward-looking day window $[now, now + days]$.

### Input Schema
```typescript
interface GetUpcomingDeadlinesInput {
  days?: number; // Integer between 1 and 30. Defaults to 7.
}
```

### Output Schema
```typescript
interface GetUpcomingDeadlinesOutput {
  count: number;
  daysWindow: number;
  deadlines: Array<{
    id: string;
    title: string;
    subject: string | null;
    dueDate: string;
    priority: string;
    daysRemaining: number;
  }>;
}
```

### Trigger Examples
- *"What deadlines do I have this week?"* (triggers `days: 7`)
- *"What is due in the next 3 days?"* (triggers `days: 3`)
- *"Show me my upcoming deadlines."* (triggers `days: 7`)
- *"What do I need to submit before Monday?"*

### Security & Isolation
- **Authentication**: Restricted to `context.userId`.
- **Exclusion Rules**: Automatically filters out assignments that are already completed (`status: { not: Status.COMPLETED }`) or already past-due (`dueDate: { gte: now }`), keeping the student focused solely on active deliverables.

---

## 4. `getStudentProfile`

### Purpose
Retrieves verified student enrollment records, enrolled course/degree, department, current semester, and technical skills from PostgreSQL.

### Input Schema
```typescript
interface GetStudentProfileInput {
  // Empty object. Intentionally ignores any arguments passed by the model.
}
```

### Output Schema
```typescript
interface GetStudentProfileOutput {
  found: boolean;
  profile: {
    id: string;
    studentId: string;
    name: string;
    email: string;
    college: string | null;
    department: string | null;
    course: string | null;
    semester: number | null;
    skills: string[];
    careerGoals: string | null;
  } | null;
}
```

### Trigger Examples
- *"Tell me about myself."*
- *"What course am I enrolled in?"*
- *"What semester am I in?"*
- *"Show me my academic profile and skills."*

### Security & Isolation
- **Argument Immunity**: Runtime validator drops any client-provided fields to eliminate parameter-tampering attacks.
- **Field Whitelist**: Explicitly queries fields via Prisma `select`. Password hashes, authorization tokens, and internal database records are never selected or returned.

---

## 5. `createStudyPlan`

### Purpose
Generates a structured, multi-day academic revision timetable tailored to the student. Intelligently integrates upcoming deadlines from PostgreSQL, overdue priorities, and optional RAG course note summaries.

### Input Schema
```typescript
interface CreateStudyPlanInput {
  days?: number;   // Integer between 1 and 30. Defaults to 7.
  focus?: string;  // Optional topic or course focus (max 200 chars, e.g. "Timsort")
}
```

### Output Schema
```typescript
interface CreateStudyPlanOutput {
  days: number;
  focusTopic?: string;
  studentName: string;
  course: string;
  priorities: Array<{
    id: string;
    title: string;
    subject: string | null;
    dueDate: string;
    priority: string;
    isOverdue: boolean;
  }>;
  schedule: Array<{
    dayNumber: number;
    date: string;
    deadlinesDue: Array<{ title: string; subject: string | null }>;
    recommendedTasks: Array<{ task: string; durationMinutes: number }>;
  }>;
  relevantNotes?: Array<{
    documentTitle: string;
    snippet: string;
  }>;
}
```

### Trigger Examples
- *"Create a 7-day study plan."*
- *"Create a 3-day study plan focused on Timsort."*
- *"Make me a study plan for the next 5 days."*
- *"Help me build a study schedule for my upcoming exam."*

### Security & Isolation
- **Authentication**: Binds profile, assignment, and vector queries to `context.userId`.
- **RAG Scoping**: When a `focus` parameter is supplied, vector search retrieves notes belonging strictly to the authenticated student (`retrieveRelevantChunks({ query: focus, userId })`).
- **Grounded Distinction**: Explicitly flags real database deadlines versus generated study recommendations to prevent students from confusing generated suggestions with official coursework.
