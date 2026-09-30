# 🎓 AI Student Agent

A modern full-stack academic co-pilot built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL**, and **OpenAI API**.

Designed specifically for university students to track coursework deadlines, master conceptual lecture topics, optimize study sprints, manage weekly class timetables, and simulate technical interview readiness.

---

## 🌟 Key Features

* **Clean & Professional Student Dashboard**: Real-time academic metrics (GPA, deadlines, weekly study hours, today's classes), priority badges, schedule timeline, and quick-action shortcuts.
* **Contextual AI Chat Mentor (`/chat`)**: Multi-persona agent switcher (Academic Tutor, Study Planner, Assignment Advisor, Career Coach) with OpenAI integration and offline simulation mode.
* **Sprint Study Planner (`/study-plan`)**: Weekly goal tracking, interactive milestone checklist, and AI schedule optimizer.
* **Assignments & Coursework Manager (`/assignments`)**: Urgency calculation, days remaining counters, status filters (Pending, In Progress, Completed), and AI problem breakdown action.
* **Notes & AI Summaries (`/notes`)**: Lecture note repository with keyword search, active-recall key takeaways, and AI summary previews.
* **Interactive Weekly Timetable (`/timetable`)**: Visual 5-day grid schedule with lecture and lab badges, room locations, and iCal export ready.
* **Career & Internship Roadmap (`/career`)**: Engineering skill matrix benchmark, target internship roles, hackathons tracker, and mock interview triggers.
* **Modular Extensibility**: Built-in registries for Agent Tools, Memory, RAG embeddings, and Authentication hooks.

---

## 🏗️ Architecture & Folder Structure

```
ai-student-agent/
├── prisma/
│   └── schema.prisma                 # PostgreSQL database schema (Student, Course, Assignment, Note, Timetable, StudyPlan, AgentSession)
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Backend API routes
│   │   │   ├── chat/route.ts         # OpenAI chat completion & simulation endpoint
│   │   │   ├── dashboard/route.ts    # Dashboard metrics and schedule endpoint
│   │   │   ├── assignments/route.ts  # Assignments query and status filter endpoint
│   │   │   └── notes/route.ts        # Lecture notes and search query endpoint
│   │   ├── (routes)/
│   │   │   ├── dashboard/            # /dashboard (Main Student Dashboard)
│   │   │   ├── chat/                 # /chat (AI Tutor & Academic Assistant)
│   │   │   ├── study-plan/           # /study-plan (Weekly Sprint & Milestones)
│   │   │   ├── assignments/          # /assignments (Coursework & Problem Sets)
│   │   │   ├── notes/                # /notes (Lecture Notes & AI Summaries)
│   │   │   ├── timetable/            # /timetable (Weekly Class Schedule Grid)
│   │   │   └── career/               # /career (Technical Skills & Mock Interview Prep)
│   │   ├── globals.css               # Tailwind CSS custom themes & dark mode styling
│   │   ├── layout.tsx                # App root layout with metadata
│   │   └── page.tsx                  # Root redirect to /dashboard
│   ├── components/
│   │   ├── layout/                   # Layout shell, Sidebar, Header, Mobile Drawer
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── dashboard/                # Dashboard widgets
│   │   │   ├── StatCard.tsx
│   │   │   ├── UpcomingAssignments.tsx
│   │   │   ├── DailySchedule.tsx
│   │   │   ├── QuickAIAssistant.tsx
│   │   │   ├── StudyProgress.tsx
│   │   │   └── QuickActionButtons.tsx
│   │   └── ui/                       # Reusable UI primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorAlert.tsx
│   ├── lib/
│   │   ├── env.ts                    # Safe environment variable validation
│   │   ├── prisma.ts                 # Prisma Client singleton with connection recovery
│   │   ├── mock-data.ts              # Fallback academic data when Postgres is offline
│   │   └── utils.ts                  # cn, date formatters, and priority styles
│   ├── services/
│   │   ├── ai/                       # AI Agent services
│   │   │   ├── openai.ts             # OpenAI client and error-handling wrapper
│   │   │   ├── prompts.ts            # Persona prompt engineering system
│   │   │   └── agent-types.ts        # Agent, Tool, Memory & RAG interfaces
│   │   └── tools/                    # Modular tool registry for future function-calling
│   │       ├── tool-definition.ts    # Tool manager class and OpenAI schema converter
│   │       └── index.ts              # Sample GPA and assignment tools
│   └── types/
│       └── index.ts                  # Shared TypeScript interfaces
├── .env.example                      # Template of environment variables
├── .env.local                        # Active local environment configuration
└── package.json
```

---

## ⚙️ Environment Variables

The project uses `.env.local` to securely manage credentials. A documented template is provided in `.env.example`:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string for Prisma | `postgresql://postgres:postgres@localhost:5432/ai_student_agent?schema=public` |
| `OPENAI_API_KEY` | OpenAI API key for live GPT-4o reasoning | `sk-proj-...` |
| `OPENAI_MODEL` | OpenAI model identifier | `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_NAME` | Display name of the application | `AI Student Agent` |
| `NEXT_PUBLIC_APP_URL` | Application root URL | `http://localhost:3000` |

> 💡 **Graceful Fallback Mode**: If `DATABASE_URL` or `OPENAI_API_KEY` are unset or placeholders, the application automatically runs in **offline mode**, using in-memory mock student data and an intelligent academic tutor simulator. No hard crashes will occur.

---

## 🚀 How to Run the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Verify `.env.local` has your credentials or leave defaults for local simulation:
```bash
cp .env.example .env.local
```

### 3. Setup PostgreSQL & Prisma (Optional for live DB)
Generate Prisma Client:
```bash
npx prisma generate
```
Push database schema to PostgreSQL:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application will redirect to the `/dashboard`.

### 5. Build for Production
```bash
npm run build
npm run start
```
