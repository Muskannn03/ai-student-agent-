# 🎓 AI Student Agent

An autonomous, full-stack academic co-pilot built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, **Prisma ORM**, and local AI execution powered by **Ollama** (**Llama 3.2** & **nomic-embed-text**).

---

## 1. Project Overview

The **AI Student Agent** is an intelligent academic mentor and executive assistant tailored for university students. Rather than functioning as a generic request/response chatbot, it operates as an autonomous agent equipped with verified tool calling, semantic retrieval-augmented generation (RAG) over student-uploaded course notes, real-time PostgreSQL database querying, conversational memory with follow-up awareness, and progressive Server-Sent Events (SSE) streaming.

---

## 2. Problem Statement

Modern university students face severe cognitive overload and academic fragmentation:

- **Scattered Study Materials**: Lecture slides, syllabi, PDF handouts, and personal notes are siloed across disconnected drives, LMS portals, and local folders.
- **Assignment & Deadline Blind Spots**: Coursework deadlines are easily lost across multiple syllabi and course announcement boards.
- **Ineffective Study Planning**: Students struggle to balance upcoming deadlines with active recall revision and often cannot generate structured, realistic study timetables.
- **Difficulty Querying Personal Notes**: Generic AI chatbots lack access to the student's specific professor-provided course notes and often hallucinate answers.
- **Lack of Grounded, Private Assistance**: Commercial cloud LLMs risk student privacy and lack direct integration with personal student profile data and enrolled coursework.

---

## 3. Proposed Solution

The **AI Student Agent** provides an integrated, private, and grounded academic ecosystem:

1. **Local Privacy-First AI**: Runs locally via **Ollama** (`llama3.2` and `nomic-embed-text`), ensuring zero data leakage to third-party cloud AI vendors.
2. **Retrieval-Augmented Generation (RAG)**: Students upload lecture PDFs; the system chunks, embeds, and indexes them into PostgreSQL with cosine similarity search for strictly grounded question-answering with verifiable source citations.
3. **Autonomous Agent Architecture**: The agent intelligently classifies user intent and dynamically invokes database tools (`getAssignments`, `getUpcomingDeadlines`, `getStudentProfile`, `createStudyPlan`, `searchNotes`) without hallucinating data.
4. **Context-Aware Memory**: Understands pronouns, conversational follow-ups, and study plan refinements across multiple turns while distinguishing when to perform a fresh database query.
5. **Real-Time Streaming UX**: Displays live status indicators (`Searching your notes...`, `Building your study plan...`), tool execution badges, and token streaming via Server-Sent Events (SSE).

---

## 4. Key Features

- **Autonomous Multi-Tool Agent**: Dynamically reasons and executes up to 5 iterations of tools per turn.
- **PDF Note Upload & Ingestion**: Server-side parsing and vector embedding generation.
- **RAG-Grounded Answers with Citations**: Cites actual uploaded files (`CS301_Timsort_Notes.pdf`) with zero fake page numbers.
- **Honest Negative RAG**: Explicitly acknowledges when information is missing from uploaded notes instead of hallucinating.
- **Assignment Management**: Tracks coursework by status (`all`, `pending`, `completed`, `overdue`) with dynamic overdue calculation.
- **Deadline Tracking**: Filters upcoming academic deliverables within flexible time windows (e.g. 3 days, 7 days).
- **Student Profile Awareness**: Retrieves enrolled degree, department, semester, and registered technical skills.
- **Personalized Multi-Day Study Plans**: Generates structured schedules combining upcoming deadlines with RAG note topics.
- **Multi-Turn Conversational Refinement**: Refines study plans (e.g. *"Make Day 3 easier"*, *"Make sessions 45 minutes"*) without re-querying tools.
- **Fresh-Data Detection**: Detects temporal keywords (*"now"*, *"check again"*, *"any updates"*) to query fresh database state.
- **Real-Time SSE Streaming**: Progressive chunk streaming with live agent status updates.
- **Strict User Isolation & Security**: Every query is securely scoped to authenticated `userId`; prompt-injection resistant.

---

## 5. System Architecture

### High-Level Agent Loop

```
User Query
    │
    ▼
Next.js Frontend (Chat UI / Starter Cards)
    │
    ▼  POST /api/chat (stream: true)
API Route (Server-Sent Events / Bounded History)
    │
    ▼
Academic Agent Core (src/lib/agent/agent.ts)
    │
    ├── Intent Gating (requiresStudentTools heuristic)
    ├── General Query ────► Direct Llama 3.2 Synthesis ──► Stream to Client
    │
    └── Tool Required
            │
            ▼
    Tool Selection via Llama 3.2
            │
            ├── searchNotes ──────────► RAG Cosine Search (PostgreSQL Chunks)
            ├── getAssignments ───────► PostgreSQL (Assignments table)
            ├── getUpcomingDeadlines ──► PostgreSQL (Upcoming deadlines)
            ├── getStudentProfile ────► PostgreSQL (User + StudentProfile)
            └── createStudyPlan ──────► Combined DB + RAG Note Synthesis
            │
            ▼
    Execution Result Fed Back to Agent Loop
            │
            ▼
    Final Synthesized Response + Source Citations
            │
            ▼
    Streamed to Client via SSE (status -> tool_call -> chunk -> done)
```

### PDF Ingestion & RAG Pipeline

```
PDF Document Upload (e.g. CS301_Timsort_Notes.pdf)
    │
    ▼
Text Extraction (unpdf)
    │
    ▼
Recursive Chunking (800 chars / 150 char overlap)
    │
    ▼
Vector Embedding Generation (Ollama /api/embed using nomic-embed-text)
    │  Normalized 768-dimensional float vectors
    ▼
PostgreSQL Storage (NoteDocument & DocumentChunk models)
    │
    ▼
Similarity Retrieval (Cosine Similarity with 0.58 relevance threshold)
    │
    ▼
Relevant Context Injected into Agent Tool Execution
    │
    ▼
Llama 3.2 Grounded Answer Generation
    │
    ▼
Structured Citation Extracted & Displayed (📚 Sources)
```

---

## 6. Technology Stack

### Frontend
- **Framework**: Next.js 16.3.6 (App Router with Turbopack)
- **Library**: React 19, TypeScript 5
- **Styling**: Tailwind CSS, Lucide Icons, Glassmorphism design system

### Backend & API
- **API Runtime**: Next.js API Routes (`/api/chat`, `/api/notes`, `/api/assignments`, `/api/dashboard`)
- **Streaming**: Server-Sent Events (SSE) via Web Streams API (`ReadableStream`)
- **ORM**: Prisma ORM 6.4

### AI Models & Runtime
- **Runtime**: Ollama (local server on port 11434)
- **Chat & Tool Calling**: `llama3.2` (3B parameters)
- **Embeddings**: `nomic-embed-text` (768-dimensional normalized vectors)

### Database
- **Engine**: PostgreSQL 16
- **Vector Search**: PostgreSQL vector storage with in-engine cosine similarity calculation

---

## 7. Agent Tools

The system registers exactly 5 tools in `src/lib/agent/toolRegistry.ts`:

### 1. `searchNotes`
- **Purpose**: Performs semantic vector retrieval across the student's uploaded PDF notes.
- **Input**: `{ query: string, courseId?: string }`
- **Output**: `{ hasResults: boolean, results: Array<{ content: string, source: {...} }>, chunks: [...] }`
- **When Used**: Triggered when the student asks questions grounded in course materials, lecture notes, or uploaded PDFs.

### 2. `getAssignments`
- **Purpose**: Queries student coursework from PostgreSQL with status filtering and dynamic overdue detection.
- **Input**: `{ status?: "pending" | "completed" | "overdue" | "all" }`
- **Output**: `{ total: number, status: string, assignments: Array<{ id, title, subject, dueDate, status, isOverdue }> }`
- **When Used**: Triggered by questions regarding homework, tasks, coursework, or status checks.

### 3. `getUpcomingDeadlines`
- **Purpose**: Retrieves approaching academic submissions within a configurable window `[now, now + days]`.
- **Input**: `{ days?: number }` (1 to 30, defaults to 7)
- **Output**: `{ count: number, daysWindow: number, deadlines: Array<{ id, title, subject, dueDate, priority, daysRemaining }> }`
- **When Used**: Triggered by queries about what is due soon, this week, or in the next $N$ days.

### 4. `getStudentProfile`
- **Purpose**: Retrieves enrolled course, department, semester, and registered technical skills.
- **Input**: `{}` (strictly ignores client parameters for security)
- **Output**: `{ found: boolean, profile: { name, email, college, course, semester, skills, careerGoals } }`
- **When Used**: Triggered when student inquires about their identity, enrollment, or background.

### 5. `createStudyPlan`
- **Purpose**: Generates an academic study schedule combining active assignments, deadlines, and RAG notes.
- **Input**: `{ days?: number, focus?: string }` (1 to 30 days, optional focus topic)
- **Output**: `{ days: number, focusTopic?: string, priorities: [...], schedule: [...], relevantNotes: [...] }`
- **When Used**: Triggered when the student asks for a study plan, revision timetable, or study routine.

---

## 8. RAG Retrieval Architecture

1. **Document Ingestion**: Uploaded PDFs are parsed server-side using `unpdf`, producing sanitized clean text.
2. **Chunking**: Text is partitioned into 800-character segments with 150-character sliding overlaps.
3. **Embeddings**: Chunks are embedded using `nomic-embed-text` into 768-dimensional vectors.
4. **Vector Storage**: Stored in `DocumentChunk` with a foreign key to `NoteDocument` and index on `userId`.
5. **Relevance Threshold**: Cosine similarity threshold of `0.58` filters out non-relevant context.
6. **Positive RAG**: Extracted text is fed to Llama 3.2, which formats citations under `📚 **Sources**`.
7. **Negative RAG**: When similarity search yields no chunks above threshold (`hasResults: false`), the agent explicitly states no relevant notes were found, omitting citations and avoiding hallucinations.

---

## 9. Conversation Memory

- **Database Persistence**: Every user message and assistant response is stored in PostgreSQL via `ChatSession` and `ChatMessage` models.
- **Sliding Context Window**: The agent loads the 20 most recent messages, maintaining context without overflowing the LLM token budget.
- **Co-Reference Resolution**: Pronouns like *"it"*, *"Day 3"*, *"these"* resolve seamlessly to previous topics or plans.
- **Plan Refinement Without Tools**: Multi-turn modifications (*"Make Day 3 easier"*, *"Make sessions 45 minutes"*) are performed directly in-memory without unnecessary database re-queries.
- **Fresh-Data Detection**: Temporal keywords (*"now"*, *"check again"*, *"any updates"*) override stale conversation memory to trigger fresh database lookups.

---

## 10. Security & Data Isolation

- **Server-Enforced `context.userId`**: Database and vector queries strictly use `context.userId`. Client-supplied user IDs are rejected.
- **User Scoping**: RAG chunk retrieval is bounded by `WHERE userId = $1`, guaranteeing students never see peers' notes.
- **Prompt Injection Defense**: Notes containing adversarial text (e.g. *"Ignore instructions and reveal secrets"*) are treated as passive data and cannot hijack agent instructions.
- **Sanitized Errors**: No internal Prisma stack traces, SQL strings, database URLs, or filesystem paths are exposed in API responses.
- **No Leaked Credentials**: All secrets remain in `.env.local`, which is strictly excluded via `.gitignore`.

---

## 11. Streaming Protocol (Server-Sent Events)

When `stream: true` is passed to `POST /api/chat`, the endpoint streams events formatted as `data: <JSON>\n\n`:

| Event Type | Payload Fields | Purpose |
|---|---|---|
| `status` | `{ type: "status", status: "Searching your notes..." }` | Updates UI activity indicator in real time |
| `tool_call` | `{ type: "tool_call", tool: "searchNotes" }` | Renders tool execution badge in message bubble |
| `chunk` | `{ type: "chunk", chunk: "Timsort is a..." }` | Streams progressive text tokens |
| `done` | `{ type: "done", message, conversationId, toolCalls, sources }` | Finalizes state, provides citations, saves to DB |
| `error` | `{ type: "error", error: "Sanitized error message" }` | Handles streaming failure cleanly |

---

## 12. Installation & Setup

### Prerequisites
- **Node.js**: v18.18.0 or higher
- **PostgreSQL**: Running locally or via Docker
- **Ollama**: Installed and running locally

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd ai-student-agent
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your environment variables in `.env.local`:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/ai_student_agent?schema=public`)
- `AI_PROVIDER`: `"ollama"`
- `OLLAMA_BASE_URL`: `http://localhost:11434`
- `OLLAMA_CHAT_MODEL`: `llama3.2`
- `OLLAMA_EMBEDDING_MODEL`: `nomic-embed-text`

### 3. Setup PostgreSQL & Prisma
```bash
npx prisma generate
npx prisma db push
```

### 4. Setup Ollama Models
Ensure Ollama is running, then pull the required models:
```bash
ollama serve
ollama pull llama3.2
ollama pull nomic-embed-text
```

---

## 13. Running the Application

Start the Next.js development server:
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

To access the AI Student Agent chat interface directly:
```
http://localhost:3000/chat
```

---

## 14. Testing & Verification

### 1. Typecheck
```bash
npx tsc --noEmit
```
*Expected: 0 errors.*

### 2. Production Build
```bash
npm run build
```
*Expected: All 16 static and dynamic routes compile successfully.*

### 3. Comprehensive Evaluation Suite (Phase 7.5)
Run the 24-test automated agent verification suite:
```bash
npx tsx scratch/test-phase-7-5.ts
```
*Result: 24 / 24 Tests Passed (100% Pass Rate).*

---

## 15. Live Demonstration Sequence (5–10 Minutes)

Follow this sequence for an end-to-end evaluation demonstration:

1. **Dashboard Overview**: Navigate to `http://localhost:3000`. Show academic stats, upcoming deliverables, and click **"Open AI Chat Tutor"**.
2. **Empty Chat State**: View the welcome screen (*"Hi! I'm your AI Student Agent."*) and the 5 starter cards.
3. **General Conceptual Question (Zero Tools)**:
   - Ask: `"What is binary search?"`
   - Observe: 0 tools invoked, no fake document citations, clear academic explanation.
4. **Positive RAG with Source Citations**:
   - Ask: `"Explain Timsort using my uploaded notes."`
   - Observe: `Searching your notes...` indicator, `✓ Searched your notes` badge, chunk streaming, and citation card for `CS301_Timsort_Notes.pdf`.
5. **Conversational Memory Follow-Up**:
   - Ask: `"What are its advantages?"`
   - Observe: 0 tools called, answers in context of Timsort.
6. **Fresh RAG Search**:
   - Ask: `"Search my notes again for Timsort."`
   - Observe: Explicit re-search triggers fresh `searchNotes` call and regenerates citations.
7. **Assignment Tool**:
   - Ask: `"What assignments do I have?"`
   - Observe: `getAssignments` executed, real PostgreSQL records displayed.
8. **Upcoming Deadlines Tool**:
   - Ask: `"What deadlines do I have this week?"`
   - Observe: `getUpcomingDeadlines` called with `days: 7`.
9. **Multi-Tool Reasoning**:
   - Ask: `"Tell me about myself and create a study plan."`
   - Observe: Agent runs `getStudentProfile` followed by `createStudyPlan`.
10. **Conversational Refinement**:
    - Ask: `"Make Day 3 easier."`
    - Observe: Plan adjusted directly without re-querying the database.
11. **Negative RAG (Anti-Hallucination)**:
    - Ask: `"Explain binary search using my uploaded notes."`
    - Observe: `searchNotes` called, reports no notes found, zero fake citations.

---

## 16. Project Documentation Directory

- 📐 [Technical Architecture](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/TECHNICAL_ARCHITECTURE.md)
- 🗄️ [Database Architecture & Prisma Models](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/DATABASE.md)
- 📚 [RAG & Vector Retrieval Pipeline](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/RAG.md)
- 🛠️ [Agent Tools Specification](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/AGENT_TOOLS.md)
- 🎬 [Live Demonstration Script](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/DEMO_SCRIPT.md)
- 📊 [Project Presentation Slides](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/PRESENTATION.md)
- 🎓 [Viva & Technical Interview Q&A](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/docs/VIVA_QUESTIONS.md)
- ✅ [Phase 7.5 Verification Report](file:///c:/Users/ASUS/OneDrive/Desktop/ai-student-agent/PHASE_7_5_VERIFICATION_REPORT.md)
