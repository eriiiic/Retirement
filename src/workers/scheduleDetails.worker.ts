import { WorkerMessageType } from '../types/worker';
import { GraphDataPoint, SortConfig, FilterPhase } from '../components/retirement/types';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case WorkerMessageType.FILTER_AND_SORT_DATA:
      try {
        const { graphData, filteredPhase, sortConfig } = payload;
        
        // First filter the data based on the selected phase
        let filteredData = [...graphData];
        
        if (filteredPhase !== 'all') {
          filteredData = filteredData.filter((point: GraphDataPoint) => {
            if (filteredPhase === 'investment') {
              return point.retirement === "No";
            } else if (filteredPhase === 'retirement') {
              return point.retirement === "Yes";
            }
            return true;
          });
        }
        
        // Then sort the data if a sort config is provided
        if (sortConfig.key) {
          filteredData.sort((a: GraphDataPoint, b: GraphDataPoint) => {
            const key = sortConfig.key as keyof GraphDataPoint;
            
            if (a[key] < b[key]) {
              return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
              return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
          });
        }
        
        ctx.postMessage({
          type: WorkerMessageType.FILTERED_SORTED_DATA_RESULT,
          data: filteredData
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