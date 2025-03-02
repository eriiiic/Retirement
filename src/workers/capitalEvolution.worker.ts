import { WorkerMessageType } from '../types/worker';
import { GraphDataPoint } from '../components/retirement/types';
import { handleWorkerError } from './utils';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload, messageId } = event.data;

  switch (type) {
    case WorkerMessageType.CALCULATE_ZOOMED_DATA:
      try {
        const { graphData, zoomStart, zoomEnd } = payload;
        
        // Filter data based on zoom level
        const zoomedData = graphData.filter((point: GraphDataPoint) => {
          const year = point.year;
          return year >= zoomStart && year <= zoomEnd;
        });

        ctx.postMessage({
          type: WorkerMessageType.ZOOMED_DATA_RESULT,
          data: zoomedData,
          messageId
        });
      } catch (error) {
        handleWorkerError(ctx, error);
      }
      break;

    case WorkerMessageType.CALCULATE_GROWTH_PERCENTAGE:
      try {
        const { current, initial } = payload;
        
        // Calculate growth percentage
        const growthPercentage = ((current - initial) / initial) * 100;
        const formattedGrowth = growthPercentage.toFixed(2) + '%';

        ctx.postMessage({
          type: WorkerMessageType.GROWTH_PERCENTAGE_RESULT,
          data: formattedGrowth,
          messageId
        });
      } catch (error) {
        handleWorkerError(ctx, error);
      }
      break;

    default:
      ctx.postMessage({
        type: WorkerMessageType.ERROR,
        error: `Unknown message type: ${type}`,
        data: null,
        messageId
      });
  }
}; 