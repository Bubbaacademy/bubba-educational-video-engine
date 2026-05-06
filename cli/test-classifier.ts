import { examples } from "../src/intelligence/examples";
import { createDefaultClassifier } from "../src/intelligence/sceneClassifier";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

interface FieldFailure {
  field: string;
  expected: unknown;
  got: unknown;
}

async function main() {
  const classifier = createDefaultClassifier();
  let passed = 0;
  let failed = 0;
  const failures: { name: string; details: FieldFailure[] }[] = [];

  for (const tc of examples) {
    const result = await classifier.classify({
      text: tc.input.text,
      markers: tc.input.markers,
      forcedType: tc.input.forcedType,
    });

    const fails: FieldFailure[] = [];
    for (const key of Object.keys(tc.expect) as (keyof typeof tc.expect)[]) {
      const expected = tc.expect[key];
      const got = result[key];
      if (expected !== got) fails.push({ field: key, expected, got });
    }

    if (fails.length === 0) {
      passed++;
      process.stdout.write(`${GREEN}✓${RESET} ${tc.name}\n`);
    } else {
      failed++;
      failures.push({ name: tc.name, details: fails });
      process.stdout.write(`${RED}✗${RESET} ${tc.name}\n`);
      for (const f of fails) {
        process.stdout.write(
          `   ${DIM}${f.field}:${RESET} expected ${RED}${String(f.expected)}${RESET}, got ${GREEN}${String(f.got)}${RESET}\n`,
        );
      }
      process.stdout.write(
        `   ${DIM}rule=${result.matchedRule}, confidence=${result.confidence}${RESET}\n`,
      );
    }
  }

  process.stdout.write(`\n${passed}/${passed + failed} passed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`\n[error] ${err.message}\n`);
  process.exit(1);
});
