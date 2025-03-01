import { WorkerMessageType } from '../types/worker';
import { GraphDataPoint } from '../components/retirement/types';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

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
          data: zoomedData
        });
      } catch (error) {
        ctx.postMessage({
          type: WorkerMessageType.ERROR,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        });
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
          data: formattedGrowth
        });
      } catch (error) {
        ctx.postMessage({
          type: WorkerMessageType.ERROR,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        });
      }
      break;

    default:
      ctx.postMessage({
        type: WorkerMessageType.ERROR,
        error: `Unknown message type: ${type}`,
        data: null
      });
  }
}; 