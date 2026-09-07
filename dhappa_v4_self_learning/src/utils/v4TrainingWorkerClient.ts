import type { DayMarketEntry } from '../types';
import type { V4TrainingReport } from '../v4/selfLearningCore';

type Pending = {
  resolve: (report: V4TrainingReport) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<string, Pending>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (worker) return worker;
  worker = new Worker(new URL('../workers/v4Training.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<any>) => {
    const task = pending.get(event.data?.id);
    if (!task) return;
    pending.delete(event.data.id);
    if (event.data.ok) task.resolve(event.data.report as V4TrainingReport);
    else task.reject(new Error(event.data.error || 'V4 worker training failed'));
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || 'V4 worker error');
    for (const task of pending.values()) task.reject(error);
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export async function trainV4OffMainThread(records: DayMarketEntry[]): Promise<V4TrainingReport> {
  const w = getWorker();
  if (!w) {
    const mod = await import('../v4/selfLearningCore');
    return mod.trainSelfLearningV4(records);
  }
  const id = `v4-${Date.now()}-${++seq}`;
  return new Promise<V4TrainingReport>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, records });
  });
}
