import { listen, optionalElement, requireElement, type Cleanup } from "./domHelpers.js";

export interface ColorHistoryInput {
  cleanups: Cleanup[];
}

export interface ColorHistoryOutput {
  recordColor: (color: string) => void;
  destroy: Cleanup;
}

export function initColorHistory({ cleanups }: ColorHistoryInput): ColorHistoryOutput {
  const colorPicker = requireElement<HTMLInputElement>("colorPicker", "input");
  const colorHistory = optionalElement<HTMLDivElement>("colorHistory");
  const recentColors: string[] = [];

  const render = () => {
    if (!colorHistory) return;
    colorHistory.innerHTML = "";
    recentColors.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch";
      btn.style.backgroundColor = color;
      btn.setAttribute("aria-label", `Select ${color}`);
      btn.addEventListener("click", () => {
        colorPicker.value = color;
        colorPicker.dispatchEvent(new Event("input"));
      });
      colorHistory.appendChild(btn);
    });
  };

  const recordColor = (color: string) => {
    const i = recentColors.indexOf(color);
    if (i !== -1) recentColors.splice(i, 1);
    recentColors.unshift(color);
    if (recentColors.length > 10) recentColors.pop();
    render();
  };

  listen(colorPicker, "input", () => recordColor(colorPicker.value), cleanups);
  recordColor(colorPicker.value);

  return { recordColor, destroy: () => {} };
}
