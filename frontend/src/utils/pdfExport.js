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
    const cvAnalysis = scanResult.cv_analysis || {};
    const quality = cvAnalysis.image_quality || {};
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
    doc.text("AI-Powered Plant Leaf Disease Detection & Computer Vision Diagnostics", 14, 28);
    doc.text(`Report ID: SCAN-${Date.now().toString().slice(-8)} | Generated: ${timestamp}`, 14, 34);

    // Section 1: Summary Box & Grad-CAM Visualization
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("1. Diagnostic & Computer Vision Summary", 14, 53);

    const hasHeatmap = Boolean(cvAnalysis.gradcam_heatmap_url || cvAnalysis.segmented_overlay_url);
    const summaryBoxWidth = hasHeatmap ? 122 : 182;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 57, summaryBoxWidth, 48, 3, 3, "FD");

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Host Crop: ${plantName} — ${diseaseName}`, 18, 65);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Confidence Rating: ${confidence}%`, 18, 73);
    doc.text(`Severity Assessment: ${severity}`, 18, 80);
    doc.text(`Affected Surface Area: ${cvAnalysis.affected_area_percentage !== undefined ? cvAnalysis.affected_area_percentage + '%' : 'N/A'}`, 18, 87);
    doc.text(`Image Quality: ${quality.blur_label || 'Good'} (${quality.sharpness_score || 85} pts)`, 18, 94);

    const col2X = hasHeatmap ? 72 : 105;
    doc.text(`Model: EfficientNetB0 Neural Vision`, col2X, 73);
    doc.text(`Foliage Health Index: ${cvAnalysis.foliage_health_score !== undefined ? cvAnalysis.foliage_health_score + '/100' : 'N/A'}`, col2X, 80);
    doc.text(`Lesion Spot Count: ${cvAnalysis.lesion_count !== undefined ? cvAnalysis.lesion_count : '0'}`, col2X, 87);
    doc.text(`Exposure: ${quality.exposure_status || 'Optimal'}`, col2X, 94);

    // Grad-CAM Heatmap Image Embed
    if (hasHeatmap) {
      const imgData = cvAnalysis.gradcam_heatmap_url || cvAnalysis.segmented_overlay_url;
      doc.roundedRect(140, 57, 56, 48, 3, 3, "FD");
      try {
        doc.addImage(imgData, "PNG", 143, 60, 50, 38);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("Grad-CAM Attention Heatmap", 144, 102);
      } catch (imgErr) {
        console.warn("Could not embed Grad-CAM image in PDF:", imgErr);
      }
    }

    // Section 2: Pathogen Overview
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("2. Agronomic Pathogen Overview", 14, 114);

    const descText = info.description || "The neural network has processed the leaf symptoms and cross-referenced visual patterns.";
    const descLines = doc.splitTextToSize(descText, 182);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(descLines, 14, 120);

    // Section 3: Symptoms & Causes
    let currentY = 120 + (descLines.length * 4.5) + 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("3. Observed Symptoms & Agronomic Factors", 14, currentY);

    currentY += 6;
    const symptoms = info.symptoms || ["Characteristic foliar discoloration and lesions."];
    symptoms.slice(0, 3).forEach((s) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${s}`, 18, currentY);
      currentY += 5;
    });

    // Section 4: Treatment Guidance
    currentY += 4;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("4. Recommended Agronomic Treatment & Prevention", 14, currentY);

    currentY += 6;
    const treatments = info.treatment || [
      "Prune symptomatic lower foliage and dispose off-site.",
      "Apply protective copper or biological fungicide sprays.",
      "Ensure proper crop spacing for canopy airflow."
    ];

    treatments.slice(0, 4).forEach((t) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(`• ${t}`, 178);
      doc.text(lines, 18, currentY);
      currentY += (lines.length * 4.5) + 1.5;
    });

    // Footer Stamp & Disclaimer
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 275, 196, 275);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("LeafGuard AI Certificate • Disclaimer: Predictions are generated by AI and should be verified by agricultural extension professionals.", 14, 282);

    doc.save(`LeafGuard_Diagnostic_Report_${Date.now().toString().slice(-6)}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    return false;
  }
}
