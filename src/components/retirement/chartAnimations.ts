export const CHART_ANIMATIONS = {
  PULSE_SUBTLE: `
    @keyframes pulse-subtle {
      0%, 100% {
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
      }
      50% {
        opacity: 0.85;
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
    }
    .animate-pulse {
      animation: pulse-subtle 3s ease-in-out infinite;
    }
  `
} as const; 