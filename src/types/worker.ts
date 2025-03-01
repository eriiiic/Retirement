import { GraphDataPoint, SortConfig, FilterPhase, TimelineWidths, CapitalComparison, StatusInfo, SummaryResult } from '../components/retirement/types';

/**
 * Worker message types enum
 */
export enum WorkerMessageType {
  CALCULATE_ZOOMED_DATA = 'CALCULATE_ZOOMED_DATA',
  CALCULATE_GROWTH_PERCENTAGE = 'CALCULATE_GROWTH_PERCENTAGE',
  ZOOMED_DATA_RESULT = 'ZOOMED_DATA_RESULT',
  GROWTH_PERCENTAGE_RESULT = 'GROWTH_PERCENTAGE_RESULT',
  FILTER_AND_SORT_DATA = 'FILTER_AND_SORT_DATA',
  FILTERED_SORTED_DATA_RESULT = 'FILTERED_SORTED_DATA_RESULT',
  CALCULATE_SUMMARY = 'CALCULATE_SUMMARY',
  SUMMARY_RESULT = 'SUMMARY_RESULT',
  CALCULATE_SCHEDULE = 'CALCULATE_SCHEDULE',
  SCHEDULE_RESULT = 'SCHEDULE_RESULT',
  ERROR = 'ERROR'
}

/**
 * Worker types
 */
export type WorkerType = 'capitalEvolution' | 'scheduleDetails' | 'resultsSummary';

/**
 * Base interface for worker messages
 */
export interface WorkerMessageBase<T extends WorkerMessageType, P> {
  type: T;
  payload: P;
}

/**
 * Base interface for worker responses
 */
export interface WorkerResponseBase<T extends WorkerMessageType, D> {
  type: T;
  data: D;
  error?: string;
}

/**
 * Zoomed data payload
 */
export interface ZoomedDataPayload {
  graphData: GraphDataPoint[];
  zoomStart: number;
  zoomEnd: number;
}

/**
 * Growth percentage payload
 */
export interface GrowthPercentagePayload {
  current: number;
  initial: number;
}

/**
 * Filter and sort payload
 */
export interface FilterSortPayload {
  graphData: GraphDataPoint[];
  filteredPhase: FilterPhase;
  sortConfig: SortConfig;
}

/**
 * Summary data payload
 */
export interface SummaryDataPayload {
  graphData: GraphDataPoint[];
}

/**
 * Schedule data payload
 */
export interface ScheduleDataPayload {
  graphData: GraphDataPoint[];
}

/**
 * Worker message types
 */
export type WorkerMessage =
  | WorkerMessageBase<WorkerMessageType.CALCULATE_ZOOMED_DATA, ZoomedDataPayload>
  | WorkerMessageBase<WorkerMessageType.CALCULATE_GROWTH_PERCENTAGE, GrowthPercentagePayload>
  | WorkerMessageBase<WorkerMessageType.FILTER_AND_SORT_DATA, FilterSortPayload>
  | WorkerMessageBase<WorkerMessageType.CALCULATE_SUMMARY, SummaryDataPayload>
  | WorkerMessageBase<WorkerMessageType.CALCULATE_SCHEDULE, ScheduleDataPayload>;

/**
 * Worker response types
 */
export type WorkerResponse =
  | WorkerResponseBase<WorkerMessageType.ZOOMED_DATA_RESULT, GraphDataPoint[]>
  | WorkerResponseBase<WorkerMessageType.GROWTH_PERCENTAGE_RESULT, string>
  | WorkerResponseBase<WorkerMessageType.FILTERED_SORTED_DATA_RESULT, GraphDataPoint[]>
  | WorkerResponseBase<WorkerMessageType.SUMMARY_RESULT, SummaryResult>
  | WorkerResponseBase<WorkerMessageType.SCHEDULE_RESULT, GraphDataPoint[]>
  | WorkerResponseBase<WorkerMessageType.ERROR, null>; 