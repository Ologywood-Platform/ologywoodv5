import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const assetsDir = resolve(process.cwd(), "dist/public/assets");
const budgets = [
  { label: "application shell", prefix: "index-", maxBytes: 600_000 },
  { label: "homepage route", prefix: "Home-", maxBytes: 60_000 },
  { label: "artist dashboard route", prefix: "ArtistDashboardV3-", maxBytes: 240_000 },
  { label: "venue dashboard route", prefix: "VenueDashboard-", maxBytes: 160_000 },
];

const files = await readdir(assetsDir);
const failures = [];

for (const budget of budgets) {
  const matches = files.filter((file) => file.startsWith(budget.prefix) && file.endsWith(".js"));
  if (matches.length === 0) {
    failures.push(`${budget.label}: expected at least one ${budget.prefix}*.js asset, found none`);
    continue;
  }

  const sizedMatches = await Promise.all(matches.map(async (file) => ({
    file,
    bytes: (await stat(join(assetsDir, file))).size,
  })));
  const { file, bytes } = sizedMatches.sort((a, b) => b.bytes - a.bytes)[0];
  const status = bytes <= budget.maxBytes ? "OK" : "OVER";
  console.log(`${status} ${budget.label}: ${file} ${bytes} bytes / ${budget.maxBytes} budget`);
  if (bytes > budget.maxBytes) {
    failures.push(`${budget.label}: ${bytes} bytes exceeds ${budget.maxBytes} byte budget`);
  }
}

if (failures.length > 0) {
  console.error("\nBundle budget check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
