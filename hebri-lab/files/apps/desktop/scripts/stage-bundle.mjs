/**
 * Stages the Hebri agent source tree (runtime subset) into
 * apps/desktop/build/hebri-source/ so electron-builder can ship it as an
 * extraResource (build/hebri-source -> resources/hebri-source).
 *
 * Why: the packaged desktop app installs the agent from this bundled tree
 * (install.ps1 -SourceDir / install.sh --source-dir) instead of cloning from
 * GitHub. Builds stamped to locally-committed (unpushed) SHAs 404 on every
 * network path, and offline first-launch must work too. The bundled tree is
 * therefore the source of truth for the installed agent.
 *
 * Excluded: dev-only trees (tests/, website/, evals/), VCS metadata, and
 * build artifacts (node_modules, __pycache__, .venv, apps/desktop/{dist,
 * build,release} and numbered desktop release directories).
 *
 * NOTE: Node's fs.cpSync refuses to copy a directory into a subdirectory of
 * itself (the output lives inside the repo), so this uses an explicit
 * recursive walk instead.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve, sep } from "node:path";

const DESKTOP_ROOT = resolve(import.meta.dirname, "..");
const REPO_ROOT = resolve(DESKTOP_ROOT, "..", "..");
const OUT_DIR = resolve(DESKTOP_ROOT, "build", "hebri-source");
const SOURCE_LIST = ".hebri-bundled-files.json";

// A checkout supplies its Git index. A previously staged source bundle carries
// the equivalent list so offline rebuilds need neither Git nor a network.
const listed = existsSync(resolve(REPO_ROOT, ".git"))
  ? execFileSync("git", ["ls-files", "--cached", "-z"], {
      cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024
    }).split("\0").filter(Boolean)
  : JSON.parse(readFileSync(resolve(REPO_ROOT, SOURCE_LIST), "utf8"));
const publishable = new Set(listed);
const copied = [];
const sourceDirs = new Set();
for (const file of publishable) {
  let slash = file.indexOf("/");
  while (slash !== -1) {
    sourceDirs.add(file.slice(0, slash));
    slash = file.indexOf("/", slash + 1);
  }
}

// Top-level entries that are dev-only or build artifacts — never ship.
const EXCLUDE_TOP = new Set([
  "tests",
  "website",
  "evals",
  "node_modules",
  ".venv",
  "__pycache__",
  ".pytest_cache",
  ".tmp",
  "tmp",
  ".git",
  "release2",
  "lab",
  "HEBRI-LAB.md",
  ".github",
]);

// Directory names skipped anywhere in the tree.
const EXCLUDE_DIRS = new Set(["node_modules", "__pycache__", ".pytest_cache", ".tmp", ".venv", ".git"]);

// apps/desktop-specific build artifacts (the packaged app already ships its
// own renderer; the installed agent rebuilds on demand if ever needed).
const DESKTOP_EXCLUDE = new Set(["dist", "build", "release"]);

function isExcluded(relParts) {
  const name = relParts.at(-1);
  if ((/^\.env(?:\.|$)/i.test(name) && name !== ".env.example") ||
      /\.(?:p12|pfx|key|jks)$/i.test(name) ||
      (relParts.length === 1 && /^(?:(?:COMPLIANCE|BUG_AUDIT|QUALITY_ASSURANCE|PERFORMANCE|TEST_COVERAGE|REGRESSION_TEST|RELEASE_READINESS)_REPORT|SECURITY_AUDIT|IP_PROVENANCE|REPOSITORY_SETUP|RELEASE_CHECKLIST|BUG_REGISTER|MODIFIED_FILES)\.md$/.test(name))) {
    return true
  }
  if (EXCLUDE_TOP.has(relParts[0])) {
    return true
  }

  if (
    relParts[0] === "apps" &&
    relParts[1] === "desktop" &&
    relParts.length > 2 &&
    (DESKTOP_EXCLUDE.has(relParts[2]) || /^release\d+$/.test(relParts[2]))
  ) {
    return true
  }

  return EXCLUDE_DIRS.has(relParts[relParts.length - 1])
}

// Recreate the output dir fresh so stale files from a previous stage cannot
// leak into the package.
rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

let fileCount = 0
let totalBytes = 0

function copyDir(srcDir, destDir, relPrefix) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const relParts = [...relPrefix, entry.name]
    if (isExcluded(relParts)) {
      continue
    }

    const srcPath = srcDir + sep + entry.name
    const destPath = destDir + sep + entry.name
    const relative = relParts.join("/")
    if (!publishable.has(relative) && !sourceDirs.has(relative)) continue
    if (entry.isSymbolicLink()) {
      throw new Error(`stage-bundle: review linked source entry before packaging: ${relative}`)
    }

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true })
      copyDir(srcPath, destPath, relParts)
    } else if (entry.isFile() && publishable.has(relative)) {
      cpSync(srcPath, destPath)
      copied.push(relative)
      try {
        const st = statSync(srcPath)
        fileCount += 1
        totalBytes += st.size
      } catch {
        fileCount += 1
      }
    }
  }
}

const started = Date.now()
copyDir(REPO_ROOT, OUT_DIR, [])
writeFileSync(resolve(OUT_DIR, SOURCE_LIST), JSON.stringify(copied.sort()) + "\n")

// Sanity: the installer entrypoints and Python project must have made it.
for (const rel of ["scripts/install.ps1", "scripts/install.sh", "pyproject.toml", "cli.py"]) {
  const p = OUT_DIR + sep + rel.replace(/\//g, sep)

  if (!statSync(p).isFile()) {
    throw new Error(`stage-bundle: expected ${p} after copy; bundle is incomplete`)
  }
}

// Fail the build if a pinned memory component or its license was omitted/changed.
const keelDir = resolve(OUT_DIR, "plugins", "memory", "keelindex");
const keelManifest = JSON.parse(readFileSync(resolve(keelDir, "UPSTREAM.json"), "utf8"));
for (const file of keelManifest.files) {
  const digest = createHash("sha256").update(readFileSync(resolve(keelDir, file.path))).digest("hex");
  if (digest !== file.sha256) throw new Error(`stage-bundle: KEEL checksum mismatch: ${file.path}`);
}
for (const file of ["cli.py", "README.md"]) {
  if (!statSync(resolve(keelDir, file)).isFile()) throw new Error(`stage-bundle: missing KEEL ${file}`);
}

console.log(
  `[stage-bundle] staged ${fileCount} files, ${(totalBytes / 1048576).toFixed(1)} MB -> ${OUT_DIR} in ${Date.now() - started}ms`
)
