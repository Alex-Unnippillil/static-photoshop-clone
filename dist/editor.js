import { Editor } from "./core/Editor.js";
import { Shortcuts } from "./core/Shortcuts.js";
import { PencilTool } from "./tools/PencilTool.js";
import { EraserTool } from "./tools/EraserTool.js";
import { RectangleTool } from "./tools/RectangleTool.js";
import { LineTool } from "./tools/LineTool.js";
import { CircleTool } from "./tools/CircleTool.js";
import { TextTool } from "./tools/TextTool.js";
/** Utility to listen to events and auto-remove on destroy. */
function listen(el, type, handler, list) {
    if (!el)
        return;
    el.addEventListener(type, handler);
    list.push(() => el.removeEventListener(type, handler));
}
/**
 * Initialize the editor by wiring up DOM controls and returning an
 * {@link EditorHandle} that allows tests or callers to tear down the editor.
 */
export function initEditor() {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    const colorPicker = document.getElementById("colorPicker");
    const lineWidth = document.getElementById("lineWidth");
    const fillMode = document.getElementById("fillMode");
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    const listeners = [];
    // helper to update undo/redo button states for current editor
    let editor; // will be set after editors are created
    const updateHistoryButtons = () => {
        if (undoBtn)
            undoBtn.disabled = !editor?.canUndo;
        if (redoBtn)
            redoBtn.disabled = !editor?.canRedo;
    };
    const editors = [];
    canvases.forEach((c) => {
        try {
            editors.push(new Editor(c, colorPicker, lineWidth, fillMode, () => {
                updateHistoryButtons();
            }));
        }
        catch {
            /* skip canvases without 2D context */
        }
    });
    // active editor defaults to the first successfully created editor
    editor = editors[0];
    // default tool
    editor.setTool(new PencilTool());
    // keyboard shortcuts
    const shortcuts = new Shortcuts(editor);
    // map button id to tool constructor
    const toolButtons = {
        pencil: PencilTool,
        eraser: EraserTool,
        rectangle: RectangleTool,
        line: LineTool,
        circle: CircleTool,
        text: TextTool,
    };
    Object.entries(toolButtons).forEach(([id, ToolCtor]) => listen(document.getElementById(id), "click", () => editor.setTool(new ToolCtor()), listeners));
    listen(undoBtn, "click", () => {
        editor.undo();
        updateHistoryButtons();
    }, listeners);
    listen(redoBtn, "click", () => {
        editor.redo();
        updateHistoryButtons();
    }, listeners);
    // saving
    const saveBtn = document.getElementById("save");
    listen(saveBtn, "click", () => {
        const formatSelect = document.getElementById("formatSelect");
        const format = formatSelect?.value?.toLowerCase() === "jpeg" ? "jpeg" : "png";
        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        const quality = format === "jpeg" ? 0.9 : undefined;
        let exportCanvas;
        if (canvases.length > 1) {
            // composite all layers respecting their opacity
            exportCanvas = document.createElement("canvas");
            exportCanvas.width = canvases[0].width;
            exportCanvas.height = canvases[0].height;
            const tempCtx = exportCanvas.getContext("2d");
            canvases.forEach((cv) => {
                const opacity = parseFloat(cv.style.opacity) || 1;
                tempCtx.globalAlpha = opacity;
                tempCtx.drawImage(cv, 0, 0);
            });
            tempCtx.globalAlpha = 1;
        }
        else {
            exportCanvas = editor.canvas;
        }
        const data = exportCanvas.toDataURL(mime, quality);
        const a = document.createElement("a");
        a.href = data;
        a.download = `canvas.${format === "jpeg" ? "jpg" : "png"}`;
        a.click();
    }, listeners);
    // image loading
    const imageLoader = document.getElementById("imageLoader");
    listen(imageLoader, "change", (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                editor.ctx.drawImage(img, 0, 0, editor.canvas.width, editor.canvas.height);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }, listeners);
    // layer opacity sliders: inputs ending with "Opacity" adjust corresponding canvas
    document
        .querySelectorAll('input[id$="Opacity"]')
        .forEach((input) => {
        const targetId = input.id.replace(/Opacity$/, "");
        const layer = document.getElementById(targetId);
        if (!layer)
            return;
        listen(input, "input", () => {
            const value = parseFloat(input.value);
            layer.style.opacity = isNaN(value) ? "1" : String(value / 100);
        }, listeners);
    });
    // layer selection
    const layerSelect = document.getElementById("layerSelect");
    listen(layerSelect, "change", () => {
        const idx = parseInt(layerSelect.value, 10);
        activateLayer(idx);
    }, listeners);
    function activateLayer(index) {
        if (index < 0 || index >= editors.length)
            return;
        editor = editors[index];
        handle.editor = editor;
        shortcuts.switchEditor(editor);
        updateHistoryButtons();
    }
    const handle = {
        editor,
        editors,
        activateLayer,
        destroy() {
            listeners.forEach((fn) => fn());
            shortcuts.destroy();
            editors.forEach((e) => e.destroy());
        },
    };
    updateHistoryButtons();
    return handle;
}
