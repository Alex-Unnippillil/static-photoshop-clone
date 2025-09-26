import fs from "fs";
import path from "path";
import { Editor } from "../src/core/Editor.js";
import { PencilTool } from "../src/tools/PencilTool.js";
import { LineTool } from "../src/tools/LineTool.js";
import { RectangleTool } from "../src/tools/RectangleTool.js";
import { CircleTool } from "../src/tools/CircleTool.js";
import {
  HeadlessCanvasRenderingContext2D,
  createHeadlessCanvas,
} from "./helpers/headlessCanvas.js";

const SNAPSHOT_PATH = path.join(__dirname, "__tool_snapshots__", "core-tools.json");

interface SnapshotRecord {
  [key: string]: string;
}

const snapshotData: SnapshotRecord = fs.existsSync(SNAPSHOT_PATH)
  ? JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf-8"))
  : {};

let snapshotUpdated = false;

function ensureSnapshotDir() {
  const dir = path.dirname(SNAPSHOT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

type EditorSetup = {
  editor: Editor;
  ctx: HeadlessCanvasRenderingContext2D;
};

function setupEditor(fill = false): EditorSetup {
  document.body.innerHTML = "";
  const { canvas, ctx } = createHeadlessCanvas(64, 64);
  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.value = "#ff0000";
  const lineWidth = document.createElement("input");
  lineWidth.type = "number";
  lineWidth.value = "2";
  const fillMode = document.createElement("input");
  fillMode.type = "checkbox";
  fillMode.checked = fill;

  const editor = new Editor(
    canvas,
    colorPicker,
    lineWidth,
    fillMode,
    undefined,
    null,
    null,
  );

  editor.setTool(new PencilTool());
  return { editor, ctx };
}

function pointerEvent(data: Partial<PointerEvent>): PointerEvent {
  return {
    pointerId: 1,
    buttons: 1,
    offsetX: 0,
    offsetY: 0,
    shiftKey: false,
    preventDefault: () => {},
    stopPropagation: () => {},
    ...data,
  } as unknown as PointerEvent;
}

function compareWithSnapshot(name: string, ctx: HeadlessCanvasRenderingContext2D) {
  ensureSnapshotDir();
  const actual = ctx.exportData();
  if (process.env.UPDATE_TOOL_SNAPSHOTS === "true") {
    snapshotData[name] = actual;
    snapshotUpdated = true;
    return;
  }
  const expected = snapshotData[name];
  if (!expected) {
    throw new Error(
      `Missing snapshot for ${name}. Run tests with UPDATE_TOOL_SNAPSHOTS=true to regenerate.`,
    );
  }
  const actualBuffer = Buffer.from(actual, "base64");
  const expectedBuffer = Buffer.from(expected, "base64");
  if (actualBuffer.length !== expectedBuffer.length) {
    throw new Error(`Snapshot size mismatch for ${name}`);
  }
  let diff = 0;
  for (let i = 0; i < actualBuffer.length; i++) {
    if (actualBuffer[i] !== expectedBuffer[i]) {
      diff++;
    }
  }
  const tolerance = 0.01; // Allow up to 1% pixel byte difference.
  const ratio = diff / actualBuffer.length;
  expect(ratio).toBeLessThanOrEqual(tolerance);
}

afterAll(() => {
  if (snapshotUpdated) {
    ensureSnapshotDir();
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshotData, null, 2) + "\n");
  }
});

describe("core tool canvas snapshots", () => {
  beforeAll(() => {
    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
    });
  });

  it("matches pencil stroke snapshot", () => {
    const { editor, ctx } = setupEditor(false);
    const tool = new PencilTool();
    editor.setTool(tool);
    tool.onPointerDown(pointerEvent({ offsetX: 10, offsetY: 10 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 20, offsetY: 15 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 30, offsetY: 25 }), editor);
    tool.onPointerUp(pointerEvent({ buttons: 0, offsetX: 30, offsetY: 25 }), editor);
    compareWithSnapshot("pencil", ctx);
    editor.destroy();
  });

  it("matches line stroke snapshot", () => {
    const { editor, ctx } = setupEditor(false);
    const tool = new LineTool();
    editor.setTool(tool);
    tool.onPointerDown(pointerEvent({ offsetX: 8, offsetY: 8 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 56, offsetY: 40 }), editor);
    tool.onPointerUp(pointerEvent({ buttons: 0, offsetX: 56, offsetY: 40 }), editor);
    compareWithSnapshot("line", ctx);
    editor.destroy();
  });

  it("matches stroked rectangle snapshot", () => {
    const { editor, ctx } = setupEditor(false);
    const tool = new RectangleTool();
    editor.setTool(tool);
    tool.onPointerDown(pointerEvent({ offsetX: 12, offsetY: 12 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 48, offsetY: 36 }), editor);
    tool.onPointerUp(pointerEvent({ buttons: 0, offsetX: 48, offsetY: 36 }), editor);
    compareWithSnapshot("rectangle-stroke", ctx);
    editor.destroy();
  });

  it("matches filled rectangle snapshot", () => {
    const { editor, ctx } = setupEditor(true);
    const tool = new RectangleTool();
    editor.setTool(tool);
    tool.onPointerDown(pointerEvent({ offsetX: 12, offsetY: 12 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 48, offsetY: 36 }), editor);
    tool.onPointerUp(pointerEvent({ buttons: 0, offsetX: 48, offsetY: 36 }), editor);
    compareWithSnapshot("rectangle-fill", ctx);
    editor.destroy();
  });

  it("matches stroked ellipse snapshot", () => {
    const { editor, ctx } = setupEditor(false);
    const tool = new CircleTool();
    editor.setTool(tool);
    tool.onPointerDown(pointerEvent({ offsetX: 32, offsetY: 20 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 50, offsetY: 40 }), editor);
    tool.onPointerUp(pointerEvent({ buttons: 0, offsetX: 50, offsetY: 40 }), editor);
    compareWithSnapshot("ellipse-stroke", ctx);
    editor.destroy();
  });

  it("matches filled ellipse snapshot", () => {
    const { editor, ctx } = setupEditor(true);
    const tool = new CircleTool();
    editor.setTool(tool);
    tool.onPointerDown(pointerEvent({ offsetX: 32, offsetY: 20 }), editor);
    tool.onPointerMove(pointerEvent({ offsetX: 50, offsetY: 40 }), editor);
    tool.onPointerUp(pointerEvent({ buttons: 0, offsetX: 50, offsetY: 40 }), editor);
    compareWithSnapshot("ellipse-fill", ctx);
    editor.destroy();
  });
});
