import { execSync } from "node:child_process";
import { join } from "node:path";

const CLI_PATH = join(process.cwd(), "dist", "index.js");

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function runCli(args: string[], options?: { env?: Record<string, string> }): RunResult {
  const env = {
    ...process.env,
    ...options?.env,
  };

  try {
    const stdout = execSync(`node ${CLI_PATH} ${args.join(" ")}`, {
      encoding: "utf-8",
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? "",
      exitCode: execError.status ?? 1,
    };
  }
}

export function runCliWithApiKey(args: string[]): RunResult {
  return runCli(args, {
    env: { CERTMAN_API_KEY: process.env.CERTMAN_API_KEY! },
  });
}

export function parseJsonOutput(stdout: string): unknown {
  return JSON.parse(stdout);
}
