import { WorkerMessageType } from '../types/worker';

/**
 * Standardized error handling for web workers
 * @param ctx The worker context
 * @param error The error that occurred
 */
export function handleWorkerError(ctx: Worker, error: unknown) {
  ctx.postMessage({
    type: WorkerMessageType.ERROR,
    error: error instanceof Error ? error.message : 'Unknown error',
    data: null
  });
} 