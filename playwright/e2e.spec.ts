import { test, expect, Page } from "@playwright/test";

async function samplePixel(
  page: Page,
  selector: string,
  position: { x: number; y: number },
): Promise<number[]> {
  return page.evaluate(({ selector, x, y }) => {
    const canvas = document.querySelector(selector) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`Missing canvas ${selector}`);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Missing 2d context");
    const dpr = window.devicePixelRatio || 1;
    const data = ctx.getImageData(
      Math.max(0, Math.floor((x - rect.left) * dpr)),
      Math.max(0, Math.floor((y - rect.top) * dpr)),
      1,
      1,
    ).data;
    return Array.from(data);
  }, { selector, x: position.x, y: position.y });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("allows drawing with undo and redo", async ({ page }) => {
  const canvas = page.locator("#canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const start = { x: box.x + box.width / 2 - 50, y: box.y + box.height / 2 };
  const mid = { x: start.x + 50, y: start.y };
  const end = { x: start.x + 100, y: start.y };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(mid.x, mid.y);
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();

  await expect(page.locator("#undo")).toBeEnabled();
  await expect(page.locator("#redo")).toBeDisabled();

  const pixel = await samplePixel(page, "#canvas", mid);
  expect(pixel[3]).toBeGreaterThan(0);

  await page.click("#undo");
  await expect(page.locator("#redo")).toBeEnabled();
  const afterUndo = await samplePixel(page, "#canvas", mid);
  expect(afterUndo[3]).toBe(0);

  await page.click("#redo");
  const afterRedo = await samplePixel(page, "#canvas", mid);
  expect(afterRedo[3]).toBeGreaterThan(0);
});

test("exports the drawing and imports an image", async ({ page }) => {
  const canvas = page.locator("#canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const drawPoint = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await page.mouse.move(drawPoint.x - 20, drawPoint.y - 20);
  await page.mouse.down();
  await page.mouse.move(drawPoint.x + 20, drawPoint.y + 20);
  await page.mouse.up();

  await page.selectOption("#formatSelect", "jpeg");
  const downloadPromise = page.waitForEvent("download");
  await page.click("#save");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.jpg$/i);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  const dataUrl = await page.evaluate(() => {
    const cv = document.createElement("canvas");
    cv.width = 2;
    cv.height = 2;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("Missing context");
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, cv.width, cv.height);
    return cv.toDataURL("image/png");
  });
  const base64 = dataUrl.split(",")[1];
  const buffer = Buffer.from(base64, "base64");

  await page.setInputFiles("#imageLoader", {
    name: "import.png",
    mimeType: "image/png",
    buffer,
  });

  await page.waitForFunction(() => {
    const canvasEl = document.querySelector<HTMLCanvasElement>("#canvas");
    if (!canvasEl) return false;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return false;
    const dpr = window.devicePixelRatio || 1;
    const data = ctx.getImageData(0, 0, 1 * dpr, 1 * dpr).data;
    return data[0] === 255 && data[1] === 0 && data[2] === 0 && data[3] > 0;
  });

  const importedPixel = await samplePixel(page, "#canvas", { x: box.x + 1, y: box.y + 1 });
  expect(importedPixel[0]).toBe(255);
  expect(importedPixel[1]).toBe(0);
  expect(importedPixel[2]).toBe(0);
  expect(importedPixel[3]).toBeGreaterThan(0);
});

test("switching layers toggles interactivity and isolates drawings", async ({ page }) => {
  const baseCanvas = page.locator("#canvas");
  const box = await baseCanvas.boundingBox();
  if (!box) throw new Error("Canvas not found");

  const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const beforePixel = await samplePixel(page, "#canvas", target);
  expect(beforePixel[3]).toBe(0);

  await page.selectOption("#layerSelect", "1");
  const pointerStates = await page.evaluate(() => ({
    base: getComputedStyle(document.getElementById("canvas")!).pointerEvents,
    layer2: getComputedStyle(document.getElementById("layer2")!).pointerEvents,
  }));
  expect(pointerStates.base).toBe("none");
  expect(pointerStates.layer2).toBe("auto");

  await page.mouse.move(target.x - 30, target.y - 30);
  await page.mouse.down();
  await page.mouse.move(target.x + 30, target.y + 30);
  await page.mouse.up();

  const baseAfter = await samplePixel(page, "#canvas", target);
  expect(baseAfter[3]).toBe(0);
  const layerPixel = await samplePixel(page, "#layer2", target);
  expect(layerPixel[3]).toBeGreaterThan(0);

  await page.selectOption("#layerSelect", "0");
  const restoredPointerStates = await page.evaluate(() => ({
    base: getComputedStyle(document.getElementById("canvas")!).pointerEvents,
    layer2: getComputedStyle(document.getElementById("layer2")!).pointerEvents,
  }));
  expect(restoredPointerStates.base).toBe("auto");
  expect(restoredPointerStates.layer2).toBe("none");
});
