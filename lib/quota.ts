export const FREE_ANALYSES_PER_WEEK = 3;

export function currentUsagePeriod(now = new Date()): string {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return `week:${monday.toISOString().slice(0, 10)}`;
}
