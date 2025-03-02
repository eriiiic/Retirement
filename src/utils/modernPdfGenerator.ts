import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { SimulatorParams, Statistics, GraphDataPoint } from '../components/retirement/types';
import html2canvas from 'html2canvas';

// Apply the plugin to extend jsPDF
applyPlugin(jsPDF);

// Types
interface JPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => JPDFWithAutoTable;
  lastAutoTable: {
    finalY: number;
  };
}

// Ensure jsPDF is properly augmented with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF & { lastAutoTable: { finalY: number } };
    lastAutoTable: { finalY: number };
  }
}

interface GenerateReportParams {
  params: SimulatorParams;
  statistics: Statistics & { 
    ageAtYear?: (year: number) => number 
  };
  formatAmount: (amount: number) => string;
  graphData: GraphDataPoint[];
  chartRef?: React.RefObject<HTMLDivElement>;
}

// Color scheme that matches the website
const PDF_COLORS = {
  primary: [41, 128, 185],      // Blue
  secondary: [26, 188, 156],    // Teal
  dark: [44, 62, 80],           // Dark blue/gray
  success: [46, 204, 113],      // Green
  warning: [241, 196, 15],      // Yellow
  danger: [231, 76, 60],        // Red
  gray: [149, 165, 166],        // Gray
  lightGray: [236, 240, 241]    // Light gray
};

/**
 * Main function to generate and download the retirement report PDF
 */
export const generateModernRetirementReport = async ({
  params,
  statistics,
  formatAmount,
  graphData,
  chartRef
}: GenerateReportParams): Promise<void> => {
  try {
    console.log('Starting PDF generation with modernPdfGenerator...');
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    }) as JPDFWithAutoTable;
    
    console.log('PDF document created');
    
    // Set document properties
    pdf.setProperties({
      title: 'Your Financial Independence Plan',
      subject: 'Retirement Planning Analysis',
      creator: 'FIRE Calculator'
    });

    // Add the retirement age calculation helper if not already present
    if (!statistics.ageAtYear) {
      statistics.ageAtYear = (year: number) => {
        return params.currentAge + (year - new Date().getFullYear());
      };
    }
    
    console.log('Generating PDF content...');
    
    // Generate the PDF content
    await generateDocument(pdf, { 
      params, 
      statistics, 
      formatAmount, 
      graphData,
      chartRef,
      COLORS: PDF_COLORS 
    });
    
    console.log('PDF content generated successfully, preparing to save...');
    
    // Use a more explicit filename
    const filename = `FIRE_Plan_${new Date().toISOString().slice(0, 10)}.pdf`;
    console.log('Saving PDF with filename:', filename);
    
    // Try multiple methods to ensure the PDF is accessible to the user
    
    // Method 1: Save file for download (standard method)
    try {
      console.log('Trying standard download method...');
      pdf.save(filename);
      console.log('Standard download method executed');
    } catch (err) {
      console.error('Standard download method failed:', err);
    }
    
    // Method 2: Open in new tab
    try {
      console.log('Trying to open PDF in new tab...');
      const pdfOutput = pdf.output('datauristring');
      window.open(pdfOutput, '_blank');
      console.log('PDF opened in new tab');
    } catch (err) {
      console.error('Opening in new tab failed:', err);
    }
    
    // Method 3: Blob and download link fallback
    try {
      console.log('Trying blob URL download method...');
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      // Append to document
      document.body.appendChild(downloadLink);
      downloadLink.click();
      // Cleanup
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);
      console.log('Blob URL download method executed');
    } catch (err) {
      console.error('Blob URL download method failed:', err);
    }
    
    console.log('All PDF save methods attempted');
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    // Re-throw to allow the calling component to handle the error
    throw error;
  }
};

/**
 * Core function to generate the PDF document
 */
const generateDocument = async (
  pdf: JPDFWithAutoTable, 
  { params, statistics, formatAmount, graphData, chartRef, COLORS }: GenerateReportParams & { COLORS: typeof PDF_COLORS }
): Promise<void> => {
  // Add cover page
  addCoverPage(pdf, params, statistics, COLORS);
  
  // Add summary page with executive summary, key financial insights, and capital chart all on the same page
  pdf.addPage();
  addPageHeader(pdf, COLORS);
  addExecutiveSummary(pdf, params, statistics, formatAmount, COLORS);
  
  // Add Key Financial Insights directly after Executive Summary on the same page
  addKeyFinancialInsights(pdf, params, statistics, formatAmount, COLORS);
  
  // Add capital chart on the same page if available
  if (chartRef?.current) {
    await addCapitalChart(pdf, chartRef, pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 25 : 180, COLORS);
  }
  
  // Add risk assessment
  pdf.addPage();
  addPageHeader(pdf, COLORS);
  addRiskAssessment(pdf, params, statistics, formatAmount, COLORS);
  
  // Add yearly breakdown
  pdf.addPage();
  addPageHeader(pdf, COLORS);
  addYearlyBreakdown(pdf, params, statistics, formatAmount, graphData, COLORS);
  
  // Add page numbers to all pages
  addPageNumbers(pdf, COLORS);
};

/**
 * Add an attractive cover page to the report
 */
const addCoverPage = (
  pdf: JPDFWithAutoTable, 
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear?: (year: number) => number },
  COLORS: typeof PDF_COLORS
): void => {
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Add colored background to top portion
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(0, 0, pageWidth, pageHeight / 3, 'F');
  
  // Add title
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text('Your Path to Financial Independence', pageWidth / 2, pageHeight / 6, { align: 'center' });
  
  // Add subtitle
  pdf.setFontSize(16);
  pdf.text('Personalized FIRE Analysis', pageWidth / 2, pageHeight / 6 + 10, { align: 'center' });
  
  // Add decorative element
  pdf.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 4, pageHeight / 3 + 5, pageWidth * 3 / 4, pageHeight / 3 + 5);
  
  // Add report information
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const infoY = pageHeight / 2;
  pdf.text(`Prepared on: ${today}`, pageWidth / 2, infoY, { align: 'center' });
  pdf.text(`Current Age: ${params.currentAge} years`, pageWidth / 2, infoY + 10, { align: 'center' });
  pdf.text(`Target Retirement Age: ${statistics.retirementStartAge} years`, pageWidth / 2, infoY + 20, { align: 'center' });
  
  // Add footer with disclaimer
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('This report is based on your input parameters and should be used for informational purposes only.', 
    pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text('Financial projections are estimates and actual results may vary.', 
    pageWidth / 2, pageHeight - 10, { align: 'center' });
};

/**
 * Add consistent page header to each page
 */
const addPageHeader = (pdf: JPDFWithAutoTable, COLORS: typeof PDF_COLORS): void => {
  const pageWidth = pdf.internal.pageSize.width;
  
  // Add header background
  pdf.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.rect(0, 0, pageWidth, 15, 'F');
  
  // Add header text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FINANCIAL INDEPENDENCE PLAN', pageWidth / 2, 10, { align: 'center' });
  
  // Add decorative line
  pdf.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  pdf.setLineWidth(0.5);
  pdf.line(10, 17, pageWidth - 10, 17);
};

/**
 * Add a readable executive summary
 */
const addExecutiveSummary = (
  pdf: JPDFWithAutoTable, 
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear?: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: typeof PDF_COLORS
): void => {
  const pageWidth = pdf.internal.pageSize.width;
  const startY = 25;
  
  // Section header
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', pageWidth / 2, startY, { align: 'center' });
  
  // Helper function for formatting
  const safeFormat = (value: any, suffix: string = ''): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') return formatAmount(value) + suffix;
    return String(value) + suffix;
  };
  
  // Add retirement readiness assessment with reduced spacing
  const readinessY = startY + 10; // Reduced spacing
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Retirement Readiness', pageWidth / 2, readinessY, { align: 'center' });
  
  // Calculate readiness score based on capital needs vs projected capital
  let readinessScore = 0;
  if (statistics.totalNeededCapital > 0) {
    readinessScore = Math.min(100, (statistics.capitalAtRetirement / statistics.totalNeededCapital) * 100);
  }
  
  // Determine readiness level and color (matching risk assessment style)
  let readinessLevel: string;
  let readinessColor: number[];
  let readinessDescription: string;
  
  if (statistics.isCapitalExhausted) {
    // Use a consistent fallback for expected lifespan
    const expectedLifespan = statistics.lifeExpectancy || (params.currentAge + 85);
    
    const shortfallYears = expectedLifespan - statistics.exhaustionAge;
    
    if (shortfallYears > 10) {
      readinessLevel = 'High Risk';
      readinessColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; // Red
      readinessDescription = `Your retirement plan shows significant risk. Your capital is projected to run out at age ${statistics.exhaustionAge}, which is ${shortfallYears} years before your expected age of ${expectedLifespan}. Consider increasing savings, delaying retirement, or reducing withdrawals.`;
    } else {
      readinessLevel = 'Moderate Risk';
      readinessColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      readinessDescription = `Your retirement plan shows moderate risk. Your capital is projected to run out at age ${statistics.exhaustionAge}, which is ${shortfallYears} years before your expected age of ${expectedLifespan}. Minor adjustments to your plan could help close this gap.`;
    }
  } else {
    // Calculate safety margin as a percentage of target vs. actual
    const safetyMargin = readinessScore;
    
    if (safetyMargin >= 100) {
      readinessLevel = 'Very Low Risk';
      readinessColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green
      readinessDescription = `Your retirement plan appears very robust. Your projected capital exceeds your estimated needs, providing a significant safety margin. You may even be able to increase your retirement spending or leave a legacy.`;
    } else if (safetyMargin >= 75) {
      readinessLevel = 'Low Risk';
      readinessColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green
      readinessDescription = `Your retirement appears secure. Your projected capital is close to meeting your estimated needs, though market fluctuations could impact this. Consider maintaining your current strategy.`;
    } else if (safetyMargin >= 50) {
      readinessLevel = 'Low-Moderate Risk';
      readinessColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      readinessDescription = `Your plan shows your capital will likely last, but with a limited safety margin. Consider small adjustments to improve resilience against market volatility or unexpected expenses.`;
    } else if (safetyMargin >= 25) {
      readinessLevel = 'Moderate Risk';
      readinessColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      readinessDescription = `Your retirement plan needs adjustments. Your projected capital is below your estimated needs. Consider increasing your savings rate, adjusting your investment strategy, or planning for reduced expenses in retirement.`;
    } else {
      readinessLevel = 'High Risk';
      readinessColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; // Red
      readinessDescription = `Your retirement plan requires significant attention. Your projected capital falls well short of your estimated needs. Consider substantially increasing your savings rate, delaying retirement, or significantly reducing your expected retirement expenses.`;
    }
  }
  
  // Add risk indicator like in the risk assessment section
  addRiskIndicator(pdf, 20, readinessY + 8, readinessLevel, readinessColor, 60, COLORS);
  
  // Add readiness description - align text vertically with the risk indicator with reduced spacing
  pdf.setFontSize(10); // Smaller font
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text(readinessDescription, 90, readinessY + 13, { maxWidth: pageWidth - 100 });
  
  // Add readiness gauge with consistent colors from risk assessment and reduced spacing
  addRetirementReadinessGauge(pdf, readinessY + 35, readinessScore, readinessColor, COLORS);
  
  // Add percentage text below gauge with reduced spacing
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFontSize(10); // Smaller font
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${Math.round(readinessScore)}% of estimated needs covered`, pageWidth / 2, readinessY + 47, { align: 'center' });
  
  // Add key highlights with reduced spacing
  pdf.setFontSize(10); // Smaller font
  pdf.setFont('helvetica', 'normal');
  
  const highlightsY = readinessY + 55; // Reduced spacing
  const capitalInfo = statistics.isCapitalExhausted 
    ? `Your retirement funds are projected to last until age ${statistics.exhaustionAge}.`
    : `Your retirement funds are projected to last throughout your lifetime.`;
    
  // If capital is exhausted before age 95, display the message in bold red and centered
  if (statistics.isCapitalExhausted && statistics.exhaustionAge < 95) {
    pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(capitalInfo, pageWidth / 2, highlightsY, { align: 'center' });
  } else {
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(capitalInfo, 20, highlightsY, { maxWidth: pageWidth - 40 });
  }
};

/**
 * Add a capital chart from HTML canvas
 */
const addCapitalChart = async (
  pdf: JPDFWithAutoTable, 
  chartRef: React.RefObject<HTMLDivElement>,
  startY: number = 30,
  COLORS: typeof PDF_COLORS
): Promise<void> => {
  if (!chartRef.current) return;
  
  const pageWidth = pdf.internal.pageSize.width;
  
  // Add section title with more compact styling
  pdf.setFontSize(14); // Smaller font
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Capital Evolution Projection', pageWidth / 2, startY, { align: 'center' });
  
  try {
    // Capture the chart as canvas
    const canvas = await html2canvas(chartRef.current, {
      scale: 2, // Higher scale for better quality
      backgroundColor: '#FFFFFF'
    });
    
    // Get canvas data as an image
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit the page while maintaining aspect ratio
    const imgWidth = pageWidth - 30; // Leave margins
    const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 110); // Limit height and maintain aspect ratio
    
    // Add the image to the PDF
    pdf.addImage(
      imgData, 
      'PNG', 
      15, // X position
      startY + 8, // Y position with reduced spacing
      imgWidth, 
      imgHeight
    );
    
    // Add a caption with reduced spacing
    pdf.setFontSize(8); // Smaller font
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text(
      'This chart shows the projected evolution of your capital over time, including the impact of inflation.',
      pageWidth / 2, 
      startY + imgHeight + 10, // Reduced spacing
      { align: 'center', maxWidth: pageWidth - 40 }
    );
    
    // Set lastAutoTable.finalY to help next section positioning
    if (!pdf.lastAutoTable) {
      pdf.lastAutoTable = { finalY: 0 };
    }
    pdf.lastAutoTable.finalY = startY + imgHeight + 12;
    
  } catch (error) {
    console.error('Error capturing chart:', error);
    
    // Add error message if chart capture fails
    pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    pdf.setFontSize(10); // Smaller font
    pdf.text('Chart could not be generated. Please try again.', pageWidth / 2, startY + 20, { align: 'center' });
    
    // Set lastAutoTable.finalY for error case
    if (!pdf.lastAutoTable) {
      pdf.lastAutoTable = { finalY: 0 };
    }
    pdf.lastAutoTable.finalY = startY + 25;
  }
};

/**
 * Create a gauge to visualize retirement readiness
 */
const addRetirementReadinessGauge = (
  pdf: JPDFWithAutoTable,
  gaugeY: number,
  readinessScore: number,
  gaugeColor: number[],
  COLORS: typeof PDF_COLORS
): void => {
  const pageWidth = pdf.internal.pageSize.width;
  const gaugeWidth = 120;
  const gaugeHeight = 7;
  const gaugeX = (pageWidth - gaugeWidth) / 2;
  
  // Draw gauge background
  pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  pdf.roundedRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 3, 3, 'F');
  
  // Calculate gauge fill width
  const fillWidth = (readinessScore / 100) * gaugeWidth;
  
  // Use the provided gauge color (matched with risk assessment)
  // Draw gauge fill
  pdf.setFillColor(gaugeColor[0], gaugeColor[1], gaugeColor[2]);
  if (fillWidth > 0) {
    pdf.roundedRect(gaugeX, gaugeY, fillWidth, gaugeHeight, 3, 3, 'F');
  }
};

/**
 * Add key financial insights section
 */
const addKeyFinancialInsights = (
  pdf: JPDFWithAutoTable,
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear?: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: typeof PDF_COLORS
): void => {
  const pageWidth = pdf.internal.pageSize.width;
  
  // Improve spacing calculation to ensure adequate space after Executive Summary
  const startY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY - 10 : 120; // Using negative value to move up
  
  // Section header with compact styling
  pdf.setFontSize(16); // Slightly smaller header
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Financial Insights', pageWidth / 2, startY, { align: 'center' });
  
  // Helper function for formatting numbers
  const safeFormat = (value: any, suffix: string = ''): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') return formatAmount(value) + suffix;
    return String(value) + suffix;
  };
  
  // Create more compact metric grid with 2 rows of 4 metrics instead of 3 rows of 3
  const gridStartY = startY + 8; // Reduced space after header
  const boxWidth = 45; // Narrower boxes
  const boxHeight = 25; // Shorter boxes
  const horizontalGap = 5; // Less space between boxes horizontally
  const verticalGap = 8; // Less space between rows
  
  // Create a compact metric box
  const createMetricBox = (x: number, y: number, title: string, value: string, width: number, height: number) => {
    // Box background
    pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    pdf.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Title - smaller font
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.text(title, x + width/2, y + 6, { align: 'center' });
    
    // Value - more compact
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, x + width/2, y + 16, { align: 'center' });
  };
  
  // Calculate starting position to center the boxes
  const totalBoxWidth = (boxWidth * 4) + (horizontalGap * 3);
  const startX = (pageWidth - totalBoxWidth) / 2;
  
  // Row 1 - 4 metrics
  createMetricBox(
    startX, 
    gridStartY, 
    'Current Age', 
    `${params.currentAge} years`, 
    boxWidth, 
    boxHeight
  );
  
  createMetricBox(
    startX + boxWidth + horizontalGap, 
    gridStartY, 
    'Retirement Age', 
    `${statistics.retirementStartAge} years`, 
    boxWidth, 
    boxHeight
  );
  
  createMetricBox(
    startX + (boxWidth + horizontalGap) * 2, 
    gridStartY, 
    'Years Until Retirement', 
    `${statistics.calculatedRetirementStartYear - new Date().getFullYear()} years`, 
    boxWidth, 
    boxHeight
  );
  
  createMetricBox(
    startX + (boxWidth + horizontalGap) * 3, 
    gridStartY, 
    'Expected Return', 
    `${params.annualReturnRate}%`, 
    boxWidth, 
    boxHeight
  );
  
  // Row 2 - 4 metrics
  createMetricBox(
    startX, 
    gridStartY + boxHeight + verticalGap, 
    'Initial Investment', 
    safeFormat(params.initialCapital), 
    boxWidth, 
    boxHeight
  );
  
  createMetricBox(
    startX + boxWidth + horizontalGap, 
    gridStartY + boxHeight + verticalGap, 
    'Monthly Contribution', 
    safeFormat(params.monthlyInvestment), 
    boxWidth, 
    boxHeight
  );
  
  createMetricBox(
    startX + (boxWidth + horizontalGap) * 2, 
    gridStartY + boxHeight + verticalGap, 
    'Capital at Retirement', 
    safeFormat(statistics.capitalAtRetirement), 
    boxWidth, 
    boxHeight
  );
  
  let capitalStatusText = 'N/A';
  if (statistics.isCapitalExhausted) {
    capitalStatusText = `Depleted at ${statistics.exhaustionAge}`;
  } else {
    capitalStatusText = 'Sustainable';
  }
  
  createMetricBox(
    startX + (boxWidth + horizontalGap) * 3, 
    gridStartY + boxHeight + verticalGap, 
    'Capital Status', 
    capitalStatusText, 
    boxWidth, 
    boxHeight
  );
};

/**
 * Add risk assessment section
 */
const addRiskAssessment = (
  pdf: JPDFWithAutoTable,
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear?: (year: number) => number },
  formatAmount: (amount: number) => string,
  COLORS: typeof PDF_COLORS
): void => {
  const pageWidth = pdf.internal.pageSize.width;
  const startY = 25;
  
  // Section header
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Risk Assessment', pageWidth / 2, startY, { align: 'center' });
  
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setFontSize(10);
  pdf.text('Analysis of potential risks to your retirement plan', pageWidth / 2, startY + 7, { align: 'center' });
  
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
      riskDescription = `Your capital is projected to run out at age ${statistics.exhaustionAge}, which is ${shortfallYears} years before your expected age of ${expectedLifespan}. This presents a significant longevity risk to your retirement plan.\n\nThe early depletion of funds indicates that your withdrawal rate may be too high relative to your portfolio size, or your investment returns are not keeping pace with your expenses. Consider taking multiple actions to address this gap: increasing your current savings rate substantially, delaying retirement by several years, reducing your planned retirement expenses, exploring part-time work during early retirement years, or adjusting your investment allocation to potentially increase returns (though this would also increase market risk).\n\nWithout adjustments, you may need to rely heavily on other income sources like social security, pensions, or family support during your later years.`;
    } else {
      riskLevel = 'Moderate Risk';
      riskColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      riskDescription = `Your capital is projected to run out at age ${statistics.exhaustionAge}, which is ${shortfallYears} years before your expected age of ${expectedLifespan}. This represents a moderate gap in your financial plan that should be addressed.\n\nThis shortfall is manageable with thoughtful adjustments to your strategy. Consider increasing your savings rate by 10-15%, slightly delaying retirement, or planning for a modest reduction in retirement expenses. Other options include developing a "bucket strategy" that allocates different assets for different retirement phases, or implementing a dynamic withdrawal strategy that adjusts spending based on market performance.\n\nYou should also review your asset allocation to ensure it provides the right balance between growth and preservation needed for your time horizon. Building a stronger emergency fund can help avoid depleting investments during market downturns.`;
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
    
    if (safetyMargin >= 100) {
      riskLevel = 'Very Low Risk';
      riskColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green
      riskDescription = `Your retirement plan is very well-funded with a substantial safety margin. Your capital is projected to last throughout your expected lifetime with significant reserves remaining.\n\nThis strong position gives you exceptional flexibility. You could consider increasing your retirement lifestyle spending, gifting to family members, planning charitable contributions, or reallocating some assets to lower-risk investments to protect your accumulated wealth.\n\nWhile your position is excellent, it's still wise to maintain a diversified portfolio and have plans for healthcare costs, which can escalate unpredictably in later years. If leaving a legacy is important to you, this would be an excellent time to consult with an estate planning professional to optimize your strategy.\n\nYou might also consider whether you could retire earlier than planned or gradually transition to retirement through part-time work, if these options appeal to you.`;
    } else if (safetyMargin >= 75) {
      riskLevel = 'Low Risk';
      riskColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]]; // Green
      riskDescription = `Your retirement plan appears well-funded. Your capital is projected to last throughout your expected lifetime with a comfortable safety margin.\n\nThis position provides good protection against most retirement risks, including market downturns, higher-than-expected inflation, and longevity. Your plan shows resilience even under moderate stress scenarios.\n\nTo maintain this strong position, continue regular portfolio reviews and rebalancing. Consider developing a tax-efficient withdrawal strategy to maximize the longevity of your assets. It would also be prudent to review your insurance coverage, particularly for healthcare and long-term care, to protect against unexpected costs that could erode your capital.\n\nWith your solid foundation, you can focus on optimizing rather than remediation—fine-tuning your asset allocation, planning for legacy goals, and potentially enjoying some additional discretionary spending.`;
    } else if (safetyMargin >= 50) {
      riskLevel = 'Low-Moderate Risk';
      riskColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      riskDescription = `Your retirement plan should support your lifetime needs, but with a limited safety margin. Your projected capital appears sufficient but could be vulnerable to significant adverse events.\n\nThis position calls for vigilance and proactive management. Consider implementing a dynamic withdrawal strategy that adjusts spending based on portfolio performance—spending less in down years to preserve capital. Evaluate your asset allocation to ensure it provides sufficient growth potential while managing volatility appropriate for your risk tolerance.\n\nEnhancing your plan with a larger emergency fund (12-24 months of expenses) could help avoid liquidating investments during market downturns. Exploring ways to create guaranteed income streams through annuities or other vehicles might provide additional security for essential expenses.\n\nRegular stress testing of your retirement projections against scenarios like extended market downturns, higher inflation, or unexpected health costs would be valuable for ongoing adjustments to your strategy.`;
    } else if (safetyMargin >= 25) {
      riskLevel = 'Moderate Risk';
      riskColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange
      riskDescription = `Your retirement plan requires adjustments. Your projected capital is below your estimated needs, creating vulnerability to adverse scenarios like poor market returns, higher inflation, or increased longevity.\n\nTaking action now will significantly improve your outlook. Consider increasing your savings rate by at least 15-20% if possible. Review your current expenses to identify potential reductions that could boost savings. Evaluate whether delaying retirement by 2-3 years would meaningfully improve your position through additional contributions and delayed withdrawals.\n\nOn the investment front, assess whether your portfolio has appropriate growth potential for your needs without excessive risk. Developing supplementary income sources for retirement—such as part-time work, consulting, rental property, or monetizing hobbies—could reduce pressure on your portfolio.\n\nEstablishing a clear priority hierarchy for retirement expenses will help you develop contingency plans for reducing discretionary spending if needed while protecting essential needs.`;
    } else {
      riskLevel = 'High Risk';
      riskColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; // Red
      riskDescription = `Your retirement plan requires significant attention. Your projected capital falls well short of your estimated needs, creating substantial risk to your long-term financial security.\n\nThis situation calls for a comprehensive reassessment of your retirement strategy. Consider maximizing contributions to all available tax-advantaged accounts and substantially increasing your savings rate—potentially 25% or more of your income if feasible. Evaluate opportunities to increase your income through career advancement, additional work, or developing new skills.\n\nReassessing your retirement timeline is important; working 3-5 years longer than originally planned could dramatically improve your financial position. Simultaneously, conduct a thorough review of your expected retirement expenses, distinguishing between essential and discretionary spending, and identify areas for potential reduction.\n\nYour investment strategy should be carefully evaluated to ensure it provides sufficient growth potential while managing risk appropriately for your situation. Consider seeking professional financial planning assistance to develop a comprehensive strategy that addresses all aspects of your retirement plan.`;
    }
  }
  
  // Add risk level indicator with consistent styling
  addRiskIndicator(pdf, 20, riskY, riskLevel, riskColor, 60, COLORS);
  
  // Add risk description - improve alignment with the risk indicator
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  
  // Split the risk description into paragraphs for better formatting
  const paragraphs = riskDescription.split('\n\n');
  let currentY = riskY + 5; // Start text higher to better align with the risk indicator
  
  paragraphs.forEach((paragraph, index) => {
    pdf.text(paragraph, 90, currentY, { maxWidth: pageWidth - 100 });
    
    // Calculate height of this paragraph to determine position of next paragraph
    // Approximate height based on line count (crude estimate)
    const approxLineCount = Math.ceil(paragraph.length / 75); // Assuming ~75 chars per line
    currentY += approxLineCount * 5 + 5; // 5 points per line + 5 points paragraph spacing
  });
  
  // Adjust the Y position for the next section based on the text
  const sensitivityY = Math.max(currentY + 10, riskY + 40);
  
  // Sensitivity analysis section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sensitivity Analysis', pageWidth / 2, sensitivityY, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('How changes in key variables might affect your retirement plan:', 20, sensitivityY + 8);
  
  // Sensitivity table data
  const returnVariations = [-2, -1, 1, 2]; // Return rate variations in percentage points
  const inflationVariations = [0.5, 1, 1.5]; // Inflation variations in percentage points
  
  // Helper function to estimate impact on capital at retirement
  const estimateCapitalImpact = (returnDelta: number, years: number): number => {
    const annualReturn = 1 + (params.annualReturnRate + returnDelta) / 100;
    const originalAnnualReturn = 1 + params.annualReturnRate / 100;
    
    // Simplified calculation to estimate the impact
    // This just shows the percentage difference in final amount from compound interest
    return (Math.pow(annualReturn, years) / Math.pow(originalAnnualReturn, years) - 1) * 100;
  };
  
  // Create sensitivity analysis table
  const timeToRetirement = statistics.calculatedRetirementStartYear - new Date().getFullYear();
  
  pdf.autoTable({
    startY: sensitivityY + 15,
    head: [['Variable Change', 'Est. Impact on Capital', 'Recommendation']],
    body: [
      // Return rate variations
      ...returnVariations.map(delta => {
        const impact = estimateCapitalImpact(delta, timeToRetirement);
        const formattedImpact = impact >= 0 ? `+${impact.toFixed(1)}%` : `${impact.toFixed(1)}%`;
        const newRate = params.annualReturnRate + delta;
        
        let recommendation = '';
        if (delta < 0) {
          recommendation = `Review investment allocation if returns fall to ${newRate}%`;
        } else {
          recommendation = `Opportunity to increase growth or reduce risk if returns reach ${newRate}%`;
        }
        
        return [`Return rate: ${delta > 0 ? '+' : ''}${delta}%`, formattedImpact, recommendation];
      }),
      
      // Inflation variations
      ...inflationVariations.map(inflationDelta => {
        // Higher inflation reduces real returns
        const effectiveDelta = -inflationDelta;
        const impact = estimateCapitalImpact(effectiveDelta, timeToRetirement);
        const formattedImpact = impact >= 0 ? `+${impact.toFixed(1)}%` : `${impact.toFixed(1)}%`;
        const newInflation = params.inflation + inflationDelta;
        
        return [
          `Inflation: +${inflationDelta}%`, 
          formattedImpact, 
          `Adjust for higher living costs if inflation reaches ${newInflation}%`
        ];
      }),
      
      // Retirement age adjustment
      [`Retirement age: +2 years`, `+${(2 * 12 * params.monthlyInvestment / statistics.capitalAtRetirement * 100).toFixed(1)}%`, `Consider delaying retirement to improve financial security`],
      
      // Monthly investment adjustment
      [`Monthly investment: +20%`, `+${(20 * timeToRetirement / 100 * 100).toFixed(1)}%`, `Increase monthly savings to build a larger retirement fund`]
    ],
    headStyles: {
      fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 95 }
    },
    alternateRowStyles: {
      fillColor: [COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]]
    }
  });
  
  // Move to a new page for Risk Mitigation Strategies
  pdf.addPage();
  addPageHeader(pdf, COLORS);
  
  // Add Risk Mitigation Strategies section on the new page
  const mitigationStartY = 30;
  const pageHeight = pdf.internal.pageSize.height;
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.text('Risk Mitigation Strategies', pageWidth / 2, mitigationStartY, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Actionable strategies to improve your retirement plan security and outcomes:', 20, mitigationStartY + 10);
  
  // Calculate potential improvements based on the Analyses component logic
  const monthlyInvestmentIncrease = params.monthlyInvestment * (statistics.isCapitalExhausted ? 0.3 : 0.1);
  const yearsToRetirement = statistics.calculatedRetirementStartYear - new Date().getFullYear();
  const additionalCapital = monthlyInvestmentIncrease * 12 * yearsToRetirement;
  const estimatedAdditionalReturns = additionalCapital * (statistics.capitalAtRetirement / (params.initialCapital + params.monthlyInvestment * 12 * yearsToRetirement) - 1);
  const totalInvestmentBenefit = additionalCapital + estimatedAdditionalReturns;
  
  // Calculate impact of delaying retirement
  const yearDelayImpact = params.monthlyInvestment * 12 + (statistics.capitalAtRetirement * (params.annualReturnRate / 100));
  const retirementDelayYears = statistics.isCapitalExhausted ? 3 : 1;
  
  // Calculate withdrawal reduction impact
  const withdrawalReduction = params.monthlyRetirementWithdrawal * (statistics.isCapitalExhausted ? 0.15 : 0.1);
  const withdrawalYears = statistics.lifeExpectancy - statistics.retirementStartAge;
  const withdrawalSavings = withdrawalReduction * 12 * withdrawalYears;
  const additionalYears = Math.floor(withdrawalSavings / (params.monthlyRetirementWithdrawal * 12));
  
  // Calculate return improvement impact
  const returnImprovement = 0.5; // 0.5% improvement
  const improvedReturn = (params.initialCapital + params.monthlyInvestment * 12 * yearsToRetirement) * 
    (Math.pow(1 + (params.annualReturnRate + returnImprovement) / 100, yearsToRetirement) - 
     Math.pow(1 + params.annualReturnRate / 100, yearsToRetirement));
  
  // Define high-priority strategies
  const highPriorityStrategies = [];
  
  if (statistics.isCapitalExhausted) {
    highPriorityStrategies.push({
      title: 'Increase Monthly Investment',
      description: `Raising your monthly contribution by ${formatAmount(monthlyInvestmentIncrease)} could add approximately ${formatAmount(totalInvestmentBenefit)} to your retirement capital, significantly improving your security.`,
      impact: 'High Impact',
      isPriority: true
    });
    
    highPriorityStrategies.push({
      title: 'Delay Retirement',
      description: `Postponing retirement by ${retirementDelayYears} years could add approximately ${formatAmount(yearDelayImpact * retirementDelayYears)} to your capital and reduce the withdrawal period.`,
      impact: 'High Impact',
      isPriority: true
    });
    
    highPriorityStrategies.push({
      title: 'Reduce Retirement Withdrawals',
      description: `Lowering your planned monthly withdrawals by ${formatAmount(withdrawalReduction)} could extend your capital by approximately ${additionalYears} years.`,
      impact: 'Medium-High Impact',
      isPriority: true
    });
  }
  
  // Define medium-priority strategies
  const mediumPriorityStrategies = [
    {
      title: 'Optimize Investment Returns',
      description: `A ${returnImprovement.toFixed(1)}% improvement in returns through better asset allocation could add approximately ${formatAmount(improvedReturn)} to your retirement capital.`,
      impact: 'Medium Impact',
      isPriority: false
    },
    {
      title: 'Inflation Protection',
      description: `Your plan accounts for ${params.inflation.toFixed(1)}% inflation. Consider TIPS, I-bonds, real estate, and certain stock sectors to hedge against higher inflation.`,
      impact: 'Medium Impact',
      isPriority: false
    },
    {
      title: 'Dynamic Withdrawal Strategy',
      description: 'Adjust retirement withdrawals based on market performance. Reduce withdrawals during market downturns to preserve capital.',
      impact: 'Medium Impact',
      isPriority: false
    }
  ];
  
  // Add low-priority strategies
  const lowPriorityStrategies = [
    {
      title: 'Tax Optimization',
      description: 'Strategically use tax-advantaged accounts and maintain a balance between traditional and Roth accounts for tax diversification.',
      impact: 'Long-term Impact',
      isPriority: false
    },
    {
      title: 'Reduce Investment Fees',
      description: 'Seek lower-cost investment options. Even a 0.25% reduction in fees can significantly improve long-term results.',
      impact: 'Gradual Impact',
      isPriority: false
    },
    {
      title: 'Regular Rebalancing',
      description: 'Periodically adjust your portfolio to maintain target asset allocation and control risk.',
      impact: 'Risk Management',
      isPriority: false
    },
    {
      title: 'Emergency Fund',
      description: 'Maintain 3-12 months of expenses in liquid assets to avoid tapping retirement funds for unexpected costs.',
      impact: 'Risk Management',
      isPriority: false
    }
  ];
  
  // Combine all strategies based on priority
  const allStrategies = [
    ...highPriorityStrategies,
    ...mediumPriorityStrategies,
    ...lowPriorityStrategies
  ];
  
  // Create strategy sections with visual priority indicators
  let strategyY = mitigationStartY + 25;
  const startX = 20;
  const sectionWidth = pageWidth - 40;
  
  // Function to add a strategy section with appropriate styling
  const addStrategySection = (strategy: any, y: number): number => {
    // Enhanced strategy box styling with better priority visualization
    // Calculate background and border colors based on priority
    let bgColor, borderColor, borderWidth;
    
    if (strategy.isPriority) {
      // High priority - stronger red background with darker border
      bgColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2], 0.15]; // Slightly darker red for better visibility
      borderColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]];
      borderWidth = 0.5; // Thicker border for emphasis
    } else if (strategy.impact.includes('Medium')) {
      // Medium priority - light orange background
      bgColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2], 0.1];
      borderColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]];
      borderWidth = 0.3;
    } else {
      // Low priority - light gray
      bgColor = [COLORS.gray[0], COLORS.gray[1], COLORS.gray[2], 0.05];
      borderColor = [COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]];
      borderWidth = 0.2;
    }
    
    // Increase box height for better readability
    const boxHeight = 30;
    
    // Draw enhanced background with shadow effect
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(borderWidth);
    
    // Draw background rectangle with slightly rounded corners for modern look
    pdf.roundedRect(startX, y, sectionWidth, boxHeight, 3, 3, 'FD');
    
    // Add left accent bar for visual hierarchy (color-coded by priority)
    pdf.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.rect(startX, y, 4, boxHeight, 'F');
    
    // Add title with increased indent for better readability
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.setFontSize(12); // Slightly larger title
    pdf.setFont('helvetica', 'bold');
    pdf.text(strategy.title, startX + 12, y + 10);
    
    // Add visual priority indicator based on priority level
    let impactColor, impactBgColor;
    
    if (strategy.isPriority) {
      impactColor = [255, 255, 255]; // White text
      impactBgColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]]; // Red background
    } else if (strategy.impact.includes('Medium')) {
      impactColor = [255, 255, 255]; // White text
      impactBgColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]]; // Orange background
    } else {
      impactColor = [255, 255, 255]; // White text
      impactBgColor = [COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]]; // Gray background
    }
    
    // Draw impact label background (pill shape)
    const impactText = strategy.impact;
    const impactWidth = pdf.getStringUnitWidth(impactText) * 10 / pdf.internal.scaleFactor + 12; // Increased width multiplier from 8 to 10 and padding from 10 to 12
    const impactX = startX + sectionWidth - impactWidth - 8;
    
    pdf.setFillColor(impactBgColor[0], impactBgColor[1], impactBgColor[2]);
    pdf.roundedRect(impactX, y + 4, impactWidth, 12, 6, 6, 'F'); // Increased height from 10 to 12, radius from 5 to 6, and adjusted y position
    
    // Add impact indicator text
    pdf.setFontSize(10); // Increased from 8 to 10 for better visibility
    pdf.setTextColor(impactColor[0], impactColor[1], impactColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(impactText, impactX + impactWidth/2, y + 12, { align: 'center' }); // Adjusted y position from 11 to 12
    
    // Add description with better positioning and more space
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(strategy.description, startX + 12, y + 20, { maxWidth: sectionWidth - 20 });
    
    return y + boxHeight + 5; // Return next Y position with spacing (slightly more space)
  };
  
  // Improve section headings with visual emphasis
  // Add priority explanations with enhanced visual design
  if (highPriorityStrategies.length > 0) {
    // Add section heading with enhanced styling
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    pdf.text('Priority Recommendations', startX, strategyY);
    strategyY += 10; // More space after title
    
    // Add visual alert icon for priority section
    pdf.setDrawColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    pdf.setFillColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    
    highPriorityStrategies.forEach(strategy => {
      strategyY = addStrategySection(strategy, strategyY);
    });
    
    strategyY += 8; // Add extra spacing after priority section
  }
  
  // Add medium priority title with improved visual separation
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
  pdf.text('Additional Optimization Strategies', startX, strategyY);
  strategyY += 10; // More space after title
  
  // Add medium priority strategies
  mediumPriorityStrategies.forEach(strategy => {
    strategyY = addStrategySection(strategy, strategyY);
  });
  
  strategyY += 8; // More space between sections
  
  // Add low priority title if there's space
  if (strategyY < pageHeight - 80) {
    // Add section heading with enhanced styling
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text('Long-term Planning Strategies', startX, strategyY);
    strategyY += 10; // More space after title
    
    // Add as many low priority strategies as fit on the page
    for (let i = 0; i < lowPriorityStrategies.length && strategyY < pageHeight - 50; i++) {
      strategyY = addStrategySection(lowPriorityStrategies[i], strategyY);
    }
  }
  
  // Add concluding note with improved styling
  if (strategyY < pageHeight - 30) {
    // Add a subtle separator above the conclusion
    pdf.setDrawColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    pdf.setLineWidth(0.3);
    pdf.line(startX + 20, strategyY + 10, pageWidth - startX - 20, strategyY + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    pdf.text('Implementing a combination of these strategies will provide the most robust improvement to your retirement plan.', 
      pageWidth / 2, strategyY + 15, { align: 'center', maxWidth: pageWidth - 40 });
  }
};

/**
 * Creates a visual risk indicator
 */
const addRiskIndicator = (
  pdf: JPDFWithAutoTable, 
  x: number, 
  y: number, 
  riskLevel: string, 
  riskColor: number[], 
  width: number = 60,
  COLORS: typeof PDF_COLORS
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

/**
 * Add yearly breakdown of the retirement plan
 */
const addYearlyBreakdown = (
  pdf: JPDFWithAutoTable,
  params: SimulatorParams,
  statistics: Statistics & { ageAtYear?: (year: number) => number },
  formatAmount: (amount: number) => string,
  graphData: GraphDataPoint[],
  COLORS: typeof PDF_COLORS
): void => {
  const pageWidth = pdf.internal.pageSize.width;
  const startY = 25;
  
  // Section header
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Yearly Breakdown', pageWidth / 2, startY, { align: 'center' });
  
  // Introduction text
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Detailed yearly summary of investment phase and retirement phase.', 20, startY + 10);
  
  // Get key years for filtering
  const currentYear = new Date().getFullYear();
  const retirementYear = statistics.calculatedRetirementStartYear;
  const finalYear = retirementYear + (statistics.effectiveRetirementDuration || 30); // Fallback to 30 years if undefined
  
  // Filter data for significant years only to keep table manageable
  const filteredData = graphData.filter(point => {
    if (point.year === currentYear) return true; // Current year
    if (point.year === retirementYear) return true; // Retirement year
    if (point.year === retirementYear - 5 && retirementYear - currentYear > 10) return true; // 5 years before retirement (if applicable)
    if (point.year === retirementYear + 5) return true; // 5 years into retirement
    if (point.year === retirementYear + 10) return true; // 10 years into retirement
    if (point.year === retirementYear + 20) return true; // 20 years into retirement
    if (point.year === finalYear) return true; // Final year
    if (statistics.isCapitalExhausted && typeof statistics.exhaustionYear === 'number' && point.year === statistics.exhaustionYear) return true; // Capital exhaustion year
    if (point.year % 10 === 0) return true; // Every decade
    return false;
  });
  
  // Sort data by year
  filteredData.sort((a, b) => a.year - b.year);
  
  // Format data for the table
  const tableData = filteredData.map(point => {
    let status = point.retirement === "Yes" ? "Retirement" : "Investment";
    
    // Special case for capital exhaustion
    if (statistics.isCapitalExhausted && point.capital === 0 && point.retirement === "Yes") {
      status = "Funds Depleted";
    }
    
    return [
      point.year,
      point.age,
      status,
      formatAmount(point.capital),
      formatAmount(point.annualInvestment || 0),
      formatAmount(point.annualWithdrawal || 0),
      formatAmount(point.annualInterest || 0)
    ];
  });
  
  // Create table
  pdf.autoTable({
    startY: startY + 15,
    head: [['Year', 'Age', 'Status', 'Capital', 'Investment', 'Withdrawal', 'Interest']],
    body: tableData,
    headStyles: {
      fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' }
    },
    didParseCell: (data: any) => {
      // Highlight the retirement year
      if (data.row.index >= 0 && 
          data.column.index === 0 && 
          data.cell.raw === retirementYear) {
        data.cell.styles.fillColor = [COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
      
      // Highlight status cell for different phases
      if (data.row.index >= 0 && data.column.index === 2) {
        if (data.cell.raw === "Funds Depleted") {
          data.cell.styles.fillColor = [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (data.cell.raw === "Retirement") {
          data.cell.styles.fillColor = [COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]];
        } else {
          data.cell.styles.fillColor = [COLORS.success[0], COLORS.success[1], COLORS.success[2]];
        }
        data.cell.styles.fontStyle = 'bold';
      }
    },
    alternateRowStyles: {
      fillColor: [COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]]
    }
  });
  
  // Add notes about the table
  const notesY = pdf.lastAutoTable.finalY + 10;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  
  pdf.text('Notes:', 20, notesY);
  pdf.text('1. All values are in today\'s purchasing power, adjusted for inflation.', 20, notesY + 5);
  pdf.text('2. Investment represents annual contributions, and withdrawal represents annual retirement income.', 20, notesY + 10);
  pdf.text('3. This table shows key years only. See online calculator for full year-by-year breakdown.', 20, notesY + 15);
};

/**
 * Add page numbers to all pages
 */
const addPageNumbers = (pdf: JPDFWithAutoTable, COLORS: typeof PDF_COLORS): void => {
  // In jsPDF, the internal object contains the getNumberOfPages() method
  const pageCount = (pdf as any).internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }
}; 