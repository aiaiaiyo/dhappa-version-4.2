import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyAccuracyReportData } from './monthlyAccuracyReportEngine';

export interface MonthlyPdfExportOptions {
  includeDailyAuditTable?: boolean;
  includeSelfLearningLedger?: boolean;
  authorTag?: string;
}

/**
 * Generates a publication-grade vector PDF report summarizing monthly prediction accuracy versus actual market draws
 */
export function generateMonthlyAccuracyPdfDocument(
  reportData: MonthlyAccuracyReportData,
  options: MonthlyPdfExportOptions = {}
): jsPDF {
  const {
    includeDailyAuditTable = true,
    includeSelfLearningLedger = true,
    authorTag = 'Pattern Engine Analytics Suite',
  } = options;

  // Initialize jsPDF in portrait A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins
  const contentWidth = pageWidth - margin * 2;

  // Color Palette Constants
  const colors = {
    primaryDark: [15, 23, 42], // Slate 900
    primaryIndigo: [79, 70, 229], // Indigo 600
    accentCyan: [6, 182, 212], // Cyan 500
    accentEmerald: [16, 185, 129], // Emerald 500
    accentAmber: [245, 158, 11], // Amber 500
    accentPurple: [168, 85, 247], // Purple 500
    lightBg: [248, 250, 252], // Slate 50
    cardBg: [241, 245, 249], // Slate 100
    borderSlate: [203, 213, 225], // Slate 300
    textDark: [30, 41, 59], // Slate 800
    textMuted: [100, 116, 139], // Slate 500
    white: [255, 255, 255],
  };

  let currentY = margin;

  // ==========================================
  // 1. HEADER BANNER
  // ==========================================
  // Draw primary dark header container
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.roundedRect(margin, currentY, contentWidth, 76, 6, 6, 'F');

  // Cyan accent line on left of header
  doc.setFillColor(colors.accentCyan[0], colors.accentCyan[1], colors.accentCyan[2]);
  doc.rect(margin, currentY, 6, 76, 'F');

  // Title text
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MONTHLY PREDICTION ACCURACY & AUDIT REPORT', margin + 18, currentY + 24);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`Evaluation Period: ${reportData.monthLabel} | Historical Horizon: ${reportData.historicalLookbackDays} Days`, margin + 18, currentY + 42);

  // Model Checkpoint & Timestamp badges
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(199, 210, 254);
  let formattedGenDate = '';
  try {
    const d = new Date(reportData.generationTimestamp);
    formattedGenDate = isNaN(d.getTime()) 
      ? reportData.generationTimestamp 
      : `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch (e) {
    formattedGenDate = reportData.generationTimestamp;
  }
  doc.text(`Model Version: ${reportData.modelVersion} | Generated: ${formattedGenDate}`, margin + 18, currentY + 60);

  currentY += 88;

  // ==========================================
  // 2. EXECUTIVE KPI CARDS (2x3 or 4x1 grid)
  // ==========================================
  const kpiCardWidth = (contentWidth - 18) / 4;
  const kpiCardHeight = 48;

  const kpis = [
    {
      label: 'TOP 36 HIT RATE',
      value: `${reportData.exactHitRateTop36Pct}%`,
      sub: `${reportData.totalExactHitsInTop36} of ${reportData.totalMarketDrawsAssessed} Draws`,
      color: colors.primaryIndigo,
    },
    {
      label: 'TOP 10 MOMENTUM',
      value: `${reportData.exactHitRateTop10Pct}%`,
      sub: `${reportData.totalExactHitsInTop10} Exact Hits`,
      color: colors.accentEmerald,
    },
    {
      label: 'TOP 5 PRIME CORE',
      value: `${reportData.exactHitRateTop5Pct}%`,
      sub: `${reportData.totalExactHitsInTop5} Exact Hits`,
      color: colors.accentAmber,
    },
    {
      label: 'CONVERGENCE SCORE',
      value: `${reportData.precisionConvergenceScore}%`,
      sub: `Loss Δ: ${reportData.lossDelta.toFixed(3)}`,
      color: colors.accentPurple,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (kpiCardWidth + 6);

    // Card background
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(cardX, currentY, kpiCardWidth, kpiCardHeight, 4, 4, 'F');

    // Colored left border
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(cardX, currentY, 3, kpiCardHeight, 'F');

    // KPI Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(kpi.label, cardX + 8, currentY + 12);

    // KPI Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(kpi.value, cardX + 8, currentY + 28);

    // KPI Sub
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(kpi.sub, cardX + 8, currentY + 40);
  });

  currentY += kpiCardHeight + 14;

  // ==========================================
  // 3. EXECUTIVE TAKEAWAYS & STRATEGIC HIGHLIGHTS
  // ==========================================
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, currentY, contentWidth, 54, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text('EXECUTIVE AUDIT SUMMARY', margin + 10, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);

  let takeawayY = currentY + 26;
  reportData.executiveSummaryTakeaways.slice(0, 3).forEach((takeaway) => {
    doc.text(`• ${takeaway}`, margin + 10, takeawayY);
    takeawayY += 10;
  });

  currentY += 66;

  // ==========================================
  // 4. MARKET-BY-MARKET ACCURACY PERFORMANCE TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text('1. Market-by-Market Prediction vs Actual Draws Breakdown', margin, currentY);
  currentY += 6;

  const marketTableBody = reportData.marketBreakdown.map((m) => [
    `${m.market} (${m.marketKey})`,
    m.drawsLogged.toString(),
    `${m.exactHitsTop36} (${m.accuracyRatePct}%)`,
    `${m.exactHitsTop10}`,
    `${m.exactHitsTop5}`,
    `${m.paltiHits}`,
    `${m.familyHits}`,
    m.performanceGrade,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Market', 'Draws', 'Top 36 Hits (Rate)', 'Top 10 Hits', 'Top 5 Hits', 'Palti Mirror', 'Family Echo', 'Grade']],
    body: marketTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      2: { fontStyle: 'bold', textColor: [16, 185, 129] },
      7: { fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 14;

  // ==========================================
  // 5. 4-TIER SEGREGATION PERFORMANCE TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text('2. 4-Tier Segregation Prediction Distribution & Hit Precision', margin, currentY);
  currentY += 6;

  const tierTableBody = reportData.tierPerformance.map((t) => [
    t.tierName,
    t.bracketLabel,
    `${t.candidateCount} Pairs`,
    `${t.totalHitsCaptured}`,
    `${t.hitSharePct}%`,
    `${t.strikePrecisionPct}%`,
    t.description,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Confidence Tier', 'Bracket Range', 'Count', 'Hits Captured', 'Hit Share %', 'Draw Strike %', 'Strategic Role']],
    body: tierTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      6: { halign: 'left' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 14;

  // ==========================================
  // 6. SELF-LEARNING PRECISION & ENGINE WEIGHTS TABLE
  // ==========================================
  if (includeSelfLearningLedger) {
    // Check if we need a new page
    if (currentY > pageHeight - 160) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.text('3. Self-Learning Precision Engine Multipliers & Efficacy Ledger', margin, currentY);
    currentY += 6;

    const engineTableBody = reportData.engineRankings.map((eng) => [
      eng.engineName,
      `${eng.learnedWeight.toFixed(2)}x`,
      `${eng.hitRatePct.toFixed(1)}%`,
      eng.grade,
      eng.learnedWeight >= 1.25 ? 'High Core Weight' : eng.learnedWeight >= 1.1 ? 'Active Momentum' : 'Balanced',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Engine Methodology', 'Learned Weight Multiplier', 'Hit Rate %', 'Efficacy Grade', 'Adaptive Role']],
      body: engineTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { fontStyle: 'bold', textColor: [79, 70, 229] },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 16;
  }

  // ==========================================
  // 7. DAILY ACCURACY AUDIT LOG (TABLE OF ALL DAYS)
  // ==========================================
  if (includeDailyAuditTable && reportData.dailyAuditRecords.length > 0) {
    // Always start daily audit table on a clean page for pristine readability
    doc.addPage();
    currentY = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.text(`4. Daily Accuracy Log: Actual Draws vs Multi-Engine Predictions (${reportData.monthLabel})`, margin, currentY);
    currentY += 8;

    const dailyRows = reportData.dailyAuditRecords.map((day) => {
      const actualDrawsStr = day.actualDraws
        .map((d) => {
          let badge = '';
          if (d.hitType === 'EXACT') badge = `✓${d.hitRankInTop36 ? `#${d.hitRankInTop36}` : ''}`;
          else if (d.hitType === 'PALTI') badge = '⟲';
          else if (d.hitType === 'FAMILY') badge = '👥';
          return `${d.marketKey}:${d.number}${badge ? ` [${badge}]` : ''}`;
        })
        .join(' | ');

      const topHitsCaptured = day.actualDraws
        .filter((d) => d.hitType === 'EXACT')
        .map((d) => `${d.number} (${d.marketKey} #${d.hitRankInTop36})`)
        .join(', ');

      const top5Str = day.top5Predictions.join(', ');

      return [
        `${day.formattedDate} (${day.dayOfWeek})`,
        actualDrawsStr || 'No Draws Logged',
        topHitsCaptured || 'Palti / Support Only',
        top5Str,
        `${day.exactHitsCount}/${day.totalMarketDrawsLogged}`,
        day.highestTierCaptured !== 'NONE' ? day.highestTierCaptured.replace('_', ' ') : 'N/A',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date (Day)', 'Actual Market Draws [Outcome]', 'Exact Hits in Top 36', 'Top 5 Prime Predictions', 'Capture', 'Top Tier']],
      body: dailyRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [30, 41, 59],
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'left', cellWidth: 160 },
        2: { halign: 'left', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 110 },
        3: { halign: 'left', cellWidth: 90 },
        4: { fontStyle: 'bold', cellWidth: 40 },
        5: { fontStyle: 'bold', cellWidth: 50 },
      },
      margin: { left: margin, right: margin },
    });
  }

  // ==========================================
  // 8. FOOTER & PAGE NUMBERING (ALL PAGES)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);

    // Footer divider line
    doc.setDrawColor(colors.borderSlate[0], colors.borderSlate[1], colors.borderSlate[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

    // Left: Author & System
    doc.text(`${authorTag} • Multi-Engine Self-Learning Model ${reportData.modelVersion}`, margin, pageHeight - 14);

    // Right: Page count
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 40, pageHeight - 14);
  }

  return doc;
}

/**
 * Convenience function to generate and download the PDF directly in browser
 */
export function downloadMonthlyAccuracyPdfReport(
  reportData: MonthlyAccuracyReportData,
  options: MonthlyPdfExportOptions = {}
): void {
  const doc = generateMonthlyAccuracyPdfDocument(reportData, options);
  const cleanMonthKey = reportData.monthKey.replace('-', '_');
  const filename = `Monthly_Prediction_Accuracy_Report_${cleanMonthKey}.pdf`;
  doc.save(filename);
}
