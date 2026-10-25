/**
 * SmartCart AI — Real-Time Webcam Obstruction Detector
 * Lightweight, high-performance browser-side frame analysis.
 * Detects sustained darkness, hand covering lens, uniform blur, and physical obstructions.
 */

export interface FrameAnalysisResult {
  isObstructed: boolean;
  meanLuminance: number;
  variance: number;
  edgeScore: number;
  obstructionReason: 'darkness' | 'covered' | 'blur' | 'none';
}

/**
 * Analyzes a downscaled video frame from HTMLVideoElement.
 * Uses a tiny 64x48 sampling canvas for sub-millisecond execution.
 */
export function analyzeVideoFrameForObstruction(
  video: HTMLVideoElement,
  sampleCanvas?: HTMLCanvasElement
): FrameAnalysisResult {
  const defaultResult: FrameAnalysisResult = {
    isObstructed: false,
    meanLuminance: 128,
    variance: 50,
    edgeScore: 30,
    obstructionReason: 'none',
  };

  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return defaultResult;
  }

  const canvas = sampleCanvas || document.createElement('canvas');
  const sampleW = 64;
  const sampleH = 48;
  canvas.width = sampleW;
  canvas.height = sampleH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return defaultResult;

  try {
    ctx.drawImage(video, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;
    const totalPixels = sampleW * sampleH;

    let sumLuma = 0;
    const lumaArray = new Float32Array(totalPixels);

    // 1. Calculate luminance per pixel: Rec. 601 (Y = 0.299R + 0.587G + 0.114B)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      lumaArray[p] = y;
      sumLuma += y;
    }

    const meanLuma = sumLuma / totalPixels;

    // 2. Calculate standard deviation (variance across the scene)
    let sumSqDiff = 0;
    for (let p = 0; p < totalPixels; p++) {
      const diff = lumaArray[p] - meanLuma;
      sumSqDiff += diff * diff;
    }
    const stdDev = Math.sqrt(sumSqDiff / totalPixels);

    // 3. Calculate spatial edge/gradient score (Laplacian high-frequency detail)
    let edgeSum = 0;
    let edgeCount = 0;
    for (let y = 1; y < sampleH - 1; y += 2) {
      for (let x = 1; x < sampleW - 1; x += 2) {
        const idx = y * sampleW + x;
        const center = lumaArray[idx];
        const right = lumaArray[idx + 1];
        const bottom = lumaArray[idx + sampleW];
        const dx = Math.abs(right - center);
        const dy = Math.abs(bottom - center);
        edgeSum += dx + dy;
        edgeCount++;
      }
    }
    const edgeScore = edgeCount > 0 ? edgeSum / edgeCount : 0;

    // 4. Decision Rule Engine for Obstruction:
    // Case A: Near-total darkness (hand covering lens, tape, or physical block)
    if (meanLuma < 24.0) {
      return {
        isObstructed: true,
        meanLuminance: Math.round(meanLuma),
        variance: Math.round(stdDev),
        edgeScore: Math.round(edgeScore),
        obstructionReason: 'darkness',
      };
    }

    // Case B: Very dark with minimal variance (closely covered in dim lighting)
    if (meanLuma < 36.0 && stdDev < 14.0) {
      return {
        isObstructed: true,
        meanLuminance: Math.round(meanLuma),
        variance: Math.round(stdDev),
        edgeScore: Math.round(edgeScore),
        obstructionReason: 'darkness',
      };
    }

    // Case C: Hand / Solid Object pressed against lens in well-lit room
    // Hand skin or solid object covering lens produces a uniform diffuse blur with near zero edge contrast
    if (stdDev < 12.0 && edgeScore < 8.0) {
      return {
        isObstructed: true,
        meanLuminance: Math.round(meanLuma),
        variance: Math.round(stdDev),
        edgeScore: Math.round(edgeScore),
        obstructionReason: 'covered',
      };
    }

    // Case D: Extreme blur / zero texture (diffuse coverage)
    if (edgeScore < 5.0 && stdDev < 16.0) {
      return {
        isObstructed: true,
        meanLuminance: Math.round(meanLuma),
        variance: Math.round(stdDev),
        edgeScore: Math.round(edgeScore),
        obstructionReason: 'blur',
      };
    }

    // Normal unobscured scene
    return {
      isObstructed: false,
      meanLuminance: Math.round(meanLuma),
      variance: Math.round(stdDev),
      edgeScore: Math.round(edgeScore),
      obstructionReason: 'none',
    };
  } catch (err) {
    console.warn('[ObstructionDetector] Frame analysis error:', err);
    return defaultResult;
  }
}
