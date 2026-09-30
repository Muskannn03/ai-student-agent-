// Measurement script for Phase 7.5 Section 25: Performance Observations
const BASE = 'http://localhost:3000';

async function measure() {
  console.log('--- STARTING PERFORMANCE MEASUREMENTS ---');

  // 1. Normal Chat (Zero Tools)
  let t0 = Date.now();
  const res1 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is a stack?' }),
  });
  await res1.json();
  const latNormal = Date.now() - t0;
  console.log('LATENCY_NORMAL_CHAT:', latNormal, 'ms');

  // 2. Single Tool (getStudentProfile)
  t0 = Date.now();
  const res2 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Tell me about myself' }),
  });
  await res2.json();
  const latTool = Date.now() - t0;
  console.log('LATENCY_SINGLE_TOOL:', latTool, 'ms');

  // 3. RAG Retrieval (searchNotes)
  t0 = Date.now();
  const res3 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Explain Timsort using my uploaded notes.' }),
  });
  await res3.json();
  const latRag = Date.now() - t0;
  console.log('LATENCY_RAG:', latRag, 'ms');

  // 4. Multi-tool (getStudentProfile + createStudyPlan)
  t0 = Date.now();
  const res4 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Tell me about myself and create a study plan.' }),
  });
  await res4.json();
  const latMulti = Date.now() - t0;
  console.log('LATENCY_MULTI_TOOL:', latMulti, 'ms');

  // 5. Streaming First-Chunk Latency
  t0 = Date.now();
  const res5 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is binary search?', stream: true }),
  });
  const reader = res5.body!.getReader();
  const decoder = new TextDecoder();
  let firstChunkMs = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    if (text.includes('data: {"type":"chunk"')) {
      firstChunkMs = Date.now() - t0;
      break;
    }
  }
  // Cancel remainder
  reader.cancel().catch(() => {});
  console.log('LATENCY_STREAMING_FIRST_CHUNK:', firstChunkMs, 'ms');
  console.log('--- ALL MEASUREMENTS COMPLETED ---');
}

measure().catch(console.error);
