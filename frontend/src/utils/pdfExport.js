import { jsPDF } from "jspdf";

export function generatePDFReport(scanResult) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primary = scanResult.prediction || scanResult;
    const plantName = primary.plant || "Plant";
    const diseaseName = (primary.disease || "Condition").replace(/_/g, " ");
    const confidence = primary.confidence || 0;
    const severity = primary.severity || "Moderate";
    const info = scanResult.disease_info || scanResult.advisory || {};
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
    doc.text("LeafGuard AI — Plant Pathology Report", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text("AI-Powered Plant Leaf Disease Detection & Agronomic Health Insights", 14, 28);
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
    doc.text(`Host Crop: ${plantName} — ${diseaseName}`, 20, 70);

    doc.setFont("helvetica", "normal");
    doc.text(`Confidence Rating: ${confidence}%`, 20, 78);
    doc.text(`Severity Level: ${severity}`, 20, 86);
    doc.text(`Classification Model: EfficientNetB0 Neural Vision`, 110, 78);

    // Section 2: Description
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("2. Agronomic Pathogen Overview", 14, 107);

    const descText = info.description || "The neural network has processed the leaf symptoms and cross-referenced visual patterns.";
    const descLines = doc.splitTextToSize(descText, 182);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(descLines, 14, 114);

    // Section 3: Symptoms & Causes
    let currentY = 114 + (descLines.length * 5) + 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("3. Observed Symptoms & Factors", 14, currentY);

    currentY += 7;
    const symptoms = info.symptoms || ["Characteristic foliar discoloration and lesions."];
    symptoms.slice(0, 3).forEach((s) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${s}`, 18, currentY);
      currentY += 6;
    });

    // Section 4: Treatment Guidance
    currentY += 6;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("4. Recommended Agronomic Treatment", 14, currentY);

    currentY += 7;
    const treatments = info.treatment || [
      "Prune symptomatic lower foliage and dispose off-site.",
      "Apply protective copper or biological fungicide sprays.",
      "Ensure proper crop spacing for canopy airflow."
    ];

    treatments.slice(0, 4).forEach((t) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(`• ${t}`, 178);
      doc.text(lines, 18, currentY);
      currentY += (lines.length * 5) + 2;
    });

    // Footer Stamp & Disclaimer
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 275, 196, 275);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("LeafGuard AI Certificate • Disclaimer: Predictions should be verified by agricultural extension professionals.", 14, 282);

    doc.save(`LeafGuard_Diagnostic_Report_${Date.now().toString().slice(-6)}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    return false;
  }
}
