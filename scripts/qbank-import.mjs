#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_DATA_DIR = path.resolve(repoRoot, "data", "qbank", "questions");

const args = process.argv.slice(2);
const cliOptions = {
  dir: DEFAULT_DATA_DIR,
  apply: false,
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--dir" || arg === "-d") {
    const next = args[i + 1];
    if (!next) throw new Error("--dir flag expects a value");
    cliOptions.dir = path.resolve(process.cwd(), next);
    i += 1;
  } else if (arg === "--apply") {
    cliOptions.apply = true;
  } else if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  } else {
    console.warn(`Unknown argument: ${arg}`);
  }
}

const StimulusBlockSchema = z
  .object({
    kind: z.string().default("text"),
    value: z.any().optional(),
  })
  .passthrough();

const OptionSchema = z
  .object({
    id: z.string().min(1, "option id required"),
    label: z.string().optional(),
    content: z.any().optional(),
    isCorrect: z.boolean().default(false),
    misconceptionTags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .passthrough();

const AnswerSchema = z
  .object({
    type: z.enum(["single", "multiple", "rank", "hotspot", "drag"]).default("single"),
    correctIds: z.array(z.string()).default([]),
  })
  .partial();

const QuestionSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().nonnegative().default(1),
    status: z.enum(["draft", "in_review", "live", "retired"]),
    questionType: z.enum(["sba", "multi", "emq", "sjt", "drag", "hotspot", "data"]).default("sba"),
    exam: z.object({
      code: z.string().min(1),
      section: z.string().min(1),
      topic: z.string().min(1),
      subtopic: z.string().optional(),
      blueprintCode: z.string().optional(),
    }),
    stimulus: z
      .object({
        type: z.string().default("vignette"),
        locale: z.string().default("en"),
        content: z.array(StimulusBlockSchema).default([]),
      })
      .default({ type: "vignette", locale: "en", content: [] }),
    options: z.array(OptionSchema).nonempty(),
    answer: AnswerSchema.optional(),
    explanations: z.record(z.any()).optional(),
    metadata: z
      .object({
        difficulty: z.union([z.string(), z.number()]).optional(),
        bloom: z.string().optional(),
        skillType: z.string().optional(),
        timeEstimateSec: z.number().int().positive().optional(),
        calculator: z.enum(["disallowed", "basic", "scientific", "exam_default"]).optional(),
        unitSystem: z.enum(["SI", "US", "dual"]).optional(),
        irt: z
          .object({
            a: z.number().optional(),
            b: z.number().optional(),
            c: z.number().optional(),
          })
          .optional(),
      })
      .passthrough()
      .optional(),
    psychometrics: z.record(z.any()).optional(),
    links: z.record(z.any()).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const optionIds = new Set(value.options.map((opt) => opt.id));
    const answer = value.answer ?? { type: "single", correctIds: [] };
    const invalidIds = (answer.correctIds ?? []).filter((id) => !optionIds.has(id));
    if (invalidIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `answer.correctIds references unknown option(s): ${invalidIds.join(", ")}`,
        path: ["answer", "correctIds"],
      });
    }
    if (answer.type === "single") {
      const correctCount = (answer.correctIds ?? []).length || value.options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "single answer questions must declare exactly one correct option",
          path: ["answer", "correctIds"],
        });
      }
    }
  });

const summary = {
  total: 0,
  byExam: new Map(),
  byStatus: new Map(),
  failures: [],
};

const dataDir = cliOptions.dir;

try {
  const stats = await fs.stat(dataDir);
  if (!stats.isDirectory()) {
    console.error(`Provided path is not a directory: ${dataDir}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`Cannot access data directory: ${dataDir}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const files = await collectJsonFiles(dataDir);
if (files.length === 0) {
  console.warn(`No JSON files found under ${dataDir}`);
  process.exit(0);
}

for (const filePath of files) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    summary.failures.push({
      file: filePath,
      reason: `Unable to read file: ${error instanceof Error ? error.message : String(error)}`,
    });
    continue;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    summary.failures.push({
      file: filePath,
      reason: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    });
    continue;
  }

  const parsed = QuestionSchema.safeParse(json);
  if (!parsed.success) {
    summary.failures.push({
      file: filePath,
      reason: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; "),
    });
    continue;
  }

  const question = parsed.data;
  summary.total += 1;
  increment(summary.byExam, question.exam.code);
  increment(summary.byStatus, question.status);
}

if (summary.failures.length > 0) {
  console.error(`\nFound ${summary.failures.length} problem file(s):`);
  for (const failure of summary.failures) {
    console.error(` - ${path.relative(repoRoot, failure.file)} -> ${failure.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated ${summary.total} question file(s).`);
  console.table(
    Array.from(summary.byExam.entries()).map(([exam, count]) => ({ exam, count }))
  );
  console.table(
    Array.from(summary.byStatus.entries()).map(([status, count]) => ({ status, count }))
  );
  if (cliOptions.apply) {
    console.warn("Apply mode is not yet implemented. Future work: batch insert via Drizzle.");
  } else {
    console.log("Dry run only. Use --apply once the ingestion pipeline is wired to the database.");
  }
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

async function collectJsonFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const dirent of dirents) {
    const resolved = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      const nested = await collectJsonFiles(resolved);
      results.push(...nested);
    } else if (dirent.isFile() && dirent.name.toLowerCase().endsWith(".json")) {
      results.push(resolved);
    }
  }
  return results;
}

function printHelp() {
  console.log(`Usage: node scripts/qbank-import.mjs [options]\n\nOptions:\n  -d, --dir <path>   Directory containing question JSON files (default: ${DEFAULT_DATA_DIR})\n      --apply        Execute DB sync instead of dry-run validation (not yet implemented)\n  -h, --help         Show this help message\n`);
}
