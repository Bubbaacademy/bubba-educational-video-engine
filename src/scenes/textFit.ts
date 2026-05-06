/**
 * Auto-shrink helpers so long text never escapes the canvas.
 *
 * `fitFont` linearly scales font size down once text exceeds `comfortableChars`,
 * with a hard floor at `minScale`. Use it for hero text (titles, headlines)
 * where wrapping looks bad.
 *
 * For body paragraphs prefer `safeMaxWidth` + CSS `overflowWrap` — multi-line
 * wrapping is fine.
 */

export interface FitFontOptions {
  comfortableChars?: number;
  minScale?: number;
}

export function fitFont(
  text: string | undefined,
  baseSize: number,
  opts: FitFontOptions = {},
): number {
  if (!text) return baseSize;
  const comfortableChars = opts.comfortableChars ?? 28;
  const minScale = opts.minScale ?? 0.55;
  if (text.length <= comfortableChars) return baseSize;
  const scale = Math.max(minScale, comfortableChars / text.length);
  return Math.round(baseSize * scale);
}

/** Width safe for content given canvas width and uniform horizontal padding. */
export function safeContentWidth(canvasWidth: number, paddingX: number): number {
  return Math.max(120, canvasWidth - paddingX * 2);
}

/** Style fragment — drop into any text container to enforce word wrapping. */
export const wrapStyle = {
  overflowWrap: "break-word" as const,
  wordBreak: "break-word" as const,
  hyphens: "auto" as const,
};
