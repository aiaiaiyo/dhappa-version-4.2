/// <reference lib="webworker" />
import { trainSelfLearningV4 } from '../v4/selfLearningCore';
import type { DayMarketEntry } from '../types';

export interface V4TrainingWorkerRequest {
  id: string;
  records: DayMarketEntry[];
}

self.onmessage = (event: MessageEvent<V4TrainingWorkerRequest>) => {
  const { id, records } = event.data;
  try {
    const report = trainSelfLearningV4(records);
    self.postMessage({ id, ok: true, report });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
