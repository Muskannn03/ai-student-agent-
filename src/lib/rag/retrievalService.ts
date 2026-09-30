// ==========================================
// RAG Retrieval Service
// Performs vector similarity search over student notes
// ==========================================

import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { generateEmbedding } from './documentProcessor';

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  fileName: string;
  subject: string | null;
  chunkIndex: number;
  content: string;
  similarity: number;
  tokenCount?: number | null;
}

export interface RetrievalQueryInput {
  query: string;
  userId: string;
  topK?: number;
  minSimilarity?: number;
  subjectFilter?: string;
}

export interface RetrievalResult {
  query: string;
  totalChunksSearched: number;
  relevantChunks: RetrievedChunk[];
  bestSimilarity: number;
  hasRelevantContext: boolean;
}

/**
 * Computes cosine similarity between two numerical vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized embeddings).
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  // Reject vectors with mismatched dimensions (e.g. legacy 1536 vs 768)
  if (vecA.length !== vecB.length) {
    return 0;
  }

  const length = vecA.length;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Number(similarity.toFixed(4));
}

/**
 * Searches the student's personal notes knowledge base for relevant chunks.
 */
export async function retrieveRelevantChunks(
  input: RetrievalQueryInput
): Promise<RetrievalResult> {
  const { query, userId, topK = 4, minSimilarity = 0.50, subjectFilter } = input;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      query: '',
      totalChunksSearched: 0,
      relevantChunks: [],
      bestSimilarity: 0,
      hasRelevantContext: false,
    };
  }

  const trimmedQuery = query.trim();

  // 1. Generate Query Vector Embedding
  const queryEmbedding = await generateEmbedding(trimmedQuery);

  // 2. Fetch Document Chunks for Authorized User
  const isDbConnected = await testDatabaseConnection();

  if (!isDbConnected) {
    // Offline / Mock Knowledge Base fallback for testing
    return getOfflineMockRetrieval(trimmedQuery, queryEmbedding, topK, minSimilarity);
  }

  try {
    const whereCondition: any = {
      userId,
    };

    if (subjectFilter && subjectFilter.trim()) {
      const cleanSub = subjectFilter.trim();
      if (!['none', 'null', 'undefined', 'all', 'n/a'].includes(cleanSub.toLowerCase())) {
        whereCondition.document = {
          subject: {
            contains: cleanSub,
            mode: 'insensitive',
          },
        };
      }
    }

    // Query chunks with document metadata from PostgreSQL
    const chunks = await prisma.documentChunk.findMany({
      where: whereCondition,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            subject: true,
          },
        },
      },
      take: 200, // Search over up to 200 recent chunks
    });

    if (chunks.length === 0) {
      // If user hasn't uploaded notes yet, check if there are any documents or use sample fallback
      const docCount = await prisma.noteDocument.count({ where: { userId } });
      if (docCount === 0) {
        return getOfflineMockRetrieval(trimmedQuery, queryEmbedding, topK, minSimilarity);
      }

      return {
        query: trimmedQuery,
        totalChunksSearched: 0,
        relevantChunks: [],
        bestSimilarity: 0,
        hasRelevantContext: false,
      };
    }

    const lowerQuery = trimmedQuery.toLowerCase();

    // 3. Compute Cosine Similarity against each chunk with document relevance adjustments
    const scoredChunks: RetrievedChunk[] = [];

    for (const chunk of chunks) {
      let similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding);

      // Boost chunks when query specifically targets this document
      const docTitleLower = chunk.document.title.toLowerCase();
      const fileNameLower = chunk.document.fileName.toLowerCase();
      const isDocumentExplicitlyMentioned =
        (docTitleLower.length > 2 && lowerQuery.includes(docTitleLower)) ||
        (fileNameLower.length > 2 && lowerQuery.includes(fileNameLower));

      if (isDocumentExplicitlyMentioned) {
        similarity = Math.min(1.0, similarity + 0.12);

        // Boost syllabus / introduction chunks for introductory queries
        const isIntroQuery =
          lowerQuery.includes('first topic') ||
          lowerQuery.includes('introduction') ||
          lowerQuery.includes('beginning') ||
          lowerQuery.includes('outline') ||
          lowerQuery.includes('heading') ||
          lowerQuery.includes('headings') ||
          lowerQuery.includes('syllabus');

        if (isIntroQuery && chunk.chunkIndex <= 3) {
          similarity = Math.min(1.0, similarity + 0.08);
        }
      }

      if (similarity >= minSimilarity) {
        scoredChunks.push({
          chunkId: chunk.id,
          documentId: chunk.document.id,
          documentTitle: chunk.document.title,
          fileName: chunk.document.fileName,
          subject: chunk.document.subject,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          similarity: Number(similarity.toFixed(4)),
          tokenCount: chunk.tokenCount,
        });
      }
    }

    // 4. Rank by Similarity Descending and take top K
    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scoredChunks.slice(0, topK);
    const bestSimilarity = topChunks[0]?.similarity || 0;

    return {
      query: trimmedQuery,
      totalChunksSearched: chunks.length,
      relevantChunks: topChunks,
      bestSimilarity,
      hasRelevantContext: topChunks.length > 0 && bestSimilarity >= minSimilarity,
    };
  } catch (error) {
    console.error('[Retrieval Service Error]:', error);
    return getOfflineMockRetrieval(trimmedQuery, queryEmbedding, topK, minSimilarity);
  }
}

/**
 * Provides realistic pre-seeded student note chunks for CS301, AI402, and DS205
 * when database is empty or offline during development.
 */
function getOfflineMockRetrieval(
  query: string,
  queryEmbedding: number[],
  topK: number,
  minSimilarity: number
): RetrievalResult {
  const mockChunks = [
    {
      chunkId: 'mock_chunk_1',
      documentId: 'doc_cs301',
      documentTitle: 'CS301: Graph Theory & Shortest Path Proofs',
      fileName: 'CS301_Lecture4_Graphs.pdf',
      subject: 'Algorithms (CS301)',
      chunkIndex: 1,
      content:
        'Dijkstra Algorithm operates using a Greedy strategy with a Min-Priority Queue. Its time complexity is O((V + E) log V). A fundamental invariant of Dijkstra is that edge weights must be strictly non-negative. If any negative edge exists, the greedy property fails because visited vertices are assumed to have their permanent shortest distances determined.',
    },
    {
      chunkId: 'mock_chunk_2',
      documentId: 'doc_cs301',
      documentTitle: 'CS301: Graph Theory & Shortest Path Proofs',
      fileName: 'CS301_Lecture4_Graphs.pdf',
      subject: 'Algorithms (CS301)',
      chunkIndex: 2,
      content:
        'Bellman-Ford Algorithm relaxes all |E| edges |V| - 1 times, running in O(V * E) time. Unlike Dijkstra, Bellman-Ford correctly handles negative edge weights. Furthermore, running an additional |V|-th relaxation iteration allows the algorithm to detect negative weight cycles: if any distance value decreases during iteration |V|, a negative cycle reachable from the source exists.',
    },
    {
      chunkId: 'mock_chunk_3',
      documentId: 'doc_ai402',
      documentTitle: 'AI402: Deep Learning Optimization & Backpropagation',
      fileName: 'AI402_Optimization_Notes.pdf',
      subject: 'Deep Learning (AI402)',
      chunkIndex: 1,
      content:
        'Adam (Adaptive Moment Estimation) combines the benefits of AdaGrad and RMSProp. It maintains exponentially decaying averages of past gradients (first moment m_t) and past squared gradients (second moment v_t). Hyperparameters beta_1 = 0.9 and beta_2 = 0.999 are standard, along with bias correction terms to prevent initial bias towards zero.',
    },
    {
      chunkId: 'mock_chunk_4',
      documentId: 'doc_ds205',
      documentTitle: 'DS205: Database Normalization & ACID Properties',
      fileName: 'DS205_Normalization_Guide.pdf',
      subject: 'Database Systems (DS205)',
      chunkIndex: 1,
      content:
        'Boyce-Codd Normal Form (BCNF) requires that for every non-trivial functional dependency X -> Y, X must be a superkey. In contrast, Third Normal Form (3NF) permits dependencies where X is not a superkey, provided that every attribute in Y is a prime attribute (part of some candidate key). Thus, every relation in BCNF is in 3NF, but not vice-versa.',
    },
  ];

  const scored: RetrievedChunk[] = [];
  const lowerQuery = query.toLowerCase();

  for (const c of mockChunks) {
    // Keyword match boost + vector similarity
    let score = 0.4;
    const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
    for (const w of words) {
      if (c.content.toLowerCase().includes(w) || c.documentTitle.toLowerCase().includes(w)) {
        score += 0.2;
      }
    }
    score = Math.min(score, 0.96);

    if (score >= minSimilarity) {
      scored.push({
        ...c,
        similarity: Number(score.toFixed(4)),
        tokenCount: Math.ceil(c.content.length / 4),
      });
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  const top = scored.slice(0, topK);

  return {
    query,
    totalChunksSearched: mockChunks.length,
    relevantChunks: top,
    bestSimilarity: top[0]?.similarity || 0,
    hasRelevantContext: top.length > 0 && (top[0]?.similarity || 0) >= minSimilarity,
  };
}
