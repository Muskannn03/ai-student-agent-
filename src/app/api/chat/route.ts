import { NextRequest, NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { runAcademicAgent } from '@/lib/agent';
import { ChatHistoryMessage } from '@/lib/ai/agent';
import { MessageRole } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth/auth';

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

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json({ conversations: [] });
    }

    // 1. Fetch messages for a specific conversation (scoped to current user)
    if (conversationId) {
      const session = await prisma.chatSession.findFirst({
        where: {
          id: conversationId,
          userId: user.id,
        },
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
      const user = await getAuthenticatedUser(true);
      if (user) {
        await prisma.chatSession.deleteMany({
          where: {
            id: conversationId,
            userId: user.id,
          },
        });
      }
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
        let user = await getAuthenticatedUser(true);

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

        // Find or create ChatSession (Conversation) in PostgreSQL (strictly scoped to user)
        let session = null;
        if (conversationIdParam) {
          session = await prisma.chatSession.findFirst({
            where: {
              id: conversationIdParam,
              userId: user.id,
            },
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 20, // Bounded context window: most recent 20 messages
              },
            },
          });

          if (session && session.messages) {
            session.messages.reverse(); // Restore chronological order: oldest to newest
          }
        }

        if (!session) {
          const titleSnippet =
            userMessage.length > 40 ? `${userMessage.slice(0, 40)}...` : userMessage;

          // Check if an identical session was created in the last 10 seconds (debouncing duplicate requests)
          const recentSession = await prisma.chatSession.findFirst({
            where: {
              userId: user.id,
              title: titleSnippet,
              createdAt: {
                gte: new Date(Date.now() - 10000),
              },
            },
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 20,
              },
            },
          });

          if (recentSession) {
            session = recentSession;
            if (session.messages) {
              session.messages.reverse();
            }
          } else {
            session = await prisma.chatSession.create({
              data: {
                userId: user.id,
                title: titleSnippet,
              },
              include: { messages: true },
            });
          }
        }

        activeConversationId = session.id;

        // Build history from previous messages in this conversation
        if (session.messages && session.messages.length > 0) {
          history = session.messages.map((m) => ({
            role: m.role === MessageRole.ASSISTANT ? 'assistant' : 'user',
            content: m.content,
          }));
        }

        // Avoid duplicate user message if already inserted within last 5 seconds
        const lastUserMsg = await prisma.chatMessage.findFirst({
          where: {
            chatSessionId: activeConversationId,
            role: MessageRole.USER,
          },
          orderBy: { createdAt: 'desc' },
        });

        const isDuplicateUserMsg =
          lastUserMsg &&
          lastUserMsg.content === userMessage &&
          Date.now() - new Date(lastUserMsg.createdAt).getTime() < 5000;

        if (!isDuplicateUserMsg) {
          await prisma.chatMessage.create({
            data: {
              chatSessionId: activeConversationId,
              role: MessageRole.USER,
              content: userMessage,
            },
          });
        }
      } catch (dbError) {
        console.error('[Database Error during chat persistence]:', dbError);
        // Continue gracefully to AI service so student request is never dropped
      }
    }

    // 3. Handle Streaming Response via Server-Sent Events (SSE) when requested
    if (body.stream === true) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
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
              onProgress: (event) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
              },
            });

            // Persist AI Response to PostgreSQL (avoid duplicate within 5s)
            if (isDbConnected && activeConversationId) {
              try {
                const lastAstMsg = await prisma.chatMessage.findFirst({
                  where: {
                    chatSessionId: activeConversationId,
                    role: MessageRole.ASSISTANT,
                  },
                  orderBy: { createdAt: 'desc' },
                });

                const isDuplicateAst =
                  lastAstMsg &&
                  lastAstMsg.content === agentResult.message &&
                  Date.now() - new Date(lastAstMsg.createdAt).getTime() < 5000;

                if (!isDuplicateAst) {
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
                }
              } catch (dbSaveError) {
                console.error('[Database Error saving assistant response]:', dbSaveError);
              }
            }

            // Emit final done event with full structured payload
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'done',
                  message: agentResult.message,
                  conversationId: activeConversationId,
                  toolCalls: agentResult.toolCallsExecuted || [],
                  isSimulated: agentResult.isSimulated,
                  sources: agentResult.sources || [],
                })}\n\n`
              )
            );
            controller.close();
          } catch (streamError: any) {
            console.error('[API /api/chat Stream Error]:', streamError);
            const rawMsg = streamError instanceof Error ? streamError.message : 'Error in AI generation';
            const isOllamaDown = rawMsg.includes('Ollama is not running');
            const cleanError = isOllamaDown
              ? 'Ollama is not running. Please start Ollama and try again.'
              : 'An unexpected error occurred while communicating with the AI agent.';

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: cleanError })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // 4. Standard Non-Streaming JSON Response (Preserves 100% Backward Compatibility)
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

    // Persist AI Response to PostgreSQL (avoid duplicate within 5s)
    if (isDbConnected && activeConversationId) {
      try {
        const lastAstMsg = await prisma.chatMessage.findFirst({
          where: {
            chatSessionId: activeConversationId,
            role: MessageRole.ASSISTANT,
          },
          orderBy: { createdAt: 'desc' },
        });

        const isDuplicateAst =
          lastAstMsg &&
          lastAstMsg.content === agentResult.message &&
          Date.now() - new Date(lastAstMsg.createdAt).getTime() < 5000;

        if (!isDuplicateAst) {
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
        }
      } catch (dbSaveError) {
        console.error('[Database Error saving assistant response]:', dbSaveError);
      }
    }

    // Return standardized response format
    return NextResponse.json({
      message: agentResult.message,
      conversationId: activeConversationId,
      toolCalls: agentResult.toolCallsExecuted || [],
      isSimulated: agentResult.isSimulated,
      sources: agentResult.sources || [],
    });
  } catch (error: unknown) {
    console.error('[API /api/chat Failure]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';

    const isOllamaDown =
      errorMessage.includes('Ollama is not running') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed');

    const userFacingError = isOllamaDown
      ? 'Ollama is not running. Please start Ollama and try again.'
      : 'An unexpected error occurred while communicating with the AI agent.';

    return NextResponse.json(
      {
        error: userFacingError,
      },
      { status: isOllamaDown ? 503 : 500 }
    );
  }
}
