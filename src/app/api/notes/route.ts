import { NextRequest, NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { mockNotes } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();

    const isDbConnected = await testDatabaseConnection();

    if (isDbConnected) {
      const user = await prisma.user.findFirst();
      if (user) {
        const whereClause: any = { userId: user.id };
        if (search) {
          whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ];
        }

        const documents = await prisma.noteDocument.findMany({
          where: whereClause,
          include: {
            _count: {
              select: { chunks: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (documents.length > 0) {
          const formatted = documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            courseName: doc.subject || 'General Studies',
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            pageCount: doc.pageCount,
            chunkCount: doc._count.chunks,
            tags: [doc.subject || 'Lecture Notes', 'PDF Document', `${doc._count.chunks} Chunks`],
            date: doc.createdAt.toISOString().split('T')[0],
            isUploadedPdf: true,
          }));

          return NextResponse.json({
            success: true,
            data: formatted,
            source: 'postgresql',
          });
        }
      }
    }

    // Fallback to mock notes when database has no uploaded documents yet
    let filtered = mockNotes;
    if (search) {
      filtered = mockNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.content.toLowerCase().includes(search) ||
          n.tags.some((t) => t.toLowerCase().includes(search))
      );
    }
    return NextResponse.json({ success: true, data: filtered, source: 'cached' });
  } catch (error) {
    console.error('[API /api/notes error]:', error);
    return NextResponse.json({
      success: true,
      data: mockNotes,
      error: error instanceof Error ? error.message : 'Notes fetch error',
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document id parameter is required.' },
        { status: 400 }
      );
    }

    const isDbConnected = await testDatabaseConnection();
    if (isDbConnected) {
      await prisma.noteDocument.delete({
        where: { id: documentId },
      });
    }

    return NextResponse.json({ success: true, documentId });
  } catch (error) {
    console.error('[API DELETE /api/notes error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete note document.' },
      { status: 500 }
    );
  }
}
