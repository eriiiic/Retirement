import { WorkerMessageType } from '../types/worker';
import { handleWorkerError } from './utils';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload, messageId } = event.data;

  switch (type) {
    case WorkerMessageType.FILTER_AND_SORT_DATA:
      try {
        const { graphData, filterKey, filterValue, sortKey, sortDirection } = payload;
        
        // Apply filters if provided
        let filteredData = [...graphData];
        if (filterKey && filterValue !== undefined && filterValue !== null) {
          filteredData = filteredData.filter(item => {
            // Handle different filtering scenarios
            if (typeof filterValue === 'string') {
              // For string filtering like "Yes"/"No" on retirement
              return item[filterKey] === filterValue;
            } else if (typeof filterValue === 'number') {
              // For numeric filtering
              return item[filterKey] === filterValue;
            } else if (typeof filterValue === 'object' && Array.isArray(filterValue)) {
              // For range filtering like [minYear, maxYear]
              const [min, max] = filterValue;
              return item[filterKey] >= min && item[filterKey] <= max;
            }
            return true;
          });
        }
        
        // Apply sorting if provided
        if (sortKey) {
          filteredData.sort((a, b) => {
            const valueA = a[sortKey];
            const valueB = b[sortKey];
            
            if (sortDirection === 'asc') {
              return valueA > valueB ? 1 : -1;
            } else {
              return valueA < valueB ? 1 : -1;
            }
          });
        }

        ctx.postMessage({
          type: WorkerMessageType.FILTERED_SORTED_DATA_RESULT,
          data: filteredData,
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