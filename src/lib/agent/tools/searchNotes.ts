// ==========================================
// Tool: searchNotes
// Searches student's uploaded course notes using semantic vector retrieval
// Reuses existing retrieveRelevantChunks service
// ==========================================

import { AgentTool, AgentContext, SearchNotesInput, SearchNotesOutput } from '../types';
import { retrieveRelevantChunks } from '@/lib/rag/retrievalService';

/**
 * Validates input for searchNotes tool at runtime.
 * Guarantees query is a non-empty string within a reasonable length.
 */
function validateSearchNotesInput(rawInput: any): SearchNotesInput {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new Error('Invalid input payload: expected an object.');
  }

  const rawQuery = rawInput.query;
  if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
    throw new Error('Validation error: "query" is required, must be a string, and cannot be empty.');
  }

  const trimmedQuery = rawQuery.trim();
  if (trimmedQuery.length > 500) {
    throw new Error('Validation error: "query" exceeds maximum allowable length of 500 characters.');
  }

  let cleanCourseId: string | undefined = undefined;
  if (typeof rawInput.courseId === 'string' && rawInput.courseId.trim()) {
    const val = rawInput.courseId.trim();
    if (!['none', 'null', 'undefined', 'all', 'n/a'].includes(val.toLowerCase())) {
      cleanCourseId = val;
    }
  }

  return {
    query: trimmedQuery,
    courseId: cleanCourseId,
  };
}

export const searchNotesTool: AgentTool<SearchNotesInput, SearchNotesOutput> = {
  name: 'searchNotes',
  description: 'Search the student\'s uploaded course notes using semantic vector retrieval.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The semantic question or topic to search for in the student\'s uploaded notes.',
      },
      courseId: {
        type: 'string',
        description: 'Optional course or subject code/name filter (e.g. "CS301", "Web Technologies").',
      },
    },
    required: ['query'],
  },
  execute: async (rawInput: SearchNotesInput, context: AgentContext): Promise<SearchNotesOutput> => {
    // 1. Runtime validation
    const input = validateSearchNotesInput(rawInput);

    // 2. Enforce verified server-side userId from context
    const userId = context.userId;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Security Exception: Verified userId in AgentContext is required to search notes.');
    }

    // 3. Delegate to existing RAG retrieval pipeline
    // Query -> nomic-embed-text -> PostgreSQL vector similarity -> relevant DocumentChunks
    const retrieval = await retrieveRelevantChunks({
      query: input.query,
      userId,
      topK: 6,
      minSimilarity: 0.58,
      subjectFilter: input.courseId,
    });

    const relevantChunks = retrieval.relevantChunks || [];
    const hasResults = relevantChunks.length > 0;

    // 4. Return structured source metadata and content
    const results = relevantChunks.map((chunk) => {
      const documentName = chunk.fileName || chunk.documentTitle || 'Uploaded Note';
      return {
        content: chunk.content,
        source: {
          documentId: chunk.documentId,
          documentName,
          similarity: chunk.similarity,
          chunkIndex: chunk.chunkIndex,
        },
      };
    });

    // Backward-compatible chunks mapping
    const chunks = relevantChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.fileName || chunk.documentTitle || 'Uploaded Note',
      content: chunk.content,
      similarity: chunk.similarity,
    }));

    return {
      query: input.query,
      hasResults,
      totalChunks: relevantChunks.length,
      results,
      chunks,
    };
  },
};
