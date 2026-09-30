// ==========================================
// AI Agent Modular Architecture Types
// (Prepared for future Multi-Agent, Tools, Memory & RAG)
// ==========================================

export type AgentRole =
  | 'academic_tutor'
  | 'study_planner'
  | 'assignment_advisor'
  | 'career_coach'
  | 'research_assistant';

export interface AgentContext {
  studentId: string;
  currentCourse?: string;
  recentNotes?: string[];
  upcomingDeadlines?: string[];
}

export interface AgentMemoryItem {
  key: string;
  value: string;
  category: 'preference' | 'weak_topic' | 'strong_topic' | 'academic_goal';
  confidence: number;
  timestamp: string;
}

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  sourceType: 'lecture_note' | 'syllabus' | 'textbook' | 'assignment';
  courseCode?: string;
  embeddingId?: string;
}

export interface AgentToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: AgentToolParam[];
  execute: (args: Record<string, unknown>, context?: AgentContext) => Promise<{ success: boolean; result: unknown; error?: string }>;
}

export interface AgentExecutionStep {
  stepNumber: number;
  thought: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  observation?: unknown;
}

export interface AgentExecutionResult {
  sessionId: string;
  finalAnswer: string;
  steps: AgentExecutionStep[];
  toolsInvoked: string[];
}
