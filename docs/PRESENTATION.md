# AI Student Agent — Project Presentation Deck

A structured 12-slide presentation outline for academic evaluations, project vivas, and technical demonstrations.

---

### Slide 1: Title & Overview
# 🎓 AI Student Agent
### Autonomous Academic Co-Pilot & Grounded Study Assistant
**Presenter**: University Engineering Team  
**Stack**: Next.js 16, TypeScript, Prisma ORM, PostgreSQL, Ollama (Llama 3.2 & nomic-embed-text)  
**Core Innovation**: Privacy-first, local agentic AI with RAG over lecture notes, verified tool execution, and real-time streaming.

---

### Slide 2: Problem Statement
## The Academic Overload Problem
- **Information Fragmentation**: Notes, handouts, syllabi, and assignment briefs are scattered across different portals, cloud drives, and local folders.
- **Lost Deadlines**: Complex semester schedules make tracking assignment priorities difficult.
- **Generic LLM Hallucinations**: Standard chatbots (ChatGPT, Claude) lack access to specific professor slides and frequently fabricate code and theoretical details.
- **Privacy Concerns**: Uploading proprietary university course notes and student data to cloud AI vendors risks privacy violations.

---

### Slide 3: Proposed Solution
## The AI Student Agent Solution
- **Local & Private**: Powered completely on-premise by **Ollama** using **Llama 3.2** and **nomic-embed-text**.
- **Grounded RAG Engine**: Indexes uploaded course PDFs into PostgreSQL with vector similarity search ($\ge 0.58$) and verifiable source citations.
- **Autonomous Tool Execution**: Connects directly to relational student data for live assignment tracking, deadline filtering, and profile retrieval.
- **Contextual Academic Planning**: Generates personalized, multi-day study schedules combining deadlines and revision topics.

---

### Slide 4: Target Users
## Student Personas & Beneficiaries
- **Undergraduate & Graduate Students**: Balancing 4–6 rigorous technical courses simultaneously.
- **Computer Science & Engineering Majors**: Needing precise algorithmic breakdowns, syntax examples, and proof explanations.
- **Academic Self-Learners**: Looking for an interactive mentor that can test recall on uploaded materials and adapt study routines dynamically.

---

### Slide 5: Key Features
## Core System Capabilities
1. **Dynamic Intent Gating**: Distinguishes conceptual questions from requests needing personal data.
2. **Positive & Negative RAG**: Cites source files when found; explicitly refuses to hallucinate when absent.
3. **Coursework & Deadline Management**: Real-time tracking with dynamic overdue calculation.
4. **Student Profile Integration**: Enrolled degree, department, semester, and technical skills awareness.
5. **Multi-Turn Study Plan Refinements**: Refines schedules (*"Make Day 3 easier"*) in-memory without extra tool calls.
6. **Progressive SSE Streaming**: Real-time token streaming with live tool activity badges.

---

### Slide 6: System Architecture
## End-to-End System Flow
```
User Query ──► Next.js Frontend ──► API Route (POST /api/chat)
                                            │
               ┌────────────────────────────┘
               ▼
      Agent Engine (agent.ts)
               │
      ├── Requires Student Tools?
      │     ├── No  ──► Direct Llama 3.2 Synthesis
      │     └── Yes ──► Tool Selection Loop (MAX 5 Turns)
      │                   ├── searchNotes (RAG Vector Search)
      │                   ├── getAssignments (PostgreSQL)
      │                   ├── getUpcomingDeadlines (PostgreSQL)
      │                   ├── getStudentProfile (PostgreSQL)
      │                   └── createStudyPlan (PostgreSQL + RAG)
      │
      ▼
Synthesized Answer + Deduplicated Citations (📚 Sources)
      │
      ▼ (Server-Sent Events: status -> tool_call -> chunk -> done)
Interactive Web Interface
```

---

### Slide 7: RAG Pipeline
## High-Precision Document Retrieval
1. **Text Extraction**: Server-side parsing of uploaded PDFs with `unpdf`.
2. **Recursive Chunking**: 800 characters with 150-character sliding overlap.
3. **Dense Embeddings**: 768-dimensional normalized vectors via `nomic-embed-text`.
4. **Similarity Retrieval**: Cosine similarity against user chunks with a strict **0.58** relevance threshold.
5. **Anti-Hallucination Guardrails**: Suppresses fabricated citations if chunks are absent (`hasResults: false`).

---

### Slide 8: AI Agent + 5 Core Tools
## Verified Tool Implementations
| Tool Name | Operation | Security & Scope |
|---|---|---|
| `searchNotes` | Semantic cosine retrieval over personal notes | Bounded to `context.userId` |
| `getAssignments` | Coursework filtered by status (`pending`, `completed`, `overdue`) | Dynamic server-side overdue check |
| `getUpcomingDeadlines` | Upcoming submissions within $[now, now + N\text{ days}]$ | Excludes past and completed items |
| `getStudentProfile` | Enrolled degree, semester, skills | Whitelisted fields (no secrets) |
| `createStudyPlan` | Multi-day schedule balancing deadlines and topics | Grounded distinction vs real tasks |

---

### Slide 9: Database Architecture
## Relational & Vector Storage with PostgreSQL + Prisma
- **`users`**: Central account identity.
- **`student_profiles`**: Degree, current semester, technical skills.
- **`assignments`**: Coursework titles, due dates, priority, status.
- **`note_documents`**: Uploaded lecture PDFs, titles, file sizes.
- **`document_chunks`**: Chunk text, chunk index, and 768-dim float vector array.
- **`chat_sessions` & `chat_messages`**: Multi-turn conversation persistence with bounded window loading.
- **Strict Data Isolation**: Every relational query filters on `userId = context.userId`.

---

### Slide 10: Security & Reliability
## Enterprise-Grade Hardening
- **No Client User ID Tampering**: Client cannot supply or alter `userId`.
- **Prompt Injection Defense**: Ingested notes containing malicious text are isolated in tool outputs and cannot override system instructions.
- **Sanitized Errors**: No Prisma stack traces, SQL syntax, or server paths returned to the client.
- **Graceful Failure States**: Unreachable Ollama returns a clean HTTP 503 alert; DB latency does not crash generation.

---

### Slide 11: Testing & Verification Results
## Rigorous Automated Evaluation (Phase 7.5)
- **Automated Test Suite**: `scratch/test-phase-7-5.ts`
- **Results**: **24 / 24 Tests Passed (100% Success Rate)**
- **TypeScript**: `npx tsc --noEmit` $\rightarrow$ **0 Errors**
- **Production Build**: `npm run build` $\rightarrow$ **Exit Code 0** (All 16 routes compiled)
- **Measured Performance**:
  - Streaming first-chunk latency: **115 ms**
  - Tool retrieval + synthesis: **2.1 s – 4.4 s**
  - Multi-tool orchestration: **7.1 s**

---

### Slide 12: Future Scope & Roadmap
## Next Evolution of AI Student Agent
1. **Multi-Modal Document Parsing**: Adding native OCR support for scanned physical notebook pages.
2. **Multi-Agent Collaboration**: Specialized sub-agents (e.g. Code Reviewer, Proof Assistant, Exam Simulator).
3. **Calendar & LMS Sync**: Two-way synchronization with Canvas, Blackboard, and Google Calendar.
4. **Offline Distributed Edge**: Packaging model execution into a native desktop application using Electron or Tauri.
