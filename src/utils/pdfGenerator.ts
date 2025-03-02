import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { SimulatorParams, Statistics } from '../components/retirement/types';

// Apply the plugin to extend jsPDF
applyPlugin(jsPDF);

// Add TypeScript declarations for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface GenerateReportParams {
  params: SimulatorParams;
  statistics: Statistics & { 
    ageAtYear: (year: number) => number 
  };
  formatAmount: (amount: number) => string;
  chartRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Generates a complete retirement planning report in PDF format
 * @param params Object containing simulation parameters, statistics, formatting function, and chart reference
 */
export const generateRetirementReport = async ({
  params,
  statistics,
  formatAmount,
  chartRef
}: GenerateReportParams): Promise<void> => {
  try {
    console.log('Starting PDF generation process');
    
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Document Metadata
    pdf.setProperties({
      title: 'Retirement Planning Report',
      subject: 'Financial Planning',
      author: 'Retraite Planning Tool',
      keywords: 'retirement, finance, planning',
      creator: 'Retraite App'
    });
    
    // Set default font - helvetica is already built in
    pdf.setFont('helvetica');
    
    // Define document style constants
    const COLORS = {
      primary: [41, 128, 185],     // Main blue
      secondary: [52, 152, 219],   // Light blue
      dark: [44, 62, 80],          // Dark blue-gray
      success: [46, 204, 113],     // Green
      warning: [230, 126, 34],     // Orange
      danger: [231, 76, 60],       // Red
      gray: [100, 100, 100],       // Medium gray
      lightGray: [200, 200, 200]   // Light gray
    };
    
    // Define the document structure and content
    await generateDocument(pdf, { 
      params, 
      statistics, 
      formatAmount, 
      chartRef,
      COLORS 
    });
    
    // Save the PDF
    pdf.save('Retirement_Planning_Report.pdf');
    
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Enhanced interface with style colors
 */
interface EnhancedReportParams extends GenerateReportParams {
  COLORS: {
    primary: number[];
    secondary: number[];
    dark: number[];
    success: number[];
    warning: number[];
    danger: number[];
    gray: number[];
    lightGray: number[];
  }
}

/**
 * Handles the generation of all PDF content
 */
const generateDocument = async (
  pdf: jsPDF, 
  { params, statistics, formatAmount, chartRef, COLORS }: EnhancedReportParams
): Promise<void> => {
  // Set default font
  pdf.setFont('helvetica');
  
  // Initialize PDF position tracking
  // This ensures lastAutoTable.finalY is defined even before any tables are created
  pdf.lastAutoTable = { finalY: 35 }; // Start below the header
  
  // 1. Generate header (this stays as the first section)
  generateHeader(pdf, params, COLORS);
  
  // 2. Key Financial Insights (moved up from its original position)
  generateKeyFinancialInsights(pdf, params, statistics, formatAmount, COLORS);
  
  // Check if Risk Assessment fits on current page
  if ((pdf.lastAutoTable?.finalY || 200) > 200) {
    pdf.addPage();
    // Add header to new page
    addPageHeader(pdf, COLORS);
    // Reset Y position after page break
    pdf.lastAutoTable = { finalY: 30 };
  }
  
  // 3. Risk Assessment (moved up from its original position)
  generateRiskAssessment(pdf, params, statistics, formatAmount, COLORS);
  
  // Check if Executive Summary will fit on the current page
  if ((pdf.lastAutoTable?.finalY || 200) > 200) {
    pdf.addPage();
    // Add header to new page
    addPageHeader(pdf, COLORS);
    // Reset Y position after page break
    pdf.lastAutoTable = { finalY: 30 };
  }
  
  // 4. Executive Summary (moved down from its original position)
  generateExecutiveSummary(pdf, params, statistics, formatAmount, COLORS);
  
  // 5. Add Capital Evolution Chart
  // Check if Capital Chart will fit on the current page
  if (chartRef && chartRef.current) {
    const yPosition = (pdf.lastAutoTable?.finalY || 200) + 15;
    if (yPosition > 200) { // Move to next page if less than ~7cm available
      pdf.addPage();
      // Add header to new page
      addPageHeader(pdf, COLORS);
      await addCapitalChart(pdf, chartRef, 30, COLORS);
    } else {
      await addCapitalChart(pdf, chartRef, pdf.lastAutoTable?.finalY + 10 || 40, COLORS);
    }
  }
  
  // 6. Detailed Results always starts on a new page (this stays as the last section)
  pdf.addPage();
  // Add header to new page
  addPageHeader(pdf, COLORS);
  // Reset Y position after page break
  pdf.lastAutoTable = { finalY: 30 };
  generateDetailedResults(pdf, params, statistics, formatAmount, COLORS);
  
  // Add page numbers and footer to each page
  addPageNumbersAndFooter(pdf, COLORS);
};

/**
 * Adds consistent header to each page after the first
 */
const addPageHeader = (pdf: jsPDF, COLORS: EnhancedReportParams['COLORS']): void => {
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Retirement Planning Report', 105, 10, { align: 'center' });
  
  // Add subtle separator line
  pdf.setDrawColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  pdf.setLineWidth(0.1);
  pdf.line(20, 15, 190, 15);
};

/**
 * Generates the document header with title and date
 */
const generateHeader = (pdf: jsPDF, params: SimulatorParams, COLORS: EnhancedReportParams['COLORS']): void => {
  // Set title
  pdf.setFontSize(24);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]); // Dark blue-gray
  pdf.text('Retirement Planning Report', 105, 20, { align: 'center' });
  
  // Add current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]); // Gray
  pdf.text(`Generated on ${formattedDate}`, 105, 27, { align: 'center' });
  
  // Add decorative line
  pdf.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]); // Blue
  pdf.setLineWidth(0.5);
  pdf.line(20, 32, 190, 32);
};

/**
 * Adds the capital evolution chart to the PDF
 */
const addCapitalChart = async (
  pdf: jsPDF, 
  chartRef: React.RefObject<HTMLDivElement>,
  startY: number = 20, // Default y position if not specified
  COLORS: EnhancedReportParams['COLORS']
): Promise<void> => {
  try {
    if (!chartRef.current) return;
    
    // Add a small delay to ensure the chart is fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create canvas from chart element
    const canvas = await html2canvas(chartRef.current, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true, // Allow cross-origin images
      backgroundColor: '#ffffff'
    });
    
    // Get image data
    const imgData = canvas.toDataURL('image/png');
    
    // No longer add a new page for chart
    
    // Add chart title
    pdf.setFontSize(16);
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.text('Capital Evolution Over Time', 105, startY, { align: 'center' });
    
    // Calculate dimensions to maintain aspect ratio but ensure it fits on the page
    const availableWidth = 170;
    const availableHeight = 270 - startY - 15; // Leave some space at bottom
    
    let imgWidth = availableWidth;
    let imgHeight = canvas.height * imgWidth / canvas.width;
    
    // If image is too tall, scale it down further
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = canvas.width * imgHeight / canvas.height;
    }
    
    // Add the chart image
    pdf.addImage(imgData, 'PNG', (210 - imgWidth) / 2, startY + 5, imgWidth, imgHeight);
    
    // Improve caption with more detail
    pdf.setFontSize(9);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    const captionY = startY + 5 + imgHeight + 3;
    pdf.text(
      'This chart shows the projected evolution of your capital over time. The blue area represents your investment growth during the accumulation phase,\nwhile the green section shows your capital during retirement. The red line indicates your capital without investment returns.',
      105, captionY, { align: 'center' }
    );
    
    // Update the Y position for next content
    // Ensure lastAutoTable exists to prevent errors
    if (!pdf.lastAutoTable) {
      pdf.lastAutoTable = { finalY: 0 };
    }
    pdf.lastAutoTable.finalY = captionY + 15;
    
  } catch (error) {
    console.error('Error adding chart to PDF:', error);
    // Continue PDF generation even if chart fails
    
    // Make sure lastAutoTable is defined even if chart fails
    if (!pdf.lastAutoTable) {
      pdf.lastAutoTable = { finalY: startY + 30 };
    }
  }
};

/**
 * Generates the executive summary section with key metrics
 */
const generateExecutiveSummary = (
  pdf: jsPDF, 
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: EnhancedReportParams['COLORS']
): void => {
  // Debug log to check inputs
  console.log('Executive Summary Data:', {
    params,
    statistics,
    formatAmountTest: formatAmount(1000) // Test if formatAmount works
  });
  
  // Get the current Y position, with fallback
  const currentY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 10 : 45;
  
  // Set up section with improved styling
  pdf.setFontSize(22);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]); // Dark blue-gray
  pdf.text('Executive Summary', 20, currentY);
  
  // Add decorative line under title
  pdf.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]); // Blue
  pdf.setLineWidth(0.5);
  pdf.line(20, currentY + 3, 80, currentY + 3);
  
  // Add section description with improved typography
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]); // Medium gray
  pdf.text('Overview of your retirement plan and key financial metrics', 20, currentY + 9);
  
  // Helper function to safely format values
  const safeFormat = (value: any, suffix: string = ''): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
      return formatAmount(value) + suffix;
    }
    return String(value) + suffix;
  };
  
  // Helper function for non-monetary values
  const safeString = (value: any, suffix: string = ''): string => {
    if (value === undefined || value === null) return 'N/A';
    return String(value) + suffix;
  };
  
  // Prepare data for tables with enhanced visual indicators and safer value handling
  
  // Table 1: Current Status (Top Left)
  const currentStatusData = [
    ['Current Age:', safeString(params.currentAge, ' years')],
    ['Initial Capital:', safeFormat(params.initialCapital)],
    ['Monthly Investment:', safeFormat(params.monthlyInvestment)]
  ];
  
  // Table 2: Retirement Plan (Top Right)
  const retirementPlanData = [
    ['Retirement Age:', safeString(statistics.retirementStartAge, ' years')],
    ['Years Until Retirement:', safeString(statistics.retirementStartAge && params.currentAge ? 
                                  statistics.retirementStartAge - params.currentAge : 'N/A', ' years')],
    ['Monthly Retirement Income:', safeFormat(params.monthlyRetirementWithdrawal)]
  ];
  
  // Table 3: Investment Strategy (Bottom Left)
  const investmentStrategyData = [
    ['Expected Annual Return:', safeString(params.annualReturnRate, '%')],
    ['Inflation Rate:', safeString(params.inflation, '%')],
    ['Compound Frequency:', params.compoundFrequency === 'monthly' ? 'Monthly' : 'Annual']
  ];
  
  // Add withdrawal strategy to give more context
  const withdrawalDescription = params.withdrawalMode === 'amount' 
    ? 'Fixed amount' 
    : params.withdrawalMode === 'rate' 
      ? safeString(params.withdrawalRate, '% of capital annually')
      : 'Sustainable through target age';
  
  // Table 4: Retirement Outlook (Bottom Right)
  // Include capital depletion age explicitly if capital will be exhausted
  const capitalStatusText = statistics.isCapitalExhausted 
    ? 'Will be depleted at age ' + safeString(statistics.exhaustionAge)
    : 'Sufficient for lifetime';
  
  const retirementOutlookData = [
    ['Capital at Retirement:', safeFormat(statistics.capitalAtRetirement)],
    ['Retirement Duration:', safeString(statistics.retirementDuration, ' years')],
    ['Withdrawal Strategy:', withdrawalDescription],
    ['Capital Status:', capitalStatusText]
  ];
  
  // Log the data being used for tables
  console.log('Table Data:', {
    currentStatusData,
    retirementPlanData,
    investmentStrategyData,
    retirementOutlookData
  });
  
  // Add visual indicator for capital status
  const capitalStatusColor = statistics.isCapitalExhausted 
    ? [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]] // Red for depleted
    : [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green for sufficient
  
  // Enhanced table style with modern look
  const tableStyle = {
    headStyles: { 
      fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      textColor: 50,
      lineWidth: 0.1,
      lineColor: [COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]]
    },
    alternateRowStyles: { 
      fillColor: [245, 250, 254] // Very light blue for better contrast
    },
    margin: { top: 5 },
    styles: { 
      cellPadding: 5, 
      fontSize: 10,
      font: 'helvetica',
      overflow: 'linebreak'
    }
  };
  
  // Update the table start Y position
  const tableStartY = currentY + 20;
  
  // Add heading above the tables to clarify the layout
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Current Situation', 20, tableStartY - 3);
  pdf.text('Retirement Goals', 110, tableStartY - 3);
  
  // Add tables with improved spacing and visual separation
  // Table 1: Current Status
  pdf.autoTable({
    head: [['Current Status']],
    body: currentStatusData,
    startY: tableStartY,
    theme: 'grid',
    ...tableStyle,
    tableWidth: 85, // Increased table width
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 35 } // Increased cell width for values
    },
    headStyles: {
      ...tableStyle.headStyles,
      fillColor: [COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]] // Slightly lighter blue for first table
    },
    margin: { left: 15 } // Adjusted margin to fit better
  });
  
  // Table 2: Retirement Plan
  pdf.autoTable({
    head: [['Retirement Plan']],
    body: retirementPlanData,
    startY: tableStartY,
    theme: 'grid',
    ...tableStyle,
    tableWidth: 85, // Increased table width
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 35 } // Increased cell width for values
    },
    headStyles: {
      ...tableStyle.headStyles,
      fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]] // Standard blue for second table
    },
    margin: { left: 110 }
  });
  
  const finalY1 = pdf.lastAutoTable?.finalY || tableStartY + 40;
  
  // Add heading above the bottom tables
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Investment Approach', 20, finalY1 + 10);
  pdf.text('Retirement Outcome', 110, finalY1 + 10);
  
  // Table 3: Investment Strategy
  pdf.autoTable({
    head: [['Investment Strategy']],
    body: investmentStrategyData,
    startY: finalY1 + 13,
    theme: 'grid',
    ...tableStyle,
    tableWidth: 85, // Increased table width
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 35 } // Increased cell width for values
    },
    headStyles: {
      ...tableStyle.headStyles,
      fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]] // Darker blue for third table
    },
    margin: { left: 15 } // Adjusted margin to fit better
  });
  
  // Table 4: Retirement Outlook
  pdf.autoTable({
    head: [['Retirement Outlook']],
    body: retirementOutlookData,
    startY: finalY1 + 13,
    theme: 'grid',
    ...tableStyle,
    tableWidth: 85, // Increased table width
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 35 } // Increased cell width for values
    },
    didDrawCell: function(data: {
      row: { index: number };
      column: { index: number };
      cell: { x: number; y: number; width: number; height: number };
    }) {
      // Add color indicator to Capital Status cell
      if (data.row.index === 3 && data.column.index === 1) {
        pdf.setFillColor(capitalStatusColor[0], capitalStatusColor[1], capitalStatusColor[2]);
        pdf.circle(
          data.cell.x + 5, 
          data.cell.y + data.cell.height/2, 
          2, 
          'F'
        );
      }
    },
    headStyles: {
      ...tableStyle.headStyles,
      fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]] // Standard blue for fourth table
    },
    margin: { left: 110 }
  });
  
  // Add a visual summary indicator - retirement readiness gauge
  const gaugeY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 10 : finalY1 + 70;
  
  // Only add if there's enough space
  if (gaugeY < 155) {
    // Calculate readiness score (simple example)
    let readinessScore = 0;
    
    // Factor 1: Years until retirement (more years = more time to prepare)
    const yearsUntilRetirement = statistics.retirementStartAge - params.currentAge;
    readinessScore += Math.min(yearsUntilRetirement / 40, 1) * 20; // Max 20 points
    
    // Factor 2: Capital at retirement vs needed
    const annualNeeds = params.monthlyRetirementWithdrawal * 12;
    const yearsOfCoverage = statistics.isCapitalExhausted 
      ? (statistics.exhaustionAge - statistics.retirementStartAge)
      : (statistics.lifeExpectancy - statistics.retirementStartAge);
    const idealYears = statistics.lifeExpectancy - statistics.retirementStartAge + 5; // Add 5 year buffer
    readinessScore += Math.min(yearsOfCoverage / idealYears, 1) * 40; // Max 40 points
    
    // Factor 3: Withdrawal rate sustainability
    const withdrawalRate = (params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement) * 100;
    readinessScore += Math.max(0, Math.min((8 - withdrawalRate) / 4, 1)) * 40; // Max 40 points
    
    // Generate the gauge visualization
    generateRetirementReadinessGauge(pdf, gaugeY, readinessScore, COLORS);
  }
};

/**
 * Generates the retirement readiness gauge in the Executive Summary
 */
const generateRetirementReadinessGauge = (
  pdf: jsPDF,
  gaugeY: number,
  readinessScore: number,
  COLORS: EnhancedReportParams['COLORS']
): void => {
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Retirement Readiness', 105, gaugeY, { align: 'center' });
  
  // Draw gauge
  const gaugeWidth = 150;
  const gaugeHeight = 12;
  const gaugeX = (210 - gaugeWidth) / 2;
  const gaugeY2 = gaugeY + 10;
  
  // Background
  pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  pdf.roundedRect(gaugeX, gaugeY2, gaugeWidth, gaugeHeight, 3, 3, 'F');
  
  // Progress
  let fillColor;
  if (readinessScore < 40) {
    fillColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; // Red
  } else if (readinessScore < 70) {
    fillColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
  } else {
    fillColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green
  }
  
  pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  
  // Calculate fill width based on score (max 100)
  const fillWidth = Math.min(readinessScore, 100) / 100 * gaugeWidth;
  pdf.roundedRect(gaugeX, gaugeY2, fillWidth, gaugeHeight, 3, 3, 'F');
  
  // Add score
  pdf.setFontSize(10);
  pdf.setTextColor(255);
  pdf.text(readinessScore.toFixed(0) + '%', gaugeX + fillWidth - 10, gaugeY2 + 8);
  
  // Add labels
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Needs attention', gaugeX, gaugeY2 + gaugeHeight + 10);
  pdf.text('Well prepared', gaugeX + gaugeWidth - 25, gaugeY2 + gaugeHeight + 10);
  
  // Update the lastAutoTable position for next content
  if (!pdf.lastAutoTable) {
    pdf.lastAutoTable = { finalY: 0 };
  }
  pdf.lastAutoTable.finalY = gaugeY2 + gaugeHeight + 15;
};

/**
 * Generates the key financial insights section
 */
const generateKeyFinancialInsights = (
  pdf: jsPDF,
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: EnhancedReportParams['COLORS']
): void => {
  // Get the Y position to start (after the last element)
  const startY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 15 : 45;
  
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Key Financial Insights', 20, startY);
  
  // Section description - more informative
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Detailed analysis of your retirement plan performance and financial metrics', 20, startY + 7);
  
  // Calculate ROI and other metrics
  const totalInvested = statistics.totalInvestedAmount;
  const growthAmount = statistics.capitalAtRetirement - totalInvested;
  const growthPercentage = (growthAmount / totalInvested) * 100;
  const withdrawalRate = (params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement) * 100;
  
  // Prepare data for table - removed duplicate information about capital at retirement
  const financialInsightsData = [
    ['Total Invested Amount:', formatAmount(totalInvested)],
    ['Growth from Investments:', formatAmount(growthAmount)],
    ['Growth Percentage:', `${growthPercentage.toFixed(2)}%`],
    ['Annual Retirement Income:', formatAmount(params.monthlyRetirementWithdrawal * 12)],
    ['Initial Withdrawal Rate:', `${withdrawalRate.toFixed(2)}%`],
    ['Effective Investment CAGR:', `${calculateEffectiveCagr(totalInvested, statistics.capitalAtRetirement, statistics.retirementStartAge - params.currentAge).toFixed(2)}%`]
  ];
  
  // Add table for financial insights with improved styling
  pdf.autoTable({
    head: [['Financial Metric', 'Value']],
    body: financialInsightsData,
    startY: startY + 12,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 50 },
    alternateRowStyles: { fillColor: [240, 245, 250] },
    styles: { cellPadding: 4 }
  });
  
  // Add annual contributions section
  const contributionsY = pdf.lastAutoTable.finalY + 10;
  
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Contributions & Growth', 20, contributionsY);
  
  // Annual contribution insights
  const yearsUntilRetirement = statistics.retirementStartAge - params.currentAge;
  const totalContributions = params.monthlyInvestment * 12 * yearsUntilRetirement;
  
  // Calculate the percentage of final capital from contributions vs growth
  const contributionPercentage = (totalContributions / statistics.capitalAtRetirement) * 100;
  const growthContributionPercentage = 100 - contributionPercentage;
  
  // Add visual indicator for contribution vs growth
  // Draw a progress bar showing the breakdown
  const barWidth = 150;
  const barHeight = 12;
  const startX = 25;
  const startBarY = contributionsY + 30;
  
  // Contribution portion (blue)
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(startX, startBarY, barWidth * (contributionPercentage / 100), barHeight, 'F');
  
  // Growth portion (green)
  pdf.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.rect(startX + (barWidth * (contributionPercentage / 100)), startBarY, barWidth * (growthContributionPercentage / 100), barHeight, 'F');
  
  // Add labels
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text(`Monthly Contribution: ${formatAmount(params.monthlyInvestment)}`, 25, contributionsY + 10);
  pdf.text(`Annual Contribution: ${formatAmount(params.monthlyInvestment * 12)}`, 25, contributionsY + 17);
  pdf.text(`Total Contributions Until Retirement: ${formatAmount(totalContributions)}`, 25, contributionsY + 24);
  
  // Add legend for the progress bar
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.text(`Contributions: ${contributionPercentage.toFixed(1)}%`, startX, startBarY + barHeight + 10);
  pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  pdf.text(`Investment Growth: ${growthContributionPercentage.toFixed(1)}%`, startX + 80, startBarY + barHeight + 10);
  
  // Add investment milestones section
  const milestonesY = startBarY + barHeight + 25;
  
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Investment Milestones', 20, milestonesY);
  
  // Filter milestones greater than initial capital
  const milestones = [
    { amount: 100000, label: "$100,000" },
    { amount: 250000, label: "$250,000" },
    { amount: 500000, label: "$500,000" },
    { amount: 1000000, label: "$1 Million" }
  ].filter(m => m.amount > params.initialCapital);
  
  if (milestones.length > 0) {
    // Improved milestone calculation using compound interest
    const milestoneData = calculateMilestones(
      params.initialCapital,
      params.monthlyInvestment,
      params.annualReturnRate / 100,
      params.currentAge,
      milestones
    );
    
    // Add milestones table with improved styling
    pdf.autoTable({
      head: [['Milestone', 'Time to Reach', 'Age', 'Year']],
      body: milestoneData,
      startY: milestonesY + 8,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      styles: { cellPadding: 3 }
    });
  } else {
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text('Your initial capital already exceeds the standard milestones.', 25, milestonesY + 10);
  }
};

/**
 * Calculate milestones more accurately using compound interest
 */
const calculateMilestones = (
  initialCapital: number,
  monthlyContribution: number,
  annualRate: number, // as decimal
  currentAge: number,
  milestones: { amount: number, label: string }[]
): string[][] => {
  const currentYear = new Date().getFullYear();
  const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
  
  return milestones.map(milestone => {
    // Solve for t in: FV = P(1+r)^t + PMT * ((1+r)^t - 1) / r
    // Using approximation method for simplicity
    let months = 0;
    let capital = initialCapital;
    
    while (capital < milestone.amount && months < 1200) { // cap at 100 years
      capital *= (1 + monthlyRate);
      capital += monthlyContribution;
      months++;
    }
    
    const years = Math.round(months / 12);
    const ageAtMilestone = currentAge + years;
    const yearReached = currentYear + years;
    
    return [
      milestone.label,
      `${years} years`,
      `${ageAtMilestone}`,
      `${yearReached}`
    ];
  });
};

/**
 * Calculate the effective CAGR (Compound Annual Growth Rate)
 */
const calculateEffectiveCagr = (
  totalInvested: number,
  finalAmount: number,
  years: number
): number => {
  // CAGR = (FV/PV)^(1/n) - 1
  // This is a simplified calculation that doesn't account for the timing of contributions
  if (totalInvested <= 0 || finalAmount <= 0 || years <= 0) return 0;
  return ((finalAmount / totalInvested) ** (1 / years) - 1) * 100;
};

/**
 * Generates the risk assessment section
 */
const generateRiskAssessment = (
  pdf: jsPDF,
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: EnhancedReportParams['COLORS']
): void => {
  // Get the Y position to start (after the last element) with fallback
  const startY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 15 : 120;

  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Risk Assessment', 20, startY);
  
  // Add section description
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Analysis of potential risks to your retirement plan', 20, startY + 7);
  
  // Risk level calculation
  let riskLevel: string;
  let riskColor: number[];
  let riskDescription: string;
  
  const riskY = startY + 20;
  
  // Calculate risk based on capital exhaustion vs life expectancy
  if (statistics.isCapitalExhausted) {
    // Use a consistent fallback for expected lifespan
    const expectedLifespan = statistics.lifeExpectancy || (params.currentAge + 85);
    
    const shortfallYears = expectedLifespan - statistics.exhaustionAge;
    
    if (shortfallYears > 10) {
      riskLevel = 'High Risk';
      riskColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; // Red
      riskDescription = `Your capital is projected to run out at age ${statistics.exhaustionAge}, which is ${shortfallYears} years before your expected age of ${expectedLifespan}. Consider increasing savings, delaying retirement, or reducing withdrawals.`;
    } else {
      riskLevel = 'Moderate Risk';
      riskColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      riskDescription = `Your capital is projected to run out at age ${statistics.exhaustionAge}, which is ${shortfallYears} years before your expected age of ${expectedLifespan}. Minor adjustments to your plan could help close this gap.`;
    }
  } else {
    // Calculate safety margin as a percentage of remaining capital at life expectancy compared to peak capital
    // Check if we have access to yearlyResults or use finalCapital instead
    let safetyMargin: number;
    
    if (statistics.finalCapital !== undefined && statistics.capitalAtRetirement !== undefined) {
      safetyMargin = (statistics.finalCapital / statistics.capitalAtRetirement) * 100;
    } else {
      // Fallback if we don't have the year-by-year data
      safetyMargin = 50; // Default to a moderate value
    }
    
    if (safetyMargin > 75) {
      riskLevel = 'Very Low Risk';
      riskColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green
      riskDescription = 'Your retirement plan is very well-funded with a substantial safety margin. Your capital is projected to last throughout your expected lifetime with significant reserves remaining.';
    } else if (safetyMargin > 30) {
      riskLevel = 'Low Risk';
      riskColor = [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]]; // Blue
      riskDescription = 'Your retirement plan appears well-funded. Your capital is projected to last throughout your expected lifetime with a comfortable safety margin.';
    } else {
      riskLevel = 'Low to Moderate Risk';
      riskColor = [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]]; // Blue
      riskDescription = 'Your retirement plan should support your lifetime needs, but with a limited safety margin. Consider small adjustments to increase your financial cushion.';
    }
  }
  
  // Add risk level indicator
  addRiskIndicator(pdf, 20, riskY, riskLevel, riskColor, 100, COLORS);
  
  // Risk description
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  
  // Wrap text to fit within page width
  const textLines = pdf.splitTextToSize(riskDescription, 170);
  pdf.text(textLines, 20, riskY + 18);
  
  // Risk factors section
  const riskFactorsY = riskY + 25 + (textLines.length * 5);
  
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Key Risk Factors', 20, riskFactorsY);
  
  // Define risk factors
  const riskFactors = [
    {
      factor: 'Longevity Risk',
      description: `Living longer than expected (beyond age ${statistics.lifeExpectancy || (params.currentAge + 85)})`,
      impact: statistics.isCapitalExhausted ? 'High' : 
              (statistics.finalCapital && statistics.capitalAtRetirement && 
               statistics.finalCapital / statistics.capitalAtRetirement < 0.3 ? 'Moderate' : 'Low')
    },
    {
      factor: 'Market Risk',
      description: `Lower than expected returns (below ${params.annualReturnRate || 5}%)`,
      impact: (params.annualReturnRate || 5) > 8 ? 'High' : ((params.annualReturnRate || 5) > 5 ? 'Moderate' : 'Low')
    },
    {
      factor: 'Inflation Risk',
      description: `Higher than expected inflation (above ${params.inflation || 2}%)`,
      impact: (params.inflation || 2) < 2 ? 'Moderate' : ((params.inflation || 2) < 3 ? 'Low' : 'Very Low')
    },
    {
      factor: 'Withdrawal Rate Risk',
      description: `Withdrawal rate (${(params.monthlyRetirementWithdrawal && statistics.capitalAtRetirement) 
                      ? ((params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement) * 100).toFixed(1) 
                      : '4'}%) exceeds safe levels`,
      impact: (params.monthlyRetirementWithdrawal && statistics.capitalAtRetirement)
              ? ((params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement) > 0.04 ? 'High' : 'Low')
              : 'Moderate'
    }
  ];
  
  // Prepare data for the risk factors table
  const riskFactorData = riskFactors.map(factor => {
    let impactColor;
    switch(factor.impact) {
      case 'High': impactColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; break; // Red
      case 'Moderate': impactColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; break; // Orange
      case 'Low': impactColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; break; // Green
      default: impactColor = [COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]]; // Gray
    }
    
    return [
      factor.factor,
      factor.description,
      {
        content: factor.impact,
        styles: {
          halign: 'center',
          fillColor: impactColor,
          textColor: 255,
          fontStyle: 'bold'
        }
      }
    ];
  });
  
  // Generate risk factors table
  pdf.autoTable({
    head: [['Risk Factor', 'Description', 'Impact']],
    body: riskFactorData,
    startY: riskFactorsY + 8,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 50 },
    alternateRowStyles: { fillColor: [240, 245, 250] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 }
    }
  });
  
  // Sensitivity Analysis
  const sensitivityY = pdf.lastAutoTable.finalY + 15;
  
  if (sensitivityY < 250) {
    pdf.setFontSize(14);
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.text('Sensitivity Analysis', 20, sensitivityY);
    
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text('How changes in key assumptions affect your retirement capital', 20, sensitivityY + 7);
    
    // Calculate modified capital at retirement age with different assumptions
    const baseCapital = statistics.capitalAtRetirement || 0;
    
    // Get the return rate from params
    const returnRate = params.annualReturnRate || 5;
    
    // Estimate capital impact with varied assumptions
    // These are simplified estimates for illustration purposes
    const sensitivityData = [
      ['Return Rate', `-1% (${returnRate - 1}%)`, `Base (${returnRate}%)`, `+1% (${returnRate + 1}%)`],
      ['Capital at Retirement', 
        {
          content: formatAmount(baseCapital * 0.9),
          styles: { textColor: COLORS.danger[0], fontStyle: 'bold' }
        },
        formatAmount(baseCapital),
        {
          content: formatAmount(baseCapital * 1.1), 
          styles: { textColor: COLORS.success[0], fontStyle: 'bold' }
        }
      ],
      ['Inflation', 
        {
          content: `+1% (${(params.inflation || 2) + 1}%)`,
          styles: { textColor: COLORS.danger[0], fontStyle: 'bold' }
        },
        `Base (${params.inflation || 2}%)`,
        {
          content: `-1% (${Math.max(0, (params.inflation || 2) - 1)}%)`,
          styles: { textColor: COLORS.success[0], fontStyle: 'bold' }
        }
      ],
      ['Capital Depletion Age', 
        {
          content: statistics.isCapitalExhausted ? `Age ${Math.max(statistics.retirementStartAge, statistics.exhaustionAge - 3)}` : 'N/A',
          styles: statistics.isCapitalExhausted ? { textColor: COLORS.danger[0], fontStyle: 'bold' } : {}
        },
        statistics.isCapitalExhausted ? `Age ${statistics.exhaustionAge}` : 'Never',
        {
          content: statistics.isCapitalExhausted ? `Age ${statistics.exhaustionAge + 5}` : 'Never',
          styles: { textColor: COLORS.success[0], fontStyle: 'bold' }
        }
      ]
    ];
    
    // Generate sensitivity table
    pdf.autoTable({
      body: sensitivityData,
      startY: sensitivityY + 15,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [240, 245, 250] }
    });
    
    // Add legend
    const legendY = pdf.lastAutoTable.finalY + 8;
    pdf.setFontSize(9);
    pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    pdf.text('Negative Impact', 20, legendY);
    
    pdf.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
    pdf.text('Positive Impact', 70, legendY);
  }
};

/**
 * Generates the detailed results section with yearly breakdown
 */
const generateDetailedResults = (
  pdf: jsPDF,
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: EnhancedReportParams['COLORS']
): void => {
  // Section title
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Detailed Results', 20, 20);
  
  // Section description
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Year-by-year breakdown of your retirement plan', 20, 27);
  
  // Detailed results table
  // Create data rows based on the yearly results
  const yearlyData = (statistics as any).yearlyResults?.map((result: any, index: number) => {
    const year = result.year;
    const age = statistics.ageAtYear(year);
    const capital = result.capital;
    
    // Calculate today's value (adjusted for inflation)
    const inflationFactor = Math.pow(1 + (params.inflation || 2) / 100, index);
    const todaysValue = capital / inflationFactor;
    
    // Highlight specific years
    let rowStyles = {};
    
    // Highlight retirement year
    if (age === statistics.retirementStartAge) {
      rowStyles = { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2], 0.2] };
    }
    
    // Highlight capital exhaustion year
    if (statistics.isCapitalExhausted && age === statistics.exhaustionAge) {
      rowStyles = { fillColor: [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2], 0.2] };
    }
    
    return [
      { content: year.toString(), styles: rowStyles },
      { content: age.toString(), styles: rowStyles },
      { content: formatAmount(capital), styles: rowStyles },
      { content: formatAmount(todaysValue), styles: { ...rowStyles, fontStyle: 'italic' } },
      { 
        content: age >= statistics.retirementStartAge ? 'Withdrawal' : 'Accumulation',
        styles: {
          ...rowStyles,
          textColor: age >= statistics.retirementStartAge ? 
                    [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]] : 
                    [COLORS.success[0], COLORS.success[1], COLORS.success[2]],
          fontStyle: 'bold'
        }
      }
    ];
  }) || [];
  
  // Group data by decade
  const decades: {[key: string]: any[][]} = {};
  yearlyData.forEach((row: any, index: number) => {
    const year = (statistics as any).yearlyResults?.[index]?.year || new Date().getFullYear() + index;
    const decade = Math.floor(year / 10) * 10;
    if (!decades[decade]) {
      decades[decade] = [];
    }
    decades[decade].push(row);
  });
  
  // Generate a table for each decade
  let currentY = 35;
  Object.keys(decades).sort((a, b) => parseInt(a) - parseInt(b)).forEach((decade, index) => {
    // Add decade header
    if (index > 0) {
      currentY += 10;
    }
    
    pdf.setFontSize(12);
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.text(`${decade}s`, 20, currentY);
    
    pdf.autoTable({
      head: [['Year', 'Age', 'Capital', 'Today\'s Value*', 'Phase']],
      body: decades[decade],
      startY: currentY + 5,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [240, 245, 250] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 50 },
        4: { cellWidth: 40 }
      },
      margin: { top: 30 }
    });
    
    currentY = pdf.lastAutoTable.finalY;
    
    // Add page if we're at the end and have more decades
    if (currentY > 250 && index < Object.keys(decades).length - 1) {
      pdf.addPage();
      // Add header to new page
      addPageHeader(pdf, COLORS);
      currentY = 30;
    }
  });
  
  // Add inflation explanation
  const inflationNoteY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 5 : 200;
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text(`* "Today's Value" shows the purchasing power in current dollars, adjusted for ${params.inflation || 2}% annual inflation.`, 20, inflationNoteY);
  
  // Add important notes and interpretations
  const notesY = inflationNoteY + 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Notes:', 20, notesY);
  
  const notes = [
    'This projection is based on the parameters you provided and should be reviewed periodically.',
    'Market returns may vary significantly year to year, affecting actual results.',
    'Consider consulting with a financial advisor to develop a comprehensive retirement strategy.'
  ];
  
  notes.forEach((note, index) => {
    pdf.text(`• ${note}`, 25, notesY + 6 + (index * 5));
  });
};

/**
 * Adds page numbers to all pages
 */
const addPageNumbers = (pdf: jsPDF, COLORS: EnhancedReportParams['COLORS']): void => {
  const pageCount = pdf.getNumberOfPages();
  
  // For each page
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
};

/**
 * Add a professional footer to each page
 */
const addPageNumbersAndFooter = (pdf: jsPDF, COLORS: EnhancedReportParams['COLORS']): void => {
  const pageCount = pdf.getNumberOfPages();
  
  // For each page
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Add page numbers
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    
    // Add footer with divider line
    pdf.setDrawColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    pdf.setLineWidth(0.1);
    pdf.line(20, 280, 190, 280);
    
    // Add disclaimer and contact information
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text('This report is for informational purposes only and should not be considered financial advice.', 20, 285);
    pdf.text('© ' + new Date().getFullYear() + ' Retraite Planning Tool', 190, 285, { align: 'right' });
  }
};

/**
 * Creates a visual risk indicator
 */
const addRiskIndicator = (
  pdf: jsPDF, 
  x: number, 
  y: number, 
  riskLevel: string, 
  riskColor: number[], 
  width: number = 60,
  COLORS: EnhancedReportParams['COLORS']
): void => {
  // Draw risk level indicator box
  pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.1);
  pdf.roundedRect(x, y, width, 10, 2, 2, 'FD');
  
  // Add risk level text
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFont('helvetica', 'bold');
  pdf.text(riskLevel, x + width/2, y + 6, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
}; 