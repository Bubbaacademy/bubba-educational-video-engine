import { runRender } from "../src/pipeline/runRender";

const args = process.argv.slice(2);
const planOnly = args.includes("--plan-only");
const fromPlanArg = args.find((a) => a.startsWith("--from-plan="));
const fromPlan = fromPlanArg
  ? fromPlanArg.split("=")[1]
  : args.includes("--from-plan")
    ? args[args.indexOf("--from-plan") + 1]
    : undefined;

runRender({ planOnly, fromPlan })
  .then((result) => {
    const summary = result.videoPath
      ? `plan=${result.planPath} video=${result.videoPath}`
      : `plan=${result.planPath} (plan-only)`;
    process.stdout.write(`[done] ${summary} in ${result.durationMs}ms (${result.scenes} scenes)\n`);
  })
  .catch((err) => {
    process.stderr.write(`\n[error] ${err.message}\n`);
    process.exit(1);
  });
