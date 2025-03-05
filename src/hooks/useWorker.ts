import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerType, WorkerMessageType, WorkerMessage, WorkerResponse } from '../types/worker';

// Global worker pool to improve performance
const workerPool: Record<WorkerType, Worker | null> = {
  'scheduleDetails': null,
  'resultsSummary': null
};

// Track how many components are using each worker
const workerUsageCount: Record<WorkerType, number> = {
  'scheduleDetails': 0,
  'resultsSummary': 0
};

// Worker termination timeout (increased from 1s to 5s to reduce worker churn)
const WORKER_TERMINATION_TIMEOUT = 5000; // 5 seconds

type MessageCallbacks = Record<string, (data: any) => void>;

/**
 * Hook for using web workers with pooling to improve performance
 * @param workerType The type of worker to use
 * @returns An object with a postWorkerMessage function
 */
export const useWorker = (workerType: WorkerType) => {
  const [error, setError] = useState<string | null>(null);
  const messageCallbacksRef = useRef<MessageCallbacks>({});
  const messageIdCounterRef = useRef(0);

  // Initialize worker once and track usage
  useEffect(() => {
    if (typeof Worker === 'undefined') {
      console.error('Web Workers are not supported in this environment');
      return;
    }

    // Increment usage count for this worker type
    workerUsageCount[workerType]++;

    // Create worker if it doesn't exist yet
    if (!workerPool[workerType]) {
      try {
        switch (workerType) {
          case 'scheduleDetails':
            workerPool[workerType] = new Worker(new URL('../workers/scheduleDetails.worker.ts', import.meta.url), { type: 'module' });
            break;
          case 'resultsSummary':
            workerPool[workerType] = new Worker(new URL('../workers/resultsSummary.worker.ts', import.meta.url), { type: 'module' });
            break;
          default:
            console.error('Unknown worker type:', workerType);
            return;
        }
      } catch (err) {
        setError(`Failed to create worker: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }
    }

    // Single message handler for all messages
    const handleMessage = (event: MessageEvent) => {
      const { type, data, error: workerError, messageId } = event.data;
      
      if (workerError) {
        setError(workerError);
        // Call error callback if exists
        if (messageId && messageCallbacksRef.current[messageId]) {
          messageCallbacksRef.current[messageId]({ error: workerError });
          delete messageCallbacksRef.current[messageId];
        }
        return;
      }
      
      // If there's a messageId, call the corresponding callback
      if (messageId && messageCallbacksRef.current[messageId]) {
        messageCallbacksRef.current[messageId](data);
        delete messageCallbacksRef.current[messageId];
      }
    };

    // Add message listener
    const worker = workerPool[workerType];
    if (worker) {
      worker.addEventListener('message', handleMessage);
    }

    // Cleanup: decrement usage counter and potentially terminate worker
    return () => {
      if (worker) {
        worker.removeEventListener('message', handleMessage);
      }
      
      workerUsageCount[workerType]--;
      
      // If no components are using the worker anymore, terminate it after a delay
      // to prevent rapid termination/creation cycles
      if (workerUsageCount[workerType] === 0) {
        const workerToTerminate = workerPool[workerType];
        
        setTimeout(() => {
          // Double-check after timeout that no new components have started using it
          if (workerUsageCount[workerType] === 0 && workerToTerminate) {
            workerToTerminate.terminate();
            workerPool[workerType] = null;
            console.log(`Terminated worker: ${workerType}`);
          }
        }, WORKER_TERMINATION_TIMEOUT);
      }
    };
  }, [workerType]);

  /**
   * Post a message to the worker
   * @param message The message to post
   * @param callback Optional callback function to handle the response
   */
  const postWorkerMessage = useCallback((type: string, payload: any, callback?: (data: any) => void) => {
    if (!workerPool[workerType]) {
      setError('Worker not available');
      if (callback) callback({ error: 'Worker not available' });
      return;
    }

    try {
      // Create a unique ID for this message
      const messageId = `${Date.now()}-${messageIdCounterRef.current++}`;
      
      // Store callback if provided
      if (callback) {
        messageCallbacksRef.current[messageId] = callback;
      }
      
      // Post message with ID
      workerPool[workerType]!.postMessage({
        type,
        payload,
        messageId
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to post message: ${errorMessage}`);
      if (callback) callback({ error: errorMessage });
    }
  }, [workerType]);

  return {
    postWorkerMessage,
    error
  };
}; 