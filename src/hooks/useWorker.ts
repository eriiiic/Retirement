import { useCallback, useEffect, useRef } from 'react';
import { WorkerType, WorkerMessageType, WorkerMessage, WorkerResponse } from '../types/worker';

/**
 * Hook for using web workers
 * @param workerType The type of worker to use
 * @returns An object with a postWorkerMessage function
 */
export const useWorker = (workerType: WorkerType) => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      console.error('Web Workers are not supported in this environment');
      return;
    }

    switch (workerType) {
      case 'capitalEvolution':
        workerRef.current = new Worker(new URL('../workers/capitalEvolution.worker.ts', import.meta.url));
        break;
      case 'scheduleDetails':
        workerRef.current = new Worker(new URL('../workers/scheduleDetails.worker.ts', import.meta.url));
        break;
      case 'resultsSummary':
        workerRef.current = new Worker(new URL('../workers/resultsSummary.worker.ts', import.meta.url));
        break;
      default:
        console.error('Unknown worker type:', workerType);
        return;
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
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
    if (!workerRef.current) {
      console.error('Worker not initialized');
      return;
    }

    if (callback) {
      const messageHandler = (event: MessageEvent<WorkerResponse>) => {
        callback(event.data);
        workerRef.current?.removeEventListener('message', messageHandler);
      };
      workerRef.current.addEventListener('message', messageHandler);
    }

    workerRef.current.postMessage(message);
  }, []);

  return { postWorkerMessage };
}; 