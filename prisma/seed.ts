import { PrismaClient, Priority, Status, SessionStatus, DayOfWeek, MessageRole } from '@prisma/client';

// Load local environment files if running directly with tsx
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch {
  // fallback
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for AI Student Agent...');

  // 1. Create / Upsert Demo Student User
  const user = await prisma.user.upsert({
    where: { email: 'alex.rivera@university.edu' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'alex.rivera@university.edu',
      password: 'demo_auth_hash_placeholder', // auth placeholder for development
    },
  });

  console.log(`✅ User verified: ${user.name} (${user.email})`);

  // 2. Create / Upsert Student Profile
  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      college: 'Institute of Technology & AI Sciences',
      course: 'B.Tech Computer Science & Artificial Intelligence',
      semester: 4,
      skills: [
        'Python',
        'TypeScript',
        'Next.js',
        'PyTorch',
        'PostgreSQL',
        'Prisma ORM',
        'Algorithms & Complexity',
      ],
      careerGoals: 'AI/ML Engineering Intern at a top-tier research or product tech company',
    },
  });

  console.log(`✅ Student Profile initialized for semester ${profile.semester}`);

  // 3. Create Core Subjects
  const subjectsData = [
    {
      name: 'Algorithms & Complexity (CS301)',
      description: 'Asymptotic analysis, divide & conquer, dynamic programming, and graph algorithms.',
    },
    {
      name: 'Deep Learning & Neural Nets (AI402)',
      description: 'Backpropagation, CNNs, Transformers, and loss landscape optimization.',
    },
    {
      name: 'Database Systems & SQL (DS205)',
      description: 'Relational algebra, BCNF/3NF normalization, PostgreSQL indexing, and transactions.',
    },
    {
      name: 'Linear Algebra & Optimization (MATH210)',
      description: 'Vector spaces, eigenvalues, SVD decomposition, and convex optimization.',
    },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: s.name,
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: s.name,
        description: s.description,
      },
    });
    subjects.push(subject);
  }

  console.log(`✅ Created ${subjects.length} subjects.`);

  const [algoSubject, aiSubject, dbSubject, mathSubject] = subjects;

  // 4. Create Assignments
  const assignmentsData = [
    {
      title: 'Dynamic Programming & Graph Theory Problem Set',
      description: 'Solve Bellman-Ford optimization proofs and longest common subsequence implementations.',
      subject: algoSubject.name,
      subjectId: algoSubject.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 28), // ~1 day
      priority: Priority.URGENT,
      status: Status.IN_PROGRESS,
    },
    {
      title: 'Convolutional Neural Network Architecture Benchmark',
      description: 'Benchmark ResNet-18 vs standard CNN on CIFAR-10 with detailed loss curve analysis.',
      subject: aiSubject.name,
      subjectId: aiSubject.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72), // ~3 days
      priority: Priority.HIGH,
      status: Status.PENDING,
    },
    {
      title: 'Database Normalization & Query Tuning Report',
      description: 'Decompose relation to BCNF and benchmark indexed PostgreSQL queries with EXPLAIN ANALYZE.',
      subject: dbSubject.name,
      subjectId: dbSubject.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120), // 5 days
      priority: Priority.MEDIUM,
      status: Status.PENDING,
    },
    {
      title: 'SVD Decomposition & Matrix Projections Lab',
      description: 'Analyze singular value decomposition on high-dimensional image matrices.',
      subject: mathSubject.name,
      subjectId: mathSubject.id,
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // completed yesterday
      priority: Priority.LOW,
      status: Status.COMPLETED,
    },
  ];

  await prisma.assignment.deleteMany({ where: { userId: user.id } });
  for (const a of assignmentsData) {
    await prisma.assignment.create({
      data: {
        userId: user.id,
        ...a,
      },
    });
  }
  console.log(`✅ Seeded ${assignmentsData.length} assignments.`);

  // 5. Create Study Sessions
  const sessionsData = [
    {
      subjectId: algoSubject.id,
      topic: 'Bellman-Ford Proofs & SPFA optimization',
      duration: 60,
      date: new Date(Date.now() - 1000 * 60 * 60 * 4),
      status: SessionStatus.COMPLETED,
    },
    {
      subjectId: aiSubject.id,
      topic: 'PyTorch CNN Backprop & Gradient Checkpointing',
      duration: 90,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: SessionStatus.COMPLETED,
    },
    {
      subjectId: dbSubject.id,
      topic: 'SQL BCNF & 3NF Functional Dependency Covers',
      duration: 45,
      date: new Date(Date.now() + 1000 * 60 * 60 * 8),
      status: SessionStatus.PLANNED,
    },
  ];

  await prisma.studySession.deleteMany({ where: { userId: user.id } });
  for (const s of sessionsData) {
    await prisma.studySession.create({
      data: {
        userId: user.id,
        ...s,
      },
    });
  }
  console.log(`✅ Seeded ${sessionsData.length} study sessions.`);

  // 6. Create Timetables
  const timetableData = [
    { subjectId: algoSubject.id, day: DayOfWeek.MONDAY, startTime: '09:00', endTime: '10:30' },
    { subjectId: aiSubject.id, day: DayOfWeek.MONDAY, startTime: '11:00', endTime: '12:30' },
    { subjectId: dbSubject.id, day: DayOfWeek.MONDAY, startTime: '14:00', endTime: '15:15' },
    { subjectId: mathSubject.id, day: DayOfWeek.TUESDAY, startTime: '10:00', endTime: '11:30' },
    { subjectId: algoSubject.id, day: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '10:30' },
    { subjectId: dbSubject.id, day: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '16:00' },
    { subjectId: mathSubject.id, day: DayOfWeek.THURSDAY, startTime: '10:00', endTime: '11:30' },
    { subjectId: aiSubject.id, day: DayOfWeek.THURSDAY, startTime: '12:00', endTime: '13:30' },
  ];

  await prisma.timetable.deleteMany({ where: { userId: user.id } });
  for (const t of timetableData) {
    await prisma.timetable.create({
      data: {
        userId: user.id,
        ...t,
      },
    });
  }
  console.log(`✅ Seeded ${timetableData.length} weekly timetable entries.`);

  // 7. Create ChatSession with initial ChatMessages
  const chatSession = await prisma.chatSession.create({
    data: {
      userId: user.id,
      title: 'CS301 Graph Theory & Algorithms Guidance',
      messages: {
        create: [
          {
            role: MessageRole.USER,
            content: 'What is the exact asymptotic difference between Dijkstra and Bellman-Ford algorithms?',
          },
          {
            role: MessageRole.ASSISTANT,
            content: `### Comparison of Shortest Path Algorithms

1. **Dijkstra's Algorithm**:
   - **Time Complexity**: $\\mathcal{O}((V + E) \\log V)$ using a Min-Heap / Fibonacci Heap.
   - **Constraint**: Edge weights must all be non-negative ($\\ge 0$). Fails or loops on negative edges.
   - **Approach**: Greedy exploration.

2. **Bellman-Ford Algorithm**:
   - **Time Complexity**: $\\mathcal{O}(V \\times E)$.
   - **Advantage**: Handles negative edge weights and can detect **negative weight cycles** by running one additional relaxation step ($|V|$th pass).
   - **Approach**: Dynamic programming / Edge relaxation.`,
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded ChatSession with ID: ${chatSession.id}`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
