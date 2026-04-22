import sharp from "sharp";
import * as path from "node:path";
import * as fs from "node:fs";

const OUTPUT_DIR = "data/images";
const WIDTH = 1200;
const HEIGHT = 675;

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export interface ImageOptions {
  title: string;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const chars = [...text];
  const lines: string[] = [];
  for (let i = 0; i < chars.length; i += maxCharsPerLine) {
    lines.push(chars.slice(i, i + maxCharsPerLine).join(""));
  }
  return lines;
}

function buildSvg(options: ImageOptions): string {
  const bg = options.bgColor ?? "#1a1a2e";
  const text = options.textColor ?? "#ffffff";
  const accent = options.accentColor ?? "#e94560";

  const titleLines = wrapText(options.title, 16);
  const titleY = options.subtitle
    ? 280 - (titleLines.length - 1) * 30
    : 340 - (titleLines.length - 1) * 30;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="600" y="${titleY + i * 70}" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="${text}">${escapeXml(line)}</text>`,
    )
    .join("\n");

  const subtitleSvg = options.subtitle
    ? `<text x="600" y="${titleY + titleLines.length * 70 + 20}" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${text}" opacity="0.8">${escapeXml(options.subtitle)}</text>`
    : "";

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${bg}"/>
  <rect x="0" y="0" width="${WIDTH}" height="8" fill="${accent}"/>
  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${accent}"/>
  ${titleSvg}
  ${subtitleSvg}
  <text x="600" y="${HEIGHT - 30}" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${text}" opacity="0.5">AI副業ラボ</text>
</svg>`;
}

export async function generateOgpImage(
  options: ImageOptions,
  filename?: string,
): Promise<string> {
  ensureOutputDir();

  const svg = buildSvg(options);
  const outputName = filename ?? `ogp_${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  await sharp(Buffer.from(svg)).png().toFile(outputPath);

  return outputPath;
}

export async function generateCarousel(
  slides: ImageOptions[],
  prefix?: string,
): Promise<string[]> {
  ensureOutputDir();

  const paths: string[] = [];
  const tag = prefix ?? `carousel_${Date.now()}`;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const svg = buildSvg({
      ...slide,
      subtitle: slide.subtitle ?? `${i + 1} / ${slides.length}`,
    });

    const outputPath = path.join(OUTPUT_DIR, `${tag}_${i + 1}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    paths.push(outputPath);
  }

  return paths;
}

export async function generateTipImage(title: string): Promise<string> {
  return generateOgpImage({
    title,
    subtitle: "💡 AI副業Tips",
    bgColor: "#0f3460",
    accentColor: "#e94560",
  });
}

export async function generateNewsImage(title: string): Promise<string> {
  return generateOgpImage({
    title,
    subtitle: "📰 AI最新ニュース",
    bgColor: "#1a1a2e",
    accentColor: "#00d2ff",
  });
}
