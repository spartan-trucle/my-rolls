#!/usr/bin/env node
// Doc-sync reminder for Cuộn (my-rolls).
//
// Nudges Claude to ASK the user whether a repo doc should be created or synced
// with its claude.ai artifact. It never edits anything itself.
//
//   SessionStart  -> short status: mirrors and their "Last synced" lines
//   PostToolUse   -> after a file edit or an artifact change, one reminder per
//                    kind per session (see RULES below)
//   Stop          -> once per session, if code changed but no doc did, or a
//                    mirror changed without its "Last synced" line
//
// Rules live in CLAUDE.md#sync-rules; keep the two in step.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const ARTIFACTS = {
  roadmap: {
    ids: ["a0f678ba-bea4-4f78-8c12-abb694ef1d62", "Lsq7MWHNCVanpBWQ2D4XTo"],
    mirror: "docs/roadmap.md",
    label: "Roadmap",
  },
  design: {
    ids: ["HtsG9sZeNGx19PSvPjW65a"],
    mirror: "docs/design/design-system.md",
    label: "Design system",
  },
  prd: {
    ids: ["9rfAShmDJUP9uFaDLikmu8"],
    mirror: "docs/product/prd.md",
    label: "PRD",
  },
  wireframes: {
    ids: ["AXpgMvXFo6HL1vrw9RS6gt"],
    mirror: "docs/design/wireframes.md",
    label: "Design canvas",
  },
};

const MIRRORS = [ARTIFACTS.roadmap.mirror, ARTIFACTS.design.mirror];

// Files that are docs/meta, not product code.
const NON_CODE = [/^docs\//, /^\.planning\//, /^\.claude\//, /^README\.md$/, /^CLAUDE\.md$/, /^\.gitignore$/];

const RULES = [
  {
    key: "roadmap-mirror",
    test: (f) => f === ARTIFACTS.roadmap.mirror,
    msg:
      "docs/roadmap.md is a MIRROR; the Claude Docs roadmap (doc a0f678ba-bea4-4f78-8c12-abb694ef1d62) is the source of truth. " +
      "If this change isn't already in the artifact, ask the user: sync it to the artifact now, or revert the mirror? " +
      "After syncing, bump the mirror's \"Last synced\" line (dd.mm.yyyy · doc revision · who).",
  },
  {
    key: "design-mirror",
    test: (f) => f === ARTIFACTS.design.mirror,
    msg:
      "docs/design/design-system.md is a MIRROR of the design system artifact (HtsG9sZeNGx19PSvPjW65a, files under project/). " +
      "If this change isn't already published there, ask the user: publish it to the artifact now, or revert the mirror? " +
      "After syncing, bump \"Last synced\" (dd.mm.yyyy · artifact version · who).",
  },
  {
    key: "prd",
    test: (f) => f === "docs/product/prd.md" || f.startsWith("docs/product/requirements/"),
    msg:
      "PRD docs edited. The PRD artifact (9rfAShmDJUP9uFaDLikmu8) owns requirement wording, and IDs must be quoted exactly. " +
      "If you changed a requirement's wording, priority or ID, ask the user whether to update the PRD artifact too, " +
      "and keep docs/product/requirements/README.md (the ID index) in step.",
  },
  {
    key: "adr",
    test: (f) => f.startsWith("docs/architecture/"),
    msg:
      "ADR edited. The repo copy is the source of truth (no artifact sync). If this touches schema, uploads or sharing, " +
      "check the Known conflicts table in docs/README.md and ask the user whether a conflict row should be closed or added.",
  },
  {
    key: "wireframes",
    test: (f) => f === ARTIFACTS.wireframes.mirror,
    msg:
      "wireframes.md is reference only (no sync). If a screen gained or lost an artboard, update " +
      "\"MVP screens with no artboard yet\".",
  },
];

// ---------------------------------------------------------------------------

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

const input = readStdin();
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const event = input.hook_event_name;

function git(args) {
  try {
    return execFileSync("git", ["--no-optional-locks", "-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

// Per-session "already reminded" state, so each reminder fires once.
const stateDir = path.join(tmpdir(), "cuon-doc-sync");
const stateFile = path.join(stateDir, `${(input.session_id || "nosession").replace(/[^\w-]/g, "")}.json`);
function loadState() {
  try {
    return JSON.parse(readFileSync(stateFile, "utf8"));
  } catch {
    return {};
  }
}
function saveState(s) {
  try {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(stateFile, JSON.stringify(s));
  } catch {}
}
function once(state, key) {
  if (state[key]) return false;
  state[key] = true;
  return true;
}

function rel(p) {
  if (!p) return "";
  const r = path.isAbsolute(p) ? path.relative(root, p) : p;
  return r.split(path.sep).join("/");
}

function isCode(f) {
  return f && !f.startsWith("..") && !NON_CODE.some((re) => re.test(f));
}

function isUntracked(f) {
  return git(["ls-files", "--others", "--exclude-standard", "--", f]).trim() !== "";
}

function lastSynced(f) {
  try {
    const line = readFileSync(path.join(root, f), "utf8").split("\n").find((l) => /last synced/i.test(l));
    return line ? line.replace(/^>\s*/, "").trim() : "no \"Last synced\" line";
  } catch {
    return "missing";
  }
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function context(text) {
  emit({ hookSpecificOutput: { hookEventName: event, additionalContext: `[doc-sync] ${text}` } });
}

// ---------------------------------------------------------------------------

if (event === "SessionStart") {
  const lines = MIRRORS.map((m) => `- ${m}: ${lastSynced(m)}`);
  context(
    "Cuộn keeps docs in the repo next to claude.ai artifacts (rules: CLAUDE.md#sync-rules).\n" +
      lines.join("\n") +
      "\nBefore relying on the roadmap or design system, re-read the artifact and sync the mirror if it moved. " +
      "When work changes what a doc says, ask the user whether to create or sync the doc; don't do it silently."
  );
}

if (event === "PostToolUse") {
  const state = loadState();
  const tool = input.tool_name || "";
  const ti = input.tool_input || {};
  const notes = [];

  // 1) A file was edited or written.
  const file = rel(ti.file_path || ti.notebook_path);
  if (file && /^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool)) {
    if (file.startsWith("docs/") && isUntracked(file) && once(state, `new:${file}`)) {
      notes.push(
        `New doc ${file}. Link it from the map in docs/README.md (and README.md if it's top-level). ` +
          "Ask the user whether it should have a claude.ai artifact counterpart or stay repo-only, " +
          "and record the answer in the Sources of truth table in CLAUDE.md."
      );
    }
    for (const r of RULES) {
      if (r.test(file) && once(state, r.key)) notes.push(r.msg);
    }
    if (isCode(file) && once(state, "code")) {
      notes.push(
        "Code changed. When this piece of work is done, ask the user whether it needs a doc created or synced: " +
          "a requirement landed -> tick the roadmap Progress checklist in the artifact AND docs/roadmap.md; " +
          "schema/stack change -> ADR-001 and the Known conflicts table; UI or tokens -> design system artifact + mirror; " +
          "new screen -> docs/design/wireframes.md; new feature area -> a new deep-dive under docs/product/requirements/."
      );
    }
  }

  // 2) An artifact / Claude Docs doc was changed from this session.
  const isArtifactWrite =
    (tool === "Artifact" && (!ti.action || ti.action === "publish")) ||
    /claude_?docs.*__(update|batch)$/i.test(tool);
  if (isArtifactWrite) {
    const blob = JSON.stringify(ti);
    for (const [k, a] of Object.entries(ARTIFACTS)) {
      if (a.ids.some((id) => blob.includes(id)) && once(state, `artifact:${k}`)) {
        notes.push(
          k === "roadmap" || k === "design"
            ? `${a.label} artifact changed. Copy the same change into ${a.mirror} in this session and bump its "Last synced" line.`
            : `${a.label} artifact changed. Ask the user whether ${a.mirror} (and related deep-dives) should be updated to match.`
        );
      }
    }
  }

  saveState(state);
  if (notes.length) context(notes.join("\n"));
  process.exit(0);
}

if (event === "Stop") {
  if (input.stop_hook_active) process.exit(0);
  const state = loadState();
  if (state.stopReminded) process.exit(0);

  const changed = git(["status", "--porcelain", "--untracked-files=all"])
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop());

  const reasons = [];
  const code = changed.filter(isCode);
  const docs = changed.filter((f) => f.startsWith("docs/"));
  if (code.length && !docs.length) {
    reasons.push(
      `Code changed (${code.slice(0, 5).join(", ")}${code.length > 5 ? ", …" : ""}) but no doc under docs/ did.`
    );
  }
  for (const m of MIRRORS) {
    if (!changed.includes(m)) continue;
    const diff = git(["diff", "--", m]);
    if (diff && !/^[+-].*last synced/im.test(diff)) {
      reasons.push(`${m} changed but its "Last synced" line didn't; the artifact may be out of step.`);
    }
  }

  if (reasons.length) {
    state.stopReminded = true;
    saveState(state);
    emit({
      decision: "block",
      reason:
        "[doc-sync] Before you finish: " +
        reasons.join(" ") +
        " Ask the user whether they want the matching repo doc created or synced (see CLAUDE.md#sync-rules). " +
        "Just ask; don't change docs unless they say yes. This reminder shows once per session.",
    });
  }
  process.exit(0);
}

process.exit(0);
