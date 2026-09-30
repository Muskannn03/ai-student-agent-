import { NextRequest, NextResponse } from 'next/server';
import { processAndStorePDF } from '@/lib/rag/documentProcessor';
import { prisma, testDatabaseConnection } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const subject = formData.get('subject') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Validate MIME type or file extension
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only PDF files are supported.' },
        { status: 400 }
      );
    }

    // Size limit check (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed limit of 15MB.' },
        { status: 400 }
      );
    }

    // Determine current user ID
    let userId = 'default_student_user';
    const isDbConnected = await testDatabaseConnection();
    if (isDbConnected) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    // Convert Web File to Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Process PDF: Extract text, chunk, embed, and store in PostgreSQL
    const processedDoc = await processAndStorePDF({
      fileBuffer,
      fileName: file.name,
      fileSize: file.size,
      title: title || undefined,
      subject: subject || undefined,
      userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Document indexed successfully',
      document: processedDoc,
    });
  } catch (error) {
    console.error('[API /api/notes/upload Error]:', error);
    const details = error instanceof Error ? error.message : 'Unknown processing error';
    const isTimeout = details.includes('timed out');
    const isOllamaDown = details.includes('Ollama is not running');

    let errorMessage = 'Failed to process and store PDF notes.';
    if (isTimeout) {
      errorMessage = 'Embedding generation timed out.';
    } else if (isOllamaDown) {
      errorMessage = 'Ollama is not running. Please start Ollama and try again.';
    } else if (details) {
      errorMessage = details;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details,
      },
      { status: isTimeout ? 504 : isOllamaDown ? 503 : 500 }
    );
  }
}
