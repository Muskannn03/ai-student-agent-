import { runStudentAgent } from '../lib/ai/agent';

async function testAgent() {
  console.log('🧪 Testing Modular AI Student Agent Service...\n');

  const testProfile = {
    name: 'Alex Rivera',
    college: 'School of Computing & AI Sciences',
    course: 'B.Tech Computer Science & AI',
    semester: 4,
    skills: ['Python', 'TypeScript', 'Next.js', 'PyTorch', 'PostgreSQL'],
    careerGoals: 'AI/ML Engineer',
  };

  // 1. Conceptual question test
  console.log('1️⃣ Test: Conceptual Question ("Explain operating systems")');
  const res1 = await runStudentAgent({
    userMessage: 'Explain operating systems and their primary kernel subsystems.',
    studentProfile: testProfile,
    history: [],
  });

  console.log('Output model:', res1.model);
  console.log('Is simulated:', res1.isSimulated);
  console.log('Response preview:\n', res1.message.slice(0, 300), '...\n');

  // 2. Multi-turn conversation test
  console.log('2️⃣ Test: Multi-turn Conversation ("Help me create a study plan for OS")');
  const res2 = await runStudentAgent({
    userMessage: 'Help me create a 3-day study plan focusing on memory management and paging.',
    studentProfile: testProfile,
    history: [
      { role: 'user', content: 'Explain operating systems and their primary kernel subsystems.' },
      { role: 'assistant', content: res1.message },
    ],
  });

  console.log('Response preview:\n', res2.message.slice(0, 300), '...\n');
  console.log('✅ AI Student Agent Service executed successfully!');
}

testAgent().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
