import { NextRequest, NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { runAcademicAgent } from '@/lib/agent';
import { ChatHistoryMessage } from '@/lib/ai/agent';
import { MessageRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      // Mock conversation sessions for development when DB is offline
      if (conversationId) {
        return NextResponse.json({
          conversationId,
          title: 'Algorithms & Proofs (CS301)',
          messages: [
            {
              id: 'm1',
              role: 'user',
              content: 'Can you explain the difference between Bellman-Ford and Dijkstra algorithms?',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'm2',
              role: 'assistant',
              content: `### Comparison of Shortest Path Algorithms\n\n1. **Dijkstra**: Operating in $\\mathcal{O}((V + E) \\log V)$ with a Min-Heap. Cannot handle negative edge weights.\n2. **Bellman-Ford**: Runs in $\\mathcal{O}(V \\times E)$. Handles negative edge weights and detects negative weight cycles.`,
              createdAt: new Date(Date.now() - 3500000).toISOString(),
            },
          ],
        });
      }

      return NextResponse.json({
        conversations: [
          {
            id: 'conv_sample_1',
            title: 'Algorithms & Proofs (CS301)',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'conv_sample_2',
            title: 'Deep Learning ResNet Benchmark',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      });
    }

    // 1. Fetch messages for a specific conversation
    if (conversationId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Conversation not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        conversationId: session.id,
        title: session.title,
        messages: session.messages.map((m) => ({
          id: m.id,
          role: m.role.toLowerCase(),
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      });
    }

    // 2. Fetch list of conversations for the student
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ conversations: [] });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      conversations: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        messageCount: s._count.messages,
      })),
    });
  } catch (error) {
    console.error('[API GET /api/chat error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversations.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId parameter is required.' },
        { status: 400 }
      );
    }

    const isDbConnected = await testDatabaseConnection();
    if (isDbConnected) {
      await prisma.chatSession.delete({
        where: { id: conversationId },
      });
    }

    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error('[API DELETE /api/chat error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate request payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body provided in request.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object.' },
        { status: 400 }
      );
    }

    // Support both "message" and legacy "prompt" parameter for backwards compatibility
    const rawMessage = body.message || body.prompt;
    const conversationIdParam = body.conversationId;

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return NextResponse.json(
        { error: 'The "message" field is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const userMessage = rawMessage.trim();
    const isDbConnected = await testDatabaseConnection();

    // 2. Database Integration & Context Retrieval
    let activeConversationId: string = conversationIdParam || `conv_${Date.now()}`;
    let history: ChatHistoryMessage[] = [];
    let studentProfileContext: {
      userId?: string;
      name?: string;
      email?: string;
      college?: string | null;
      course?: string | null;
      semester?: number | null;
      skills?: string[];
      careerGoals?: string | null;
    } = {
      name: 'Alex Rivera',
      course: 'Computer Science & AI',
      semester: 4,
      skills: ['Python', 'TypeScript', 'Next.js', 'PyTorch', 'PostgreSQL'],
    };

    if (isDbConnected) {
      try {
        // Retrieve or create default student user
        let user = await prisma.user.findFirst({
          include: { studentProfile: true },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: 'Alex Rivera',
              email: 'alex.rivera@university.edu',
              studentProfile: {
                create: {
                  college: 'School of Computing & AI Sciences',
                  course: 'B.Tech Computer Science & AI',
                  semester: 4,
                  skills: ['Python', 'TypeScript', 'Next.js', 'PyTorch', 'PostgreSQL'],
                  careerGoals: 'AI/ML Engineering Intern',
                },
              },
            },
            include: { studentProfile: true },
          });
        }

        if (user) {
          studentProfileContext = {
            userId: user.id,
            email: user.email,
            name: user.name,
            college: user.studentProfile?.college,
            course: user.studentProfile?.course,
            semester: user.studentProfile?.semester,
            skills: user.studentProfile?.skills || [],
            careerGoals: user.studentProfile?.careerGoals,
          };
        }

        // Find or create ChatSession (Conversation) in PostgreSQL
        let session = null;
        if (conversationIdParam) {
          session = await prisma.chatSession.findUnique({
            where: { id: conversationIdParam },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
                take: 20, // last 20 messages for context window
              },
            },
          });
        }

        if (!session) {
          const titleSnippet =
            userMessage.length > 40 ? `${userMessage.slice(0, 40)}...` : userMessage;

          session = await prisma.chatSession.create({
            data: {
              userId: user.id,
              title: titleSnippet,
            },
            include: { messages: true },
          });
        }

        activeConversationId = session.id;

        // Build history from previous messages in this conversation
        if (session.messages && session.messages.length > 0) {
          history = session.messages.map((m) => ({
            role: m.role === MessageRole.ASSISTANT ? 'assistant' : 'user',
            content: m.content,
          }));
        }

        // Persist User Message to PostgreSQL
        await prisma.chatMessage.create({
          data: {
            chatSessionId: activeConversationId,
            role: MessageRole.USER,
            content: userMessage,
          },
        });
      } catch (dbError) {
        console.error('[Database Error during chat persistence]:', dbError);
        // Continue gracefully to AI service so student request is never dropped
      }
    }

    // 3. Invoke Autonomous AI Academic Agent with Intent Analysis & Tool-Calling Loop
    const agentResult = await runAcademicAgent({
      userMessage,
      history,
      context: {
        userId: studentProfileContext.userId || 'default_student_user',
        studentName: studentProfileContext.name,
        userEmail: studentProfileContext.email,
        course: studentProfileContext.course,
        semester: studentProfileContext.semester,
        college: studentProfileContext.college,
      },
    });

    // 4. Persist AI Response to PostgreSQL
    if (isDbConnected && activeConversationId) {
      try {
        await prisma.chatMessage.create({
          data: {
            chatSessionId: activeConversationId,
            role: MessageRole.ASSISTANT,
            content: agentResult.message,
          },
        });

        // Touch chatSession updatedAt
        await prisma.chatSession.update({
          where: { id: activeConversationId },
          data: { updatedAt: new Date() },
        });
      } catch (dbSaveError) {
        console.error('[Database Error saving assistant response]:', dbSaveError);
      }
    }

    // 5. Return standardized response format
    return NextResponse.json({
      message: agentResult.message,
      conversationId: activeConversationId,
      toolCalls: agentResult.toolCallsExecuted || [],
      isSimulated: agentResult.isSimulated,
    });
  } catch (error: unknown) {
    console.error('[API /api/chat Failure]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';

    const isOllamaDown = errorMessage.includes('Ollama is not running');
    const userFacingError = isOllamaDown
      ? 'Ollama is not running. Please start Ollama and try again.'
      : errorMessage;

    return NextResponse.json(
      {
        error: userFacingError,
        details: errorMessage,
      },
      { status: isOllamaDown ? 503 : 500 }
    );
  }
}
