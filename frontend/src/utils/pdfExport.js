import { jsPDF } from "jspdf";

export function generatePDFReport(scanResult) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const diseaseName = (scanResult.disease || "Unknown Pathogen").replace(/_/g, " ");
    const confidence = scanResult.confidence || 0;
    const advisory = scanResult.advisory || {};
    const timestamp = new Date().toLocaleString();

    // Background header accent
    doc.setFillColor(15, 23, 42); // Dark obsidian
    doc.rect(0, 0, 210, 45, "F");

    doc.setFillColor(16, 185, 129); // Emerald strip
    doc.rect(0, 43, 210, 2, "F");

    // Title & Logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(52, 211, 153);
    doc.text("Plant AI — Pathomics Diagnostic Report", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text("Enterprise Neural Pathology Platform v5.2 | AI Pathology Platform", 14, 28);
    doc.text(`Report ID: SCAN-${Date.now().toString().slice(-8)} | Generated: ${timestamp}`, 14, 34);

    // Section 1: Summary Box
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("1. Diagnostic Summary", 14, 56);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 60, 182, 35, 3, 3, "FD");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Identified Health State: ${diseaseName}`, 20, 70);

    doc.setFont("helvetica", "normal");
    doc.text(`Confidence Rating: ${confidence}%`, 20, 78);
    doc.text(`Pathogen Type: ${advisory.disease_type || "Fungal Pathogen"}`, 20, 86);
    doc.text(`Threat Level: ${advisory.severity || "Medium"}`, 120, 78);

    // Section 2: 4-Grid Pathology Metrics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("2. Pathomics Parameters", 14, 107);

    const gridY = 112;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, gridY, 88, 24, 2, 2, "F");
    doc.roundedRect(108, gridY, 88, 24, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Contagion Vector:", 18, gridY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(advisory.spread_vector || "Airborne Spores", 18, gridY + 16);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Immediate Care:", 112, gridY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const prevText = (advisory.preventative_measures && advisory.preventative_measures[0]) || "Standard Crop Care";
    doc.text(doc.splitTextToSize(prevText, 80), 112, gridY + 16);

    // Section 3: Treatment Protocol
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("3. Agronomic Treatment Protocol", 14, 150);

    const treatments = advisory.treatment_protocol || [
      "Prune symptomatic lower leaves.",
      "Apply copper spray or recommended bio-fungicide.",
      "Maintain adequate plant spacing for foliage drying."
    ];

    let currentY = 158;
    treatments.forEach((t, i) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${t}`, 18, currentY);
      currentY += 8;
    });

    // Section 4: Chemical Controls
    currentY += 6;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("4. Chemical & Biological Controls", 14, currentY);

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const chemText = advisory.chemical_controls || "Copper Hydroxide 50% WP or Mancozeb 75% WP.";
    const chemLines = doc.splitTextToSize(chemText, 178);
    doc.text(chemLines, 18, currentY);

    // Footer Stamp
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 275, 196, 275);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Official Plant AI Agronomic Health Certificate • Designed for farmers, agronomists, and researchers.", 14, 282);

    doc.save(`PlantAI_Diagnostic_Report_${Date.now().toString().slice(-6)}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    return false;
  }
}
