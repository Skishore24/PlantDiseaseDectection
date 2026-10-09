/**
 * camera.js — Computer Vision Canvas & Coordinate Scaling Utilities
 * Provides coordinate transformations, bounding box smoothing,
 * and high-tech HUD scanner graphics rendering for LiveLeafScanner.
 */

/**
 * Calculates rendered video viewport inside a container with `object-fit: cover`.
 * Returns { renderX, renderY, renderW, renderH, scaleX, scaleY }
 */
export function calculateVideoRenderBounds(videoEl, containerEl) {
  if (!videoEl || !containerEl) {
    return { renderX: 0, renderY: 0, renderW: 0, renderH: 0, scaleX: 1, scaleY: 1 };
  }

  const videoW = videoEl.videoWidth || 640;
  const videoH = videoEl.videoHeight || 480;
  const containerW = containerEl.clientWidth || videoW;
  const containerH = containerEl.clientHeight || videoH;

  const videoAspect = videoW / videoH;
  const containerAspect = containerW / containerH;

  let renderW, renderH, renderX, renderY;

  // object-fit: cover logic
  if (containerAspect > videoAspect) {
    // Container is wider than video aspect
    renderW = containerW;
    renderH = containerW / videoAspect;
    renderX = 0;
    renderY = (containerH - renderH) / 2;
  } else {
    // Container is taller than video aspect
    renderH = containerH;
    renderW = containerH * videoAspect;
    renderY = 0;
    renderX = (containerW - renderW) / 2;
  }

  return {
    renderX,
    renderY,
    renderW,
    renderH,
    videoW,
    videoH,
    containerW,
    containerH,
  };
}

/**
 * Scales bounding box from captured frame dimensions to container rendered canvas coordinates.
 */
export function scaleBoundingBox(box, frameWidth, frameHeight, renderBounds) {
  if (!box || !renderBounds) return null;

  const { renderX, renderY, renderW, renderH } = renderBounds;
  const fw = frameWidth || 640;
  const fh = frameHeight || 480;

  const normX = box.x / fw;
  const normY = box.y / fh;
  const normW = box.width / fw;
  const normH = box.height / fh;

  return {
    x: renderX + normX * renderW,
    y: renderY + normY * renderH,
    width: normW * renderW,
    height: normH * renderH,
  };
}

/**
 * Linear interpolation / Exponential moving average for smooth bounding box transitions.
 */
export function smoothBoundingBox(prevBox, targetBox, factor = 0.35) {
  if (!prevBox) return targetBox ? { ...targetBox } : null;
  if (!targetBox) return null;

  return {
    x: prevBox.x + (targetBox.x - prevBox.x) * factor,
    y: prevBox.y + (targetBox.y - prevBox.y) * factor,
    width: prevBox.width + (targetBox.width - prevBox.width) * factor,
    height: prevBox.height + (targetBox.height - prevBox.height) * factor,
  };
}

/**
 * Draws HUD Scanner Overlay on HTML5 Canvas:
 * - Corner tech brackets
 * - Smooth bounding box border with subtle glow
 * - Dynamic color based on status (Healthy = emerald, Diseased = amber/rose, Searching = cyan/blue)
 * - Scanning laser sweep animation
 */
export function drawScannerHUD(ctx, box, options = {}) {
  const {
    status = "searching", // "healthy" | "diseased" | "low_confidence" | "searching"
    confidence = 0,
    plant = "",
    disease = "",
    scanLineProgress = 0,
    width = 640,
    height = 480,
  } = options;

  ctx.clearRect(0, 0, width, height);

  // If no box is detected, draw central alignment frame with subtle scanline
  if (!box) {
    const frameW = Math.min(width * 0.75, 340);
    const frameH = Math.min(height * 0.65, 360);
    const frameX = (width - frameW) / 2;
    const frameY = (height - frameH) / 2;

    // Draw alignment brackets
    drawCornerBrackets(ctx, frameX, frameY, frameW, frameH, "#10b981", 20, 2, 0.4);

    // Draw animated center scan line
    const scanY = frameY + frameH * (scanLineProgress % 1.0);
    const grad = ctx.createLinearGradient(frameX, scanY, frameX + frameW, scanY);
    grad.addColorStop(0, "rgba(16, 185, 129, 0)");
    grad.addColorStop(0.5, "rgba(16, 185, 129, 0.6)");
    grad.addColorStop(1, "rgba(16, 185, 129, 0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frameX, scanY);
    ctx.lineTo(frameX + frameW, scanY);
    ctx.stroke();

    return;
  }

  // Determine HUD color scheme
  let primaryColor = "#10b981"; // Emerald for healthy
  let glowColor = "rgba(16, 185, 129, 0.35)";

  if (status === "diseased") {
    primaryColor = "#f59e0b"; // Vibrant Amber
    glowColor = "rgba(245, 158, 11, 0.4)";
  } else if (status === "low_confidence") {
    primaryColor = "#38bdf8"; // Sky Blue
    glowColor = "rgba(56, 189, 248, 0.35)";
  }

  const { x, y, width: bw, height: bh } = box;

  // 1. Draw glowing subtle bounding box outline
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;
  ctx.strokeRect(x, y, bw, bh);
  ctx.restore();

  // 2. Draw sharp corner brackets (HUD tech effect)
  const cornerLength = Math.min(28, bw * 0.22, bh * 0.22);
  drawCornerBrackets(ctx, x, y, bw, bh, primaryColor, cornerLength, 3.5, 0.95);

  // 3. Draw animated horizontal scanning beam inside the box
  const beamY = y + bh * (scanLineProgress % 1.0);
  const beamGrad = ctx.createLinearGradient(x, beamY, x + bw, beamY);
  beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  beamGrad.addColorStop(0.5, primaryColor);
  beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.save();
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = 2;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x, beamY);
  ctx.lineTo(x + bw, beamY);
  ctx.stroke();
  ctx.restore();

  // 4. Draw Floating Reticle Pill Badge above box
  if (plant || disease) {
    const label = `${plant ? plant + " • " : ""}${disease || "Leaf Detected"}`;
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    const textWidth = ctx.measureText(label).width;
    const badgeW = textWidth + 24;
    const badgeH = 22;
    const badgeX = Math.max(8, Math.min(x, width - badgeW - 8));
    const badgeY = Math.max(8, y - badgeH - 6);

    // Pill background
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    // Text label
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, badgeX + 12, badgeY + 15);
  }
}

/**
 * Draws 4 tech corner brackets around a rectangular bounding box.
 */
function drawCornerBrackets(ctx, x, y, w, h, color, len, thickness = 3, alpha = 0.9) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.globalAlpha = alpha;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();

  ctx.restore();
}
