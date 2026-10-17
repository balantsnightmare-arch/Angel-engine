import { CouncilMode, CouncilNodeConfig, FinalVerdict, SpeechTurn } from "../types";

export type HistoryStatus = "CONSENSUS_REACHED" | "SPLIT_DECISION" | "ERROR";

export interface HistoryEntry {
  id: string;
  topic: string;
  context?: string;
  mode: CouncilMode;
  status: HistoryStatus;
  rounds: number;
  nodes: CouncilNodeConfig[];
  turns: SpeechTurn[];
  verdict: FinalVerdict | null;
  errorMessage?: string;
  createdAt: string;
}

const STORAGE_KEY = "angel_engine_history";
const MAX_ENTRIES = 100;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]): HistoryEntry[] {
  let list = entries.slice(0, MAX_ENTRIES);
  // If storage is full, drop the oldest entries until it fits.
  while (list.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch {
      list = list.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return list;
}

export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory().filter((e) => e.id !== entry.id);
  return persist([entry, ...existing]);
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  return persist(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory(): HistoryEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "debate";
}

export function entryToMarkdown(e: HistoryEntry): string {
  const lines: string[] = [];
  lines.push(`# ${e.topic}`);
  lines.push("");
  lines.push(`- Date: ${new Date(e.createdAt).toLocaleString()}`);
  lines.push(`- Mode: ${e.mode}`);
  lines.push(`- Result: ${e.status.replace(/_/g, " ")}`);
  lines.push(`- Rounds: ${e.rounds}`);
  if (e.context) lines.push(`- Context: ${e.context}`);
  lines.push("");
  let round = 0;
  for (const t of e.turns) {
    if (t.round !== round) {
      round = t.round;
      lines.push(`## Round ${round}`);
      lines.push("");
    }
    lines.push(`### ${t.codeName} — ${t.vote}`);
    lines.push("");
    lines.push(t.statement);
    if (t.reasoning) {
      lines.push("");
      lines.push(`*Reasoning:* ${t.reasoning}`);
    }
    if (t.proposedResolution) {
      lines.push("");
      lines.push(`*Proposed resolution:* ${t.proposedResolution}`);
    }
    if (t.vetoReason) {
      lines.push("");
      lines.push(`*Veto reason:* ${t.vetoReason}`);
    }
    lines.push("");
  }
  if (e.verdict) {
    lines.push(`## Final Verdict — ${e.verdict.finalScore}`);
    lines.push("");
    lines.push(e.verdict.summary);
    if (e.verdict.consensusPoints?.length) {
      lines.push("");
      lines.push("**Consensus points**");
      e.verdict.consensusPoints.forEach((p) => lines.push(`- ${p}`));
    }
    if (e.verdict.dissentingViews?.length) {
      lines.push("");
      lines.push("**Dissenting views**");
      e.verdict.dissentingViews.forEach((p) => lines.push(`- ${p}`));
    }
  }
  if (e.errorMessage) {
    lines.push("");
    lines.push(`**Error:** ${e.errorMessage}`);
  }
  return lines.join("\n") + "\n";
}

export function exportEntryMarkdown(e: HistoryEntry) {
  const date = e.createdAt.slice(0, 10);
  download(`angel-engine-${date}-${slug(e.topic)}.md`, entryToMarkdown(e), "text/markdown");
}

export function exportAllJson(entries: HistoryEntry[]) {
  const date = new Date().toISOString().slice(0, 10);
  download(`angel-engine-history-${date}.json`, JSON.stringify(entries, null, 2), "application/json");
}
