# Live Demonstration Walkthrough Script (5–10 Minutes)

This script provides an exact, step-by-step procedure to showcase the **AI Student Agent** during a live evaluation, project defense, or presentation.

---

## Prerequisites Before Demonstration

1. **Ollama Running**:
   ```bash
   ollama serve
   ```
   *Verify models `llama3.2` and `nomic-embed-text` are pulled.*
2. **Next.js Dev Server Running**:
   ```bash
   npm run dev
   ```
   *Accessible at `http://localhost:3000`.*
3. **Database Populated**: Ensure default student account (`Alex Rivera`) and course note (`CS301_Timsort_Notes.pdf`) are loaded.

---

## Demonstration Script

### STEP 1: Open the Student Dashboard
- **Action**: Open browser and navigate to:
  `http://localhost:3000`
- **What to Highlight**:
  - Point out the unified academic hub: Current Semester, Active GPA, Upcoming Deliverables, and Today's Schedule.
  - Highlight the **Academic Agent Co-Pilot** card.
- **Narrative**:
  > *"Here is the student dashboard. Notice that our student, Alex Rivera, has active coursework, a weekly schedule, and access to an embedded AI Student Agent co-pilot."*

---

### STEP 2: Launch the AI Student Agent
- **Action**: Click the **"Open AI Chat Tutor"** button or navigate to:
  `http://localhost:3000/chat`
- **What to Highlight**:
  - Clean glassmorphism dark-mode UI.
  - Left sidebar showing session history with delete buttons.
  - Responsive layout for both mobile and desktop viewports.

---

### STEP 3: Welcome Screen & Starter Prompts
- **Action**: Point out the empty chat interface before entering any text.
- **What to Highlight**:
  - The hero title: *"Hi! I'm your AI Student Agent."*
  - The 5 quick-starter prompt cards:
    1. *Explain Uploaded Notes*
    2. *View Assignments*
    3. *Upcoming Deadlines*
    4. *Student Profile*
    5. *Create Study Plan*
- **Narrative**:
  > *"When starting a new conversation, the student is greeted by an intelligent workspace with 5 one-click starter actions matching the agent's core capabilities."*

---

### STEP 4: Conceptual Question (Zero-Tool Direct Answer)
- **Prompt**:
  ```text
  What is binary search?
  ```
- **What to Observe**:
  - The agent responds directly and pedagogically.
  - Notice the **absence** of document searches or tool badges.
  - Zero fabricated citation blocks appear.
- **Narrative**:
  > *"Notice how the agent knows not to search private notes for general knowledge questions. It recognizes general computer science queries and answers directly without burning database or retrieval overhead."*

---

### STEP 5: Positive RAG with Grounded Source Citation
- **Prompt**:
  ```text
  Explain Timsort using my uploaded notes.
  ```
- **What to Observe**:
  - Activity indicator pulses: `Searching your notes...`
  - Tool badge renders: `✓ Searched your notes`
  - Tokens stream progressively in real time.
  - Answer details hybrid merge/insertion sort, natural runs, and galloping mode.
  - Citation section appears at the end:
    ```markdown
    📚 **Sources**
    - `CS301_Timsort_Notes.pdf`
    ```
- **Narrative**:
  > *"When asked about personal uploaded notes, the agent triggers semantic vector search, retrieves the top chunks from PostgreSQL, streams the answer, and cites the exact PDF without hallucinating page numbers."*

---

### STEP 6: Conversational Memory (Follow-Up Without Retrieval)
- **Prompt**:
  ```text
  What are its advantages?
  ```
- **What to Observe**:
  - The agent resolves *"its"* to Timsort from previous messages.
  - Explains $\mathcal{O}(n)$ best-case performance on partially sorted data.
  - **No tool call occurs**. The agent maintains context without redundant database queries.
- **Narrative**:
  > *"Here, the agent resolves the pronoun 'its' to Timsort using conversation memory. It does not needlessly query the database a second time, preserving continuity and speed."*

---

### STEP 7: Fresh RAG Search (Explicit Re-Query)
- **Prompt**:
  ```text
  Search my notes again for Timsort.
  ```
- **What to Observe**:
  - The agent detects the explicit instruction to search again.
  - The `searchNotes` tool executes freshly.
  - The tool execution badge and source citations regenerate.
- **Narrative**:
  > *"When the student explicitly asks to 'search again', the agent detects fresh intent and queries PostgreSQL anew."*

---

### STEP 8: Assignment Management Tool
- **Prompt**:
  ```text
  What assignments do I have?
  ```
- **What to Observe**:
  - Activity indicator: `Checking your assignments...`
  - Tool badge: `✓ Checked assignments`
  - Returns real assignments from PostgreSQL with title, subject, due date, priority, and status.
- **Narrative**:
  > *"The agent invokes the `getAssignments` tool, querying PostgreSQL for real coursework without inventing phantom homework."*

---

### STEP 9: Upcoming Deadlines Tool
- **Prompt**:
  ```text
  What deadlines do I have this week?
  ```
- **What to Observe**:
  - Tool invoked: `getUpcomingDeadlines` with parameter `days: 7`.
  - Excludes already completed and overdue items.
  - Lists deliverables in ascending chronological order.
- **Narrative**:
  > *"Here, `getUpcomingDeadlines` filters for deliverables due within 7 days, helping the student prioritize imminent work."*

---

### STEP 10: Multi-Tool Reasoning
- **Prompt**:
  ```text
  Tell me about myself and create a study plan.
  ```
- **What to Observe**:
  - The agent calls **both** `getStudentProfile` and `createStudyPlan` in sequence.
  - Retrieves Alex Rivera's enrolled course (*B.Tech Computer Science & AI*).
  - Builds a structured daily study plan addressing real coursework and skills.
- **Narrative**:
  > *"Notice multi-tool orchestration: the agent executed `getStudentProfile` to understand the student's background, and fed that directly into `createStudyPlan`."*

---

### STEP 11: Conversational Plan Refinement
- **Prompt**:
  ```text
  Make Day 3 easier.
  ```
- **What to Observe**:
  - The agent does not call database tools.
  - Modifies Day 3's workload directly in-memory, leaving the remaining days intact.
- **Narrative**:
  > *"In-memory conversational refinement: the agent adjusts the existing plan using history rather than generating a brand new schedule from scratch."*

---

### STEP 12: Negative RAG (Honest Anti-Hallucination)
- **Prompt**:
  ```text
  Explain binary search using my uploaded notes.
  ```
- **What to Observe**:
  - Activity indicator pulses: `Searching your notes...`
  - Tool executes: `searchNotes({ query: "binary search" })`.
  - Vector similarity returns `hasResults: false`.
  - The agent responds honestly:
    *"I couldn't find relevant information in your uploaded notes. I can still give you a general explanation if you'd like."*
  - **Zero citations or sources appear**.
- **Narrative**:
  > *"This is negative RAG. The agent checks the vector store, detects no matching chunks for binary search in the uploaded notes, and honestly tells the student rather than hallucinating fake citations."*

---

## Demonstration Complete
You have showcased:
- Real local LLM reasoning (Llama 3.2).
- Zero-tool classification for conceptual questions.
- Positive RAG with grounded citations.
- Conversational follow-ups and memory.
- Fresh-data detection.
- Database tool execution (`getAssignments`, `getUpcomingDeadlines`, `getStudentProfile`).
- Multi-tool reasoning.
- In-memory plan refinement.
- Honest negative RAG anti-hallucination.
