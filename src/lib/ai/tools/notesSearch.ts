// ==========================================
// Tool: Notes Search (RAG Knowledge Base Retrieval)
// Searches student's uploaded PDFs and lecture notes
// ==========================================

import { AgentTool, ToolExecutionContext } from './types';
import { retrieveRelevantChunks, RetrievedChunk } from '@/lib/rag/retrievalService';

export interface NotesSearchArgs {
  query: string;
  subject?: string;
  topK?: number;
}

export interface NotesSearchResult {
  success: boolean;
  query: string;
  totalFound: number;
  sourcesFound: string[];
  chunks: Array<{
    documentTitle: string;
    fileName: string;
    subject: string | null;
    chunkIndex: number;
    content: string;
    relevanceScore: number;
    citation: string;
  }>;
  formattedContext: string;
  notice?: string;
  error?: string;
}

export const notesSearchTool: AgentTool<NotesSearchArgs, NotesSearchResult> = {
  name: 'search_student_notes',
  description:
    'Search the student\'s uploaded PDF lecture notes and course documents using semantic vector similarity. Use this tool whenever the student asks about concepts covered in their notes, lecture materials, uploaded slides, or exam preparation topics.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The semantic question or topic to search for within the uploaded student notes.',
      },
      subject: {
        type: 'string',
        description: 'Optional subject name or course code filter (e.g. "CS301", "AI402", "DS205").',
      },
      topK: {
        type: 'number',
        description: 'Maximum number of relevant chunks to retrieve (default: 4).',
      },
    },
    required: ['query'],
  },
  execute: async (
    args: NotesSearchArgs,
    context: ToolExecutionContext
  ): Promise<NotesSearchResult> => {
    // 1. Mandatory Authorization & Parameter Validation
    const userId = context.userId || 'default_student_user';
    if (!args.query || typeof args.query !== 'string' || !args.query.trim()) {
      return {
        success: false,
        query: '',
        totalFound: 0,
        sourcesFound: [],
        chunks: [],
        formattedContext: '',
        error: 'Search query parameter is required and cannot be empty.',
      };
    }

    try {
      console.log(`[RAG Tool] Searching notes for query: "${args.query}" (userId: ${userId})`);

      const cleanSubject =
        args.subject &&
        !['none', 'null', 'undefined', 'all', 'n/a', ''].includes(args.subject.toLowerCase().trim())
          ? args.subject.trim()
          : undefined;

      const retrieval = await retrieveRelevantChunks({
        query: args.query.trim(),
        userId,
        topK: args.topK || 4,
        subjectFilter: cleanSubject,
        minSimilarity: 0.25,
      });

      if (!retrieval.hasRelevantContext || retrieval.relevantChunks.length === 0) {
        return {
          success: true,
          query: args.query,
          totalFound: 0,
          sourcesFound: [],
          chunks: [],
          formattedContext:
            'NO_RELEVANT_NOTES_FOUND: No relevant excerpts found in the student\'s uploaded notes. Instruct the student that this information was not found in their uploaded documents, or provide a general explanation while clarifying it is not from their notes.',
          notice:
            'No matching excerpts found in the student\'s uploaded notes for this query.',
        };
      }

      // Format chunks with clean citations
      const sourcesSet = new Set<string>();
      const formattedChunks = retrieval.relevantChunks.map((chunk: RetrievedChunk) => {
        sourcesSet.add(chunk.documentTitle);
        const citation = `[Source: ${chunk.documentTitle} (Chunk #${chunk.chunkIndex})]`;
        return {
          documentTitle: chunk.documentTitle,
          fileName: chunk.fileName,
          subject: chunk.subject,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          relevanceScore: Math.round(chunk.similarity * 100),
          citation,
        };
      });

      // Build context prompt string for the LLM
      const formattedContext = formattedChunks
        .map(
          (c, idx) =>
            `--- EXCERPT ${idx + 1} ${c.citation} (Relevance: ${c.relevanceScore}%) ---\n${c.content}\n`
        )
        .join('\n');

      return {
        success: true,
        query: args.query,
        totalFound: formattedChunks.length,
        sourcesFound: Array.from(sourcesSet),
        chunks: formattedChunks,
        formattedContext,
      };
    } catch (err) {
      console.error('[Notes Search Tool Error]:', err);
      return {
        success: false,
        query: args.query,
        totalFound: 0,
        sourcesFound: [],
        chunks: [],
        formattedContext: '',
        error:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while searching notes.',
      };
    }
  },
};
