// ==========================================
// AI Academic Agent - Core Foundational Types
// ==========================================

export interface AgentContext {
  userId: string;
  studentName?: string;
  userEmail?: string;
  course?: string | null;
  semester?: number | null;
  college?: string | null;
}

export interface AgentTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}

// ------------------------------------------
// Tool: searchNotes
// ------------------------------------------
export interface SearchNotesInput {
  query: string;
  courseId?: string;
}

export interface SearchNotesSource {
  documentId: string;
  documentName: string;
  similarity: number;
  chunkIndex?: number;
}

export interface SearchNotesResultItem {
  content: string;
  source: SearchNotesSource;
}

export interface SearchNotesChunk {
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

export interface SearchNotesOutput {
  query?: string;
  hasResults: boolean;
  totalChunks: number;
  results: SearchNotesResultItem[];
  chunks: SearchNotesChunk[];
}

// ------------------------------------------
// Tool: getAssignments
// ------------------------------------------
export interface GetAssignmentsInput {
  status?: 'pending' | 'completed' | 'overdue' | 'all';
}

export interface AssignmentItemSummary {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  dueDate: string;
  priority: string;
  status: string;
  overdue: boolean;
}

export interface GetAssignmentsOutput {
  total: number;
  assignments: AssignmentItemSummary[];
}

// ------------------------------------------
// Tool: getUpcomingDeadlines
// ------------------------------------------
export interface GetUpcomingDeadlinesInput {
  days?: number;
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  dueDate: string;
  priority: string;
  status: string;
}

export interface GetUpcomingDeadlinesOutput {
  total: number;
  days: number;
  deadlines: UpcomingDeadlineItem[];
}

// ------------------------------------------
// Tool: getStudentProfile
// ------------------------------------------
export interface GetStudentProfileInput {
  // Empty input; student userId is securely provided by AgentContext
}

export interface StudentProfileData {
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
}

export interface GetStudentProfileOutput {
  found: boolean;
  profile: StudentProfileData | null;
  message?: string;
}

// ------------------------------------------
// Tool: createStudyPlan
// ------------------------------------------
export interface CreateStudyPlanInput {
  days?: number;
  focus?: string;
}

export interface StudyPlanPriorityItem {
  id?: string;
  title: string;
  subject?: string | null;
  dueDate?: string;
  priority?: string;
  status?: string;
  isOverdue?: boolean;
}

export interface StudyPlanDeadlineItem {
  id?: string;
  title: string;
  subject?: string | null;
  dueDate: string;
}

export interface StudyPlanDay {
  day: number;
  date: string;
  focusTopic: string;
  suggestedTasks: string[];
}

export interface StudyPlanNoteContext {
  documentTitle: string;
  snippet: string;
}

export interface CreateStudyPlanOutput {
  success: boolean;
  days: number;
  focus?: string;
  student: {
    name: string;
    course?: string | null;
    semester?: number | null;
  };
  priorities: StudyPlanPriorityItem[];
  upcomingDeadlines: StudyPlanDeadlineItem[];
  schedule: StudyPlanDay[];
  relevantNotes?: StudyPlanNoteContext[];
  hasRealDatabaseAssignments: boolean;
  notesContextAvailable: boolean;
  message?: string;
}

// ------------------------------------------
// Agent Execution & Loop Types
// ------------------------------------------
export interface ToolCallExecutionSummary {
  name: string;
  arguments: Record<string, any>;
  durationMs: number;
  success: boolean;
  resultSummary?: string;
}

export interface AgentChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface AgentProgressEvent {
  type: 'status' | 'tool_call' | 'chunk' | 'done';
  status?: string;
  tool?: string;
  chunk?: string;
}

export type AgentProgressCallback = (event: AgentProgressEvent) => void;

export interface AgentInput {
  userMessage: string;
  history?: AgentChatMessage[];
  context: AgentContext;
  onProgress?: AgentProgressCallback;
}

export interface AgentSourceCitation {
  documentId: string;
  documentName: string;
  similarity?: number;
  chunkIndex?: number;
  pageNumber?: number | null;
}

export interface AgentOutput {
  message: string;
  toolCallsExecuted: ToolCallExecutionSummary[];
  model: string;
  iterations: number;
  isSimulated?: boolean;
  sources?: AgentSourceCitation[];
}
