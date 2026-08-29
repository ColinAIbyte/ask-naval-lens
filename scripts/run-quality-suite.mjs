import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const baseUrl = (process.env.QUALITY_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const cases = JSON.parse(await readFile(new URL('../tests/quality-cases.json', import.meta.url), 'utf8'));
const report = [];

for (const testCase of cases) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `asknaval_visitor=${randomUUID()}` },
    body: JSON.stringify({ question: testCase.question, topic: testCase.topic, locale: testCase.locale ?? 'en' }),
  });
  const payload = await response.json();
  const latencyMs = Math.round(performance.now() - started);
  if (!response.ok) {
    report.push({ id: testCase.id, status: response.status, latencyMs, error: payload.error ?? 'unknown_error' });
    continue;
  }
  report.push({
    id: testCase.id,
    locale: testCase.locale ?? 'en',
    status: response.status,
    latencyMs,
    resultUrl: payload.resultUrl,
    coreProblem: payload.analysis.coreProblem,
    lensJudgment: payload.analysis.lensJudgment,
    frameworks: payload.analysis.frameworks.map((framework) => ({ name: framework.name, sources: framework.sources.map((source) => ({ title: source.title, url: source.url })) })),
    actions: payload.analysis.actions,
    followUpQuestions: payload.analysis.followUpQuestions,
    sources: payload.analysis.sources.map((source) => ({ title: source.title, url: source.url })),
  });
}

console.log(JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), report }, null, 2));
if (report.some((item) => item.status !== 200)) process.exitCode = 1;
