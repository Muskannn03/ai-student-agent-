// ==========================================
// AI Academic Agent - Core Types
// Strongly typed contracts for tools, context, and execution
// ==========================================

export interface AgentContext {
  userId: string;
  userEmail?: string;
  studentName?: string;
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
// Tool 1: searchNotes
// ------------------------------------------
export interface SearchNotesInput {
  query: string;
  courseId?: string;
}

export interface SearchNotesChunk {
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
  fileName?: string;
  chunkIndex?: number;
}

export interface SearchNotesOutput {
  chunks: SearchNotesChunk[];
}

// ------------------------------------------
// Tool 2: getAssignments
// ------------------------------------------
export interface GetAssignmentsInput {
  status?: 'pending' | 'completed' | 'overdue' | 'all';
}

export interface AssignmentItemSummary {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  dueDate: string;
  status: string;
  priority: string;
  isOverdue: boolean;
}

export interface GetAssignmentsOutput {
  total: number;
  assignments: AssignmentItemSummary[];
}

// ------------------------------------------
// Tool 3: getUpcomingDeadlines
// ------------------------------------------
export interface GetUpcomingDeadlinesInput {
  days?: number;
}

export interface DeadlineItemSummary {
  id: string;
  title: string;
  subject: string | null;
  dueDate: string;
  daysRemaining: number;
  priority: string;
  status: string;
}

export interface GetUpcomingDeadlinesOutput {
  daysLookahead: number;
  total: number;
  deadlines: DeadlineItemSummary[];
}

// ------------------------------------------
// Tool 4: getStudentProfile
// ------------------------------------------
export interface GetStudentProfileInput {
  // No required input parameters
}

export interface GetStudentProfileOutput {
  name: string;
  email: string;
  college: string | null;
  course: string | null;
  semester: number | null;
  skills: string[];
  careerGoals: string | null;
}

// ------------------------------------------
// Tool 5: createStudyPlan
// ------------------------------------------
export interface CreateStudyPlanInput {
  subject: string;
  date?: string;
  durationMinutes?: number;
  topics?: string[];
}

export interface StudyPlanSessionSummary {
  id: string;
  subject: string;
  date: string;
  durationMinutes: number;
  topic: string;
  status: string;
}

export interface CreateStudyPlanOutput {
  success: boolean;
  message: string;
  plan: StudyPlanSessionSummary;
}

// ------------------------------------------
// Agent Loop Execution Types
// ------------------------------------------
export interface ToolCallExecutionSummary {
  name: string;
  arguments: Record<string, any>;
  durationMs: number;
  success: boolean;
  resultSummary?: string;
}

export interface AgentChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentInput {
  userMessage: string;
  history?: AgentChatMessage[];
  context: AgentContext;
}

export interface AgentOutput {
  message: string;
  toolCallsExecuted: ToolCallExecutionSummary[];
  model: string;
  isSimulated: boolean;
  iterations: number;
}
