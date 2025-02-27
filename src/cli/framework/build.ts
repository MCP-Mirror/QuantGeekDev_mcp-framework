#!/usr/bin/env node
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { platform } from "os";
import { existsSync } from "fs";

export function buildFramework() {
  const tsconfigPath = join(process.cwd(), "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    console.error("Error: tsconfig.json not found!");
    process.exit(1);
  }
  console.log("Found tsconfig.json");
  const isWindows = platform() === "win32";
  const tscPath = join(
    process.cwd(),
    "node_modules",
    ".bin",
    isWindows ? "tsc.cmd" : "tsc"
  );

  if (!existsSync(tscPath)) {
    console.error("Error: TypeScript compiler not found at:", tscPath);
    process.exit(1);
  }

  const tsc = spawnSync(tscPath, [], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PATH: process.env.PATH,
    },
  });

  if (tsc.error) {
    console.error("TypeScript compilation error:", tsc.error);
  }
  if (tsc.stderr) {
    console.error("TypeScript stderr:", tsc.stderr.toString());
  }

  if (tsc.status !== 0) {
    console.error("TypeScript compilation failed");
    process.exit(tsc.status ?? 1);
  }

  try {
    const distPath = join(process.cwd(), "dist");

    if (!existsSync(distPath)) {
      console.error("Error: dist directory not found after compilation!");
      process.exit(1);
    }

    const indexPath = join(process.cwd(), "dist", "index.js");
    console.log("Adding shebang to:", indexPath);

    if (!existsSync(indexPath)) {
      console.error("Error: index.js not found in dist directory!");
      process.exit(1);
    }

    const content = readFileSync(indexPath, "utf8");
    const shebang = "#!/usr/bin/env node\n";

    if (!content.startsWith(shebang)) {
      writeFileSync(indexPath, shebang + content);
    }
  } catch (error) {
    console.error("Error in shebang process:", error);
    process.exit(1);
  }

  console.log("Build complete!");
}

if (import.meta.url === new URL(import.meta.url).href) {
  buildFramework();
}
