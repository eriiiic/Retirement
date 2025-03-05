import { colors } from '../../styles/styleGuide';

export const CHART_CONFIG = {
  LABEL_PIXEL_GAP: 2,
  LABEL_WIDTH_ESTIMATE: 120,
  MOBILE_BREAKPOINT: 640,
  CHART_HEIGHT: 300,
  CHART_MARGIN: { top: 20, right: 20, bottom: 20, left: 20 },
  AXIS: {
    Y_WIDTH: 40,
    TICK_MARGIN: {
      MOBILE: 5,
      DESKTOP: 8
    },
    FONT_SIZE: {
      MOBILE: 10,
      DESKTOP: 11
    }
  },
  GRID: {
    STROKE: '#f1f1f1',
    DASH_ARRAY: '3 3'
  },
  LEGEND: {
    PADDING_TOP: 5,
    FONT_SIZE: 11
  },
  SERIES: {
    CAPITAL: {
      STROKE_WIDTH: 4,
      DOT_RADIUS: 8,
      DOT_STROKE_WIDTH: 2,
      DOT_STROKE_COLOR: '#ffffff'
    },
    DELAYED: {
      STROKE_WIDTH: 1,
      OPACITY: 0.3
    },
    REFERENCE_LINE: {
      STROKE_WIDTH: 2,
      DASH_ARRAY: {
        DEPLETION: '6 3',
        RETIREMENT: '8 4',
        TARGET: undefined
      }
    }
  },
  GRADIENTS: {
    CAPITAL: {
      STOPS: [
        { offset: '0%', opacity: 0.9 },
        { offset: '40%', opacity: 0.6 },
        { offset: '80%', opacity: 0.3 },
        { offset: '100%', opacity: 0.1 }
      ]
    },
    DELAYED: {
      STOPS: [
        { offset: '0%', opacity: 0.4 },
        { offset: '100%', opacity: 0.1 }
      ]
    }
  }
} as const; 