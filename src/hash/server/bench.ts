import { PASSWORD_ALGOS } from "../algorithms.ts";
import { hashPassword, verifyPassword } from "./index.ts";

const RUNS = Number(process.argv[2] ?? 7);
const password = "contraseña de prueba 🔐";
const samples = Object.fromEntries(Object.keys(PASSWORD_ALGOS).map((algo) => [algo, [] as number[]]));

for (let run = 0; run < RUNS; run++) {
  for (const algo of Object.values(PASSWORD_ALGOS)) {
    const hashed = await hashPassword(algo.id, password);
    const checked = await verifyPassword(hashed.record, password);
    if (!checked.ok) throw new Error(`${algo.id}: el registro no verificó`);
    samples[algo.id].push(hashed.ms);
  }
}

for (const [algo, ms] of Object.entries(samples)) {
  const sorted = [...ms].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  console.log(
    `${algo.padEnd(12)} mediana ${median.toFixed(0).padStart(4)} ms  rango ${sorted[0].toFixed(0)}-${sorted[sorted.length - 1].toFixed(0)} ms  (${RUNS} corridas intercaladas)`,
  );
}
