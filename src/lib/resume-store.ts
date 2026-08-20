import { emptyResume, normalizeResume, type ResumeContent } from "./resume";

export type StoredResume = {
  id: string;
  title: string;
  target_role: string;
  content: ResumeContent;
  updated_at: string;
};

const KEY = "resumeforge.resumes.v1";

function read(): StoredResume[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredResume[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: String(item.id),
      title: String(item.title ?? "Untitled resume"),
      target_role: String(item.target_role ?? ""),
      content: normalizeResume(item.content),
      updated_at: String(item.updated_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

function write(items: StoredResume[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function listResumes(): StoredResume[] {
  return read().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getResume(id: string): StoredResume | null {
  return read().find((item) => item.id === id) ?? null;
}

export function createResume(): StoredResume {
  const item: StoredResume = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    title: "Untitled resume",
    target_role: "",
    content: emptyResume(),
    updated_at: new Date().toISOString(),
  };
  write([item, ...read()]);
  return item;
}

export function saveResume(
  id: string,
  patch: { title: string; target_role: string; content: ResumeContent },
) {
  const items = read();
  const index = items.findIndex((item) => item.id === id);
  const next: StoredResume = {
    id,
    title: patch.title,
    target_role: patch.target_role,
    content: patch.content,
    updated_at: new Date().toISOString(),
  };
  if (index === -1) items.unshift(next);
  else items[index] = next;
  write(items);
}

export function deleteResume(id: string) {
  write(read().filter((item) => item.id !== id));
}
