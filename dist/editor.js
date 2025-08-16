import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
/**
 * Initialize the editor by wiring up DOM controls and returning an
 * {@link EditorHandle} that allows tests or callers to tear down the editor.
 */
export function initEditor() {
    const canvas = document.getElementById("canvas");
    const colorPicker = document.getElementById("colorPicker");
    const lineWidth = document.getElementById("lineWidth");
    const fillMode = document.getElementById("fillMode");
    const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
    // Default tool
    editor.setTool(new PencilTool());
    const shortcuts = new Shortcuts(editor);
    // Tool buttons
    const pencilBtn = document.getElementById("pencil");
    const eraserBtn = document.getElementById("eraser");
    const rectangleBtn = document.getElementById("rectangle");
    const lineBtn = document.getElementById("line");
    const circleBtn = document.getElementById("circle");
    const textBtn = document.getElementById("text");
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    const saveBtn = document.getElementById("save");
    const saveJpegBtn = document.getElementById("saveJpeg");
    const imageLoader = document.getElementById("imageLoader");
    const listeners = [];
    function addListener(el, type, handler) {
        if (!el)
            return;
        el.addEventListener(type, handler);
        listeners.push(() => el.removeEventListener(type, handler));
    }
    addListener(pencilBtn, "click", () => editor.setTool(new PencilTool()));
    addListener(eraserBtn, "click", () => editor.setTool(new EraserTool()));
    addListener(rectangleBtn, "click", () => editor.setTool(new RectangleTool()));
    addListener(lineBtn, "click", () => editor.setTool(new LineTool()));
    addListener(circleBtn, "click", () => editor.setTool(new CircleTool()));
    addListener(textBtn, "click", () => editor.setTool(new TextTool()));
    addListener(undoBtn, "click", () => editor.undo());
    addListener(redoBtn, "click", () => editor.redo());
    function saveAs(type, fileName) {
        const data = canvas.toDataURL(type);
        const a = document.createElement("a");
        a.href = data;
        a.download = fileName;
        a.click();
    }
    addListener(saveBtn, "click", () => saveAs("image/png", "canvas.png"));
    addListener(saveJpegBtn, "click", () => saveAs("image/jpeg", "canvas.jpg"));
    function loadImage(src) {
        const img = new Image();
        img.onload = () => {
            editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = src;
    }
    addListener(imageLoader, "change", (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            loadImage(result);
        };
        reader.readAsDataURL(file);
    });
    // Support drag & drop image loading
    addListener(canvas, "dragover", (e) => {
        e.preventDefault();
    });
    addListener(canvas, "drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            loadImage(reader.result);
        };
        reader.readAsDataURL(file);
    });
    return {
        editor,
        destroy: () => {
            listeners.forEach((fn) => fn());
            shortcuts.destroy();
            editor.destroy();
        },
    };
}
