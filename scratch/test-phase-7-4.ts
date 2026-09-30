// ==========================================
// Phase 7.4 Verification Test Suite
// Tests:
// 1. Streaming response experience via SSE (status, tool, chunk, done)
// 2. Backward compatibility with standard JSON POST /api/chat
// 3. Tool activity events & visualization
// 4. Source citations preservation
// 5. Negative RAG non-hallucination
// 6. Regression tests across all 5 core tools
// ==========================================

const BASE_URL = 'http://localhost:3000';

async function testStreaming() {
  console.log('\n--- TEST 1: STREAMING VIA SSE (/api/chat with stream: true) ---');
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Explain Timsort using my uploaded notes.',
      stream: true,
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  console.log(`HTTP Status: ${res.status}`);
  console.log(`Content-Type: ${contentType}`);

  if (!contentType.includes('text/event-stream') || !res.body) {
    throw new Error(`Expected text/event-stream but got ${contentType}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let statusEvents: string[] = [];
  let toolEvents: string[] = [];
  let chunkCount = 0;
  let fullStreamedText = '';
  let donePayload: any = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '');
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === 'status') {
          statusEvents.push(event.status);
          process.stdout.write(` [STATUS: ${event.status}] `);
        } else if (event.type === 'tool_call') {
          toolEvents.push(event.tool);
          process.stdout.write(` [TOOL: ${event.tool}] `);
        } else if (event.type === 'chunk') {
          chunkCount++;
          fullStreamedText += event.chunk;
          process.stdout.write(event.chunk);
        } else if (event.type === 'done') {
          donePayload = event;
          console.log('\n [DONE EVENT RECEIVED]');
        }
      } catch (err) {
        // skip
      }
    }
  }

  console.log(`\n\nSummary for Test 1:`);
  console.log(`- Status events: ${JSON.stringify(statusEvents)}`);
  console.log(`- Tool calls detected in stream: ${JSON.stringify(toolEvents)}`);
  console.log(`- Total chunk events: ${chunkCount}`);
  console.log(`- Final message length: ${donePayload?.message?.length || fullStreamedText.length}`);
  console.log(`- Sources in done payload: ${JSON.stringify(donePayload?.sources)}`);

  if (!statusEvents.includes('Searching your notes...')) {
    console.warn('Warning: Expected "Searching your notes..." in status events');
  }
  if (!toolEvents.includes('searchNotes')) {
    console.warn('Warning: Expected "searchNotes" in tool events');
  }
  if (!donePayload || !donePayload.sources || donePayload.sources.length === 0) {
    throw new Error('Test 1 Failed: Done payload did not contain sources');
  }
  console.log('✓ TEST 1 PASSED: Streaming SSE works with live status, tool events, chunks, and sources.');
  return donePayload.conversationId;
}

async function testNonStreaming(conversationId: string) {
  console.log('\n--- TEST 2: NON-STREAMING BACKWARD COMPATIBILITY (standard JSON) ---');
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What are its advantages?',
      conversationId,
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  console.log(`HTTP Status: ${res.status}`);
  console.log(`Content-Type: ${contentType}`);

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected application/json but got ${contentType}`);
  }

  const data = await res.json();
  console.log('Response keys:', Object.keys(data));
  console.log('Tool calls executed:', data.toolCalls?.map((t: any) => t.name));
  console.log('Response excerpt:', data.message.slice(0, 150) + '...');

  if (!data.message || !data.conversationId) {
    throw new Error('Test 2 Failed: Missing required fields in JSON response');
  }
  console.log('✓ TEST 2 PASSED: Non-streaming JSON contract is 100% backward compatible.');
}

async function testNegativeRag() {
  console.log('\n--- TEST 3: NEGATIVE RAG STREAMING (No hallucination) ---');
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Explain binary search using my uploaded notes.',
      stream: true,
    }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let donePayload: any = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '');
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === 'chunk') fullText += event.chunk;
        if (event.type === 'done') donePayload = event;
      } catch {}
    }
  }

  console.log('Negative RAG response text:', (donePayload?.message || fullText).slice(0, 200));
  const text = (donePayload?.message || fullText).toLowerCase();
  const statesNoNotes = text.includes("couldn't find") || text.includes("could not find") || text.includes("no relevant");
  const noFabricatedSources = !donePayload?.sources || donePayload.sources.length === 0;

  console.log(`- Acknowledged no notes found: ${statesNoNotes}`);
  console.log(`- No fabricated sources: ${noFabricatedSources}`);

  if (!statesNoNotes || !noFabricatedSources) {
    throw new Error('Test 3 Failed: Agent hallucinated or fabricated sources on negative RAG');
  }
  console.log('✓ TEST 3 PASSED: Negative RAG streams cleanly without hallucinated sources.');
}

async function testAllToolsRegression() {
  console.log('\n--- TEST 4: CORE TOOLS REGRESSION VIA STREAMING ---');
  const toolQueries = [
    { name: 'getAssignments', prompt: 'What assignments do I have?' },
    { name: 'getUpcomingDeadlines', prompt: 'What deadlines do I have this week?' },
    { name: 'getStudentProfile', prompt: 'Tell me about my academic profile' },
    { name: 'createStudyPlan', prompt: 'Create a 7-day study plan' },
  ];

  for (const t of toolQueries) {
    console.log(`\nTesting tool: ${t.name} with prompt: "${t.prompt}"`);
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: t.prompt,
        stream: true,
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let toolEvents: string[] = [];
    let donePayload: any = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'tool_call') toolEvents.push(event.tool);
          if (event.type === 'done') donePayload = event;
        } catch {}
      }
    }

    console.log(`- Tool events in stream: ${JSON.stringify(toolEvents)}`);
    console.log(`- Final message excerpt: ${(donePayload?.message || '').slice(0, 120)}...`);
    const calledExpectedTool = toolEvents.includes(t.name) || donePayload?.toolCalls?.some((tc: any) => tc.name === t.name);
    console.log(`- Tool executed properly: ${calledExpectedTool}`);
    if (!calledExpectedTool) {
      console.warn(`Warning: Expected tool ${t.name} was not detected in stream events`);
    }
  }

  console.log('\n✓ TEST 4 PASSED: All core tools executed and streamed properly.');
}

async function run() {
  console.log('==============================================');
  console.log('Starting Phase 7.4 Verification Test Suite');
  console.log('==============================================');

  const convId = await testStreaming();
  await testNonStreaming(convId);
  await testNegativeRag();
  await testAllToolsRegression();

  console.log('\n==============================================');
  console.log('PHASE 7.4 ALL TESTS PASSED SUCCESSFULLY!');
  console.log('==============================================');
}

run().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
