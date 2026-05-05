import { Editor } from "./core/Editor.js";
import { Shortcuts } from "./core/Shortcuts.js";
import { PencilTool } from "./tools/PencilTool.js";
import { EraserTool } from "./tools/EraserTool.js";
import { RectangleTool } from "./tools/RectangleTool.js";
import { LineTool } from "./tools/LineTool.js";
import { CircleTool } from "./tools/CircleTool.js";
import { TextTool } from "./tools/TextTool.js";
import { BucketFillTool } from "./tools/BucketFillTool.js";
import { EyedropperTool } from "./tools/EyedropperTool.js";
import type { Tool } from "./tools/Tool.js";
import { requireElement, optionalElement, type Cleanup } from "./editor/domHelpers.js";
import { initColorHistory } from "./editor/colorHistory.js";
import { initHistoryControls } from "./editor/historyControls.js";
import { initToolControls } from "./editor/toolControls.js";
import { initLayerControls } from "./editor/layerControls.js";
import { initSaveExport } from "./editor/saveExport.js";
import { initImageImport } from "./editor/imageImport.js";

export interface EditorHandle {
  editor: Editor;
  editors: Editor[];
  activateLayer(index: number): void;
  destroy(): void;
}

export function initEditor(): EditorHandle {
  const cleanups: Cleanup[] = [];
  const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>("canvas"));
  const colorPicker = requireElement<HTMLInputElement>("colorPicker", "input");
  const lineWidth = requireElement<HTMLInputElement>("lineWidth", "input");
  const fillMode = requireElement<HTMLInputElement>("fillMode", "input");
  const fontFamily = optionalElement<HTMLSelectElement>("fontFamily") ?? undefined;
  const fontSize = optionalElement<HTMLInputElement>("fontSize") ?? undefined;
  const toolbar = document.getElementById("toolbar") || document.body;

  const toolConstructors: Record<string, new () => Tool> = {
    pencil: PencilTool, eraser: EraserTool, rectangle: RectangleTool, line: LineTool,
    circle: CircleTool, text: TextTool, bucket: BucketFillTool, eyedropper: EyedropperTool,
  };

  const editors: Editor[] = [];
  let editor: Editor;
  let activeLayerIndex = 0;
  let activeToolCtor: new () => Tool = PencilTool;
  const editorToolConstructors = new Map<Editor, new () => Tool>();

  canvases.forEach((c) => {
    try {
      editors.push(new Editor(c, colorPicker, lineWidth, fillMode, () => history.updateHistoryButtons(), fontFamily, fontSize));
    } catch {}
  });
  if (editors.length === 0) throw new Error("initEditor() requires at least one <canvas> element with a 2D context");
  editor = editors[0];

  const history = initHistoryControls({ getEditor: () => editor, cleanups });
  const tools = initToolControls({
    toolConstructors,
    editorToolConstructors,
    getEditor: () => editor,
    getActiveToolCtor: () => activeToolCtor,
    setActiveToolCtor: (ctor) => (activeToolCtor = ctor),
    cleanups,
  });
  const layers = initLayerControls({
    canvases, editors, toolbar, cleanups,
    getActiveLayerIndex: () => activeLayerIndex,
    setActiveLayerIndex: (index) => (activeLayerIndex = index),
    onLayerSelected: (index) => activateLayer(index),
  });
  initColorHistory({ cleanups });
  initSaveExport({ canvases, getEditor: () => editor, cleanups });
  initImageImport({ getEditor: () => editor, onImported: () => history.updateHistoryButtons(), cleanups });

  editors.forEach((e) => {
    const original = e.setTool.bind(e);
    e.setTool = (tool: Tool) => {
      original(tool);
      tools.syncActiveButtonFromTool(tool);
    };
  });

  const shortcuts = new Shortcuts(editor);
  function activateLayer(index: number) {
    if (index < 0 || index >= editors.length) return;
    activeLayerIndex = index;
    editor = editors[index];
    handle.editor = editor;
    shortcuts.switchEditor(editor);
    layers.updateLayerInteractivity();
    tools.applyCurrentToolToEditor(editor);
    history.updateHistoryButtons();
    layers.syncLayerSelect(index);
  }

  editor.setTool(new PencilTool());
  editorToolConstructors.set(editor, PencilTool);
  layers.updateLayerInteractivity();
  history.updateHistoryButtons();

  const handle: EditorHandle = {
    editor,
    editors,
    activateLayer,
    destroy() {
      cleanups.forEach((fn) => fn());
      shortcuts.destroy();
      editors.forEach((e) => e.destroy());
    },
  };
  return handle;
}
