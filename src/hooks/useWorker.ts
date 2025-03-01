import { useCallback, useEffect, useRef } from 'react';
import { WorkerType, WorkerMessageType, WorkerMessage, WorkerResponse } from '../types/worker';

// Global worker pool to avoid creating/terminating workers frequently
const workerPool: Record<WorkerType, Worker | null> = {
  'capitalEvolution': null,
  'scheduleDetails': null,
  'resultsSummary': null
};

// Track how many components are using each worker
const workerUsageCount: Record<WorkerType, number> = {
  'capitalEvolution': 0,
  'scheduleDetails': 0,
  'resultsSummary': 0
};

/**
 * Hook for using web workers with pooling to improve performance
 * @param workerType The type of worker to use
 * @returns An object with a postWorkerMessage function
 */
export const useWorker = (workerType: WorkerType) => {
  const callbacksRef = useRef<Map<string, (result: WorkerResponse) => void>>(new Map());
  const messageIdCounter = useRef<number>(0);

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      console.error('Web Workers are not supported in this environment');
      return;
    }

    // Increment usage count for this worker type
    workerUsageCount[workerType]++;

    // Create worker if it doesn't exist yet
    if (!workerPool[workerType]) {
      switch (workerType) {
        case 'capitalEvolution':
          workerPool[workerType] = new Worker(new URL('../workers/capitalEvolution.worker.ts', import.meta.url));
          break;
        case 'scheduleDetails':
          workerPool[workerType] = new Worker(new URL('../workers/scheduleDetails.worker.ts', import.meta.url));
          break;
        case 'resultsSummary':
          workerPool[workerType] = new Worker(new URL('../workers/resultsSummary.worker.ts', import.meta.url));
          break;
        default:
          console.error('Unknown worker type:', workerType);
          return;
      }
    }

    return () => {
      // Decrement usage count
      workerUsageCount[workerType]--;
      
      // Only terminate worker if no components are using it anymore
      // Small timeout to prevent rapid termination/creation cycles
      if (workerUsageCount[workerType] === 0) {
        setTimeout(() => {
          if (workerUsageCount[workerType] === 0 && workerPool[workerType]) {
            workerPool[workerType]?.terminate();
            workerPool[workerType] = null;
          }
        }, 1000);
      }
    };
  }, [workerType]);

  /**
   * Post a message to the worker
   * @param message The message to post
   * @param callback Optional callback function to handle the response
   */
  const postWorkerMessage = useCallback(<T extends WorkerMessage>(
    message: T,
    callback?: (result: WorkerResponse) => void
  ) => {
    const worker = workerPool[workerType];
    if (!worker) {
      console.error('Worker not initialized');
      return;
    }

    if (callback) {
      // Add unique ID to track this specific message
      const messageId = `msg_${Date.now()}_${messageIdCounter.current++}`;
      
      const messageHandler = (event: MessageEvent<WorkerResponse>) => {
        callback(event.data);
        worker.removeEventListener('message', messageHandler);
      };
      
      worker.addEventListener('message', messageHandler);
    }

    worker.postMessage(message);
  }, [workerType]);

  return { postWorkerMessage };
}; 