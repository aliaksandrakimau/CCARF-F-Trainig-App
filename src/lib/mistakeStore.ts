// IndexedDB persistence for wrong answers ("mistakes").
//
// All operations resolve silently when IndexedDB is unavailable (private
// browsing, blocked storage) — the trainer must keep working without it.
// A tiny listener set lets the UI keep the "Review errors" badge in sync
// without prop drilling through the router.

import type { AnswerMode, MistakeRecord } from "../types";

const DB_NAME = "ccarf-trainer";
const DB_VERSION = 1;
const STORE = "mistakes";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE)) {
            req.result.createObjectStore(STORE, { keyPath: "qid" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

/** Run a readwrite transaction; resolves when it commits (or fails quietly). */
async function withStore(
  run: (store: IDBObjectStore) => void,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    run(tx.objectStore(STORE));
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export async function getMistakes(): Promise<MistakeRecord[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => {
      const recs = (req.result as MistakeRecord[]) || [];
      // Most recently missed first — matches how users scan a review list.
      recs.sort((a, b) => b.lastMissedAt - a.lastMissedAt);
      resolve(recs);
    };
    req.onerror = () => resolve([]);
  });
}

/** Upsert a miss: bump counters, remember the wrong selection, mark unresolved. */
export async function recordMistake(
  qid: number,
  selected: number[],
  mode: AnswerMode,
): Promise<void> {
  const now = Date.now();
  await withStore((store) => {
    const getReq = store.get(qid);
    getReq.onsuccess = () => {
      const prev = getReq.result as MistakeRecord | undefined;
      const rec: MistakeRecord = prev
        ? {
            ...prev,
            selected,
            mode,
            count: prev.count + 1,
            streak: prev.streak + 1,
            lastMissedAt: now,
            resolved: false,
          }
        : {
            qid,
            selected,
            mode,
            count: 1,
            streak: 1,
            firstMissedAt: now,
            lastMissedAt: now,
            resolved: false,
          };
      store.put(rec);
    };
  });
  notify();
}

/** Mark an existing mistake as resolved once answered correctly. No-op if never missed. */
export async function recordCorrectAnswer(qid: number): Promise<void> {
  await withStore((store) => {
    const getReq = store.get(qid);
    getReq.onsuccess = () => {
      const prev = getReq.result as MistakeRecord | undefined;
      if (prev && !prev.resolved) {
        store.put({ ...prev, resolved: true, streak: 0 });
      }
    };
  });
  notify();
}

export async function removeMistake(qid: number): Promise<void> {
  await withStore((store) => store.delete(qid));
  notify();
}

export async function clearMistakes(): Promise<void> {
  await withStore((store) => store.clear());
  notify();
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to any store mutation; returns an unsubscribe function. */
export function subscribeMistakes(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}
