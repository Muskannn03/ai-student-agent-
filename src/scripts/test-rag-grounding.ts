import { prisma } from '../lib/prisma';
import { retrieveRelevantChunks } from '../lib/rag/retrievalService';

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user in database');

  const doc = await prisma.noteDocument.findFirst({
    where: { title: { contains: 'CHP 1' } },
    include: { chunks: { take: 5 } },
  });
  console.log('Doc Title:', doc?.title, 'FileName:', doc?.fileName, 'Total chunks in DB:', doc?.chunks.length);
  console.log('--- Chunk 0 preview ---:\n', doc?.chunks[0]?.content.slice(0, 300));
  console.log('--- Chunk 1 preview ---:\n', doc?.chunks[1]?.content.slice(0, 300));

  const queries = [
    'According to my uploaded notes on "CHP 1", what are the key concepts, formulas, and critical exam takeaways?',
    'According to CHP 1, explain the first topic exactly as given in the uploaded notes. Include the relevant text.',
    'What are the main headings in CHP 1? Answer only using the uploaded document.',
  ];

  for (const q of queries) {
    console.log('\n========================================');
    console.log('TESTING QUERY:', q);
    const result = await retrieveRelevantChunks({
      query: q,
      userId: user.id,
      topK: 5,
      minSimilarity: 0.25, // Let's check with 0.25 vs 0.45
    });
    console.log('Searched:', result.totalChunksSearched, 'Relevant found:', result.relevantChunks.length, 'Best similarity:', result.bestSimilarity);
    for (const [i, c] of result.relevantChunks.entries()) {
      console.log(`\n[Rank ${i + 1}] Similarity: ${c.similarity} | Chunk #${c.chunkIndex} (${c.fileName}):\n${c.content.slice(0, 200)}...`);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
