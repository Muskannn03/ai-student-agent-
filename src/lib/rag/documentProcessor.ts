// ==========================================
// RAG Document Processor
// Handles PDF text extraction, semantic chunking,
// and embedding generation
// ==========================================

import { getAIProvider } from '@/lib/ai/providers';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { getDocumentProxy, extractText } from 'unpdf';

export interface DocumentChunkData {
  index: number;
  content: string;
  tokenCount: number;
  embedding: number[];
}

export interface ProcessedDocumentResult {
  documentId: string;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  chunkCount: number;
  subject?: string;
  sampleExcerpt: string;
}

// ------------------------------------------
// 1. PDF Text Extraction
// ------------------------------------------

/**
 * Extracts plain text and page count from a PDF buffer using unpdf.
 * Runs purely on the server without browser workers.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
}> {
  try {
    // 1. Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );

    // 2. Create PDF document proxy using unpdf
    const pdf = await getDocumentProxy(uint8Array);

    try {
      // 3. Extract text from all pages
      const { totalPages, text } = await extractText(pdf, { mergePages: true });

      const rawText = Array.isArray(text) ? text.join('\n\n') : (text || '');
      const sanitizedText = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\u0000/g, '') // remove null bytes
        .trim();

      const pageCount = totalPages || pdf.numPages || 1;

      if (!sanitizedText || sanitizedText.length === 0) {
        throw new Error('PDF contains no extractable text (it may be scanned or image-only).');
      }

      return {
        text: sanitizedText,
        pageCount,
      };
    } finally {
      // Clean up PDF proxy loading task
      await pdf.loadingTask?.destroy();
    }
  } catch (error) {
    console.error('[PDF Extraction Error]:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to extract text from PDF file.'
    );
  }
}

// ------------------------------------------
// 2. Semantic Document Chunking
// ------------------------------------------

export interface ChunkingOptions {
  maxChunkSize?: number; // Target max characters per chunk (default: 800)
  chunkOverlap?: number; // Overlap characters (default: 120)
}

/**
 * Splits text into meaningful, overlapping semantic chunks.
 * Preserves paragraphs and sentence boundaries.
 */
export function chunkDocument(
  text: string,
  options: ChunkingOptions = {}
): Array<{ index: number; content: string; tokenCount: number }> {
  const maxChunkSize = options.maxChunkSize || 800;
  const chunkOverlap = options.chunkOverlap || 120;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split text by paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: Array<{ index: number; content: string; tokenCount: number }> = [];

  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const cleanPara = para.trim().replace(/\s+/g, ' ');
    if (!cleanPara) continue;

    // If adding this paragraph exceeds maxChunkSize and currentChunk is non-empty
    if (currentChunk.length + cleanPara.length > maxChunkSize && currentChunk.length > 0) {
      // Approximate token count (roughly 4 characters per token in English)
      const tokenCount = Math.ceil(currentChunk.length / 4);
      chunks.push({
        index: chunkIndex++,
        content: currentChunk.trim(),
        tokenCount,
      });

      // Retain the overlap tail from currentChunk
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      currentChunk = currentChunk.slice(overlapStart) + '\n' + cleanPara;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n' + cleanPara : cleanPara;
    }

    // If a single paragraph is larger than maxChunkSize, split by sentence boundaries
    while (currentChunk.length > maxChunkSize) {
      const slice = currentChunk.slice(0, maxChunkSize);
      const searchWindowStart = Math.floor(maxChunkSize * 0.5);
      const searchWindow = slice.slice(searchWindowStart);

      let relativeSplit = Math.max(
        searchWindow.lastIndexOf('. '),
        searchWindow.lastIndexOf('? '),
        searchWindow.lastIndexOf('! ')
      );

      let splitPoint: number;
      if (relativeSplit !== -1) {
        splitPoint = searchWindowStart + relativeSplit + 1;
      } else {
        const spaceSplit = searchWindow.lastIndexOf(' ');
        if (spaceSplit !== -1) {
          splitPoint = searchWindowStart + spaceSplit;
        } else {
          const fallbackSpace = slice.lastIndexOf(' ');
          splitPoint = fallbackSpace !== -1 ? fallbackSpace : maxChunkSize;
        }
      }

      // Ensure splitPoint is greater than chunkOverlap to guarantee forward progress
      if (splitPoint <= chunkOverlap) {
        splitPoint = maxChunkSize;
      }

      const chunkText = currentChunk.slice(0, splitPoint).trim();
      if (chunkText) {
        chunks.push({
          index: chunkIndex++,
          content: chunkText,
          tokenCount: Math.ceil(chunkText.length / 4),
        });
      }

      // Always advance by at least 1 character to guarantee loop termination
      const nextStart = Math.min(splitPoint, Math.max(1, splitPoint - chunkOverlap));
      currentChunk = currentChunk.slice(nextStart).trim();
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      index: chunkIndex++,
      content: currentChunk.trim(),
      tokenCount: Math.ceil(currentChunk.length / 4),
    });
  }

  return chunks;
}

// ------------------------------------------
// 3. Embedding Generation
// ------------------------------------------

/**
 * Generate embedding vector for a text string.
 * In Ollama mode, calls Ollama /api/embed with nomic-embed-text.
 * In OpenAI mode, calls OpenAI embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = getAIProvider();
  return await provider.embed(text);
}

/**
 * Generates a normalized 1536-dimensional vector for offline local semantic search.
 */
function generateDeterministicEmbedding(text: string, dimensions = 1536): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Hash word to multiple dimensions using murmur-like polynomial rolling hash
    let hash1 = 0;
    let hash2 = 5381;
    for (let c = 0; c < word.length; c++) {
      const code = word.charCodeAt(c);
      hash1 = (hash1 * 31 + code) >>> 0;
      hash2 = ((hash2 << 5) + hash2 + code) >>> 0;
    }

    const idx1 = hash1 % dimensions;
    const idx2 = hash2 % dimensions;
    const idx3 = (hash1 ^ hash2) % dimensions;

    vector[idx1] += 1.0;
    vector[idx2] += 0.7;
    vector[idx3] += 0.5;
  }

  // L2 Normalize the vector so cosine similarity equals dot product
  let sumSq = 0;
  for (let d = 0; d < dimensions; d++) {
    sumSq += vector[d] * vector[d];
  }
  const magnitude = Math.sqrt(sumSq) || 1.0;

  for (let d = 0; d < dimensions; d++) {
    vector[d] = Number((vector[d] / magnitude).toFixed(6));
  }

  return vector;
}

// ------------------------------------------
// 4. End-to-End Processing & Storage
// ------------------------------------------

export interface StoreDocumentInput {
  fileBuffer: Buffer;
  fileName: string;
  fileSize: number;
  title?: string;
  subject?: string;
  userId: string;
}

/**
 * End-to-end pipeline:
 * 1. Extract text from PDF
 * 2. Split into semantic chunks
 * 3. Generate embeddings
 * 4. Store document metadata, chunks, embeddings, and user ownership in PostgreSQL
 */
export async function processAndStorePDF(
  input: StoreDocumentInput,
  options?: { maxChunksToProcess?: number }
): Promise<ProcessedDocumentResult> {
  const { fileBuffer, fileName, fileSize, title: customTitle, subject, userId } = input;

  if (!userId || typeof userId !== 'string') {
    throw new Error('User authorization failed: userId is required to store documents.');
  }

  // 1. Extract PDF Text
  console.log('[PDF] extraction started');
  const { text, pageCount } = await extractTextFromPDF(fileBuffer);
  console.log('[PDF] extraction completed');
  const documentTitle = customTitle?.trim() || fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // 2. Chunk text
  const rawChunks = chunkDocument(text, { maxChunkSize: 800, chunkOverlap: 120 });
  if (rawChunks.length === 0) {
    throw new Error('Document produced no text chunks after processing.');
  }

  console.log(`[CHUNKS] number of chunks = ${rawChunks.length}`);
  console.log(`Chunk count: ${rawChunks.length}`);

  const chunksToProcess = options?.maxChunksToProcess
    ? rawChunks.slice(0, options.maxChunksToProcess)
    : rawChunks;

  // 3. Generate Embeddings for chunks
  const chunkDataList: DocumentChunkData[] = [];
  for (let i = 0; i < chunksToProcess.length; i++) {
    const rc = chunksToProcess[i];
    console.log(`[EMBEDDING] starting chunk ${i + 1}/${chunksToProcess.length}`);
    console.log(`Processing chunk: ${i + 1}`);

    const embedding = await generateEmbedding(rc.content);

    if (i === 0) {
      console.log(`Embedding dimension: ${embedding.length}`);
    }

    chunkDataList.push({
      index: rc.index,
      content: rc.content,
      tokenCount: rc.tokenCount,
      embedding,
    });
  }

  // 4. Save to PostgreSQL
  const isDbConnected = await testDatabaseConnection();
  let documentId = `doc_${Date.now()}`;

  if (isDbConnected) {
    console.log('[DB] storing embedding');
    // Ensure user exists
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: 'Alex Rivera',
          email: `${userId}@university.edu`,
        },
      });
    }

    // Create NoteDocument and DocumentChunks
    const createdDoc = await prisma.noteDocument.create({
      data: {
        userId: user.id,
        title: documentTitle,
        fileName,
        fileSize,
        pageCount,
        subject: subject || null,
        chunks: {
          create: chunkDataList.map((c) => ({
            userId: user.id,
            chunkIndex: c.index,
            content: c.content,
            tokenCount: c.tokenCount,
            embedding: c.embedding,
          })),
        },
      },
    });

    documentId = createdDoc.id;
    console.log('[DB] storage completed');
  }

  console.log('[UPLOAD] processing completed');

  const sampleExcerpt = chunkDataList[0]?.content.slice(0, 200) + '...' || '';

  return {
    documentId,
    title: documentTitle,
    fileName,
    fileSize,
    pageCount,
    chunkCount: chunkDataList.length,
    subject,
    sampleExcerpt,
  };
}
