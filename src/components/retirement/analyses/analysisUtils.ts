/**
 * Shared utility functions for the Optimization Insights analysis cards.
 * Consolidates duplicated helpers that were previously copy-pasted across
 * RiskAssessmentCard, RecommendationPanel, RetirementDelayCard,
 * InvestmentIncreaseCard, and WithdrawalStrategyCard.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** The widely-accepted safe withdrawal rate (4% rule) */
export const SAFE_WITHDRAWAL_RATE = 4;

/** Default target longevity age for risk calculations */
export const DEFAULT_TARGET_AGE = 95;

/** Conservative multiplier for exhaustion projections */
export const CONSERVATIVE_MULTIPLIER = 0.7;

// ─── Formatting ──────────────────────────────────────────────────────────────

/** Format a number as a percentage string with 1 decimal place, e.g. "4.2%" */
export const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
};

// ─── Risk Level Mapping ──────────────────────────────────────────────────────

/** Map legacy 3-tier risk levels to the newer 5-tier system */
export const mapRiskLevel = (
    legacyRisk: 'High' | 'Medium' | 'Low'
): 'Critical' | 'High' | 'Significant' | 'Moderate' | 'Low' => {
    switch (legacyRisk) {
        case 'High':
            return 'Critical';
        case 'Medium':
            return 'Significant';
        case 'Low':
            return 'Low';
    }
};

/** Get Tailwind color classes for a given risk level, with dark-mode support */
export const getRiskColorClasses = (level: string, isDark: boolean = false): string => {
    switch (level) {
        case 'Critical':
            return isDark
                ? 'bg-red-900/50 border-red-700 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700';
        case 'High':
            return isDark
                ? 'bg-orange-900/50 border-orange-700 text-orange-300'
                : 'bg-orange-50 border-orange-200 text-orange-700';
        case 'Significant':
            return isDark
                ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700';
        case 'Moderate':
            return isDark
                ? 'bg-blue-900/50 border-blue-700 text-blue-300'
                : 'bg-blue-50 border-blue-200 text-blue-700';
        case 'Low':
            return isDark
                ? 'bg-green-900/50 border-green-700 text-green-300'
                : 'bg-green-50 border-green-200 text-green-700';
        default:
            return isDark
                ? 'bg-gray-900/50 border-gray-700 text-gray-300'
                : 'bg-gray-50 border-gray-200 text-gray-700';
    }
};

// ─── Priority ────────────────────────────────────────────────────────────────

/** Convert a recommendation priority string to a display label */
export const getPriorityLabel = (
    priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical'
): string => {
    switch (priority) {
        case 'Critical':
            return '🔴 Critical';
        case 'Urgent':
            return '🟠 Urgent';
        case 'High':
            return '🟡 High';
        case 'Medium':
            return '🔵 Medium';
        case 'Low':
            return '🟢 Low';
        default:
            return priority;
    }
};
