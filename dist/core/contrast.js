const HEX_REGEX = /^#?(?<hex>[0-9a-f]{3}|[0-9a-f]{6})$/i;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function normalizeHex(input) {
    const match = input.match(HEX_REGEX);
    if (!match?.groups) {
        throw new Error(`Invalid hex color: ${input}`);
    }
    let { hex } = match.groups;
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((ch) => ch + ch)
            .join("");
    }
    return `#${hex.toLowerCase()}`;
}
function hexToRgb(hex) {
    const normalized = normalizeHex(hex).slice(1);
    const value = parseInt(normalized, 16);
    return {
        r: (value >> 16) & 0xff,
        g: (value >> 8) & 0xff,
        b: value & 0xff,
    };
}
function rgbToHex({ r, g, b }) {
    const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function srgbChannelToLinear(channel) {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function relativeLuminanceFromRgb({ r, g, b }) {
    const [rl, gl, bl] = [r, g, b].map(srgbChannelToLinear);
    // WCAG formula
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}
export function relativeLuminance(color) {
    return relativeLuminanceFromRgb(hexToRgb(color));
}
export function contrastRatio(colorA, colorB) {
    const luminances = [relativeLuminance(colorA), relativeLuminance(colorB)].sort((a, b) => b - a);
    const [lighter, darker] = luminances;
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100; // keep two decimal precision
}
function mixColors(color, target, amount) {
    const base = hexToRgb(color);
    const goal = hexToRgb(target);
    const mix = (from, to) => from + (to - from) * amount;
    return rgbToHex({
        r: mix(base.r, goal.r),
        g: mix(base.g, goal.g),
        b: mix(base.b, goal.b),
    });
}
export function suggestContrastColor(foreground, background, threshold = 4.5) {
    const normalizedForeground = normalizeHex(foreground);
    const normalizedBackground = normalizeHex(background);
    const currentRatio = contrastRatio(normalizedForeground, normalizedBackground);
    if (currentRatio >= threshold) {
        return null;
    }
    const foregroundLum = relativeLuminance(normalizedForeground);
    const backgroundLum = relativeLuminance(normalizedBackground);
    const targetColor = backgroundLum > foregroundLum ? "#000000" : "#ffffff";
    let lower = 0;
    let upper = 1;
    let bestColor = normalizedForeground;
    let bestRatio = currentRatio;
    for (let i = 0; i < 24; i += 1) {
        const mid = (lower + upper) / 2;
        const candidate = mixColors(normalizedForeground, targetColor, mid);
        const ratio = contrastRatio(candidate, normalizedBackground);
        if (ratio >= threshold) {
            bestColor = candidate;
            bestRatio = ratio;
            upper = mid;
        }
        else {
            lower = mid;
        }
    }
    if (bestRatio < currentRatio) {
        return null;
    }
    return { color: bestColor, ratio: Math.max(bestRatio, currentRatio) };
}
