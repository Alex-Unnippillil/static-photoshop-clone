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
/** Utility to listen to events and auto-remove on destroy. */
function listen(el, type, handler, list) {
    if (!el)
        return;
    const wrapped = handler;
    el.addEventListener(type, wrapped);
    list.push(() => el.removeEventListener(type, wrapped));
}
/**
 * Initialize the editor by wiring up DOM controls and returning an
 * {@link EditorHandle} that allows tests or callers to tear down the editor.
 */
export function initEditor() {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    const layerEntries = canvases.map((canvas, index) => ({
        canvas,
        name: canvas.id || `Layer ${index + 1}`,
    }));
    const createElement = (tagName) => {
        const element = document.createElement(tagName);
        if (element instanceof HTMLElement) {
            return element;
        }
        const namespace = document.body?.namespaceURI ??
            document.documentElement?.namespaceURI ??
            "http://www.w3.org/1999/xhtml";
        return document.createElementNS(namespace, tagName);
    };
    const toolConstructors = {
        pencil: PencilTool,
        eraser: EraserTool,
        rectangle: RectangleTool,
        line: LineTool,
        circle: CircleTool,
        text: TextTool,
        bucket: BucketFillTool,
        eyedropper: EyedropperTool,
    };
    const toolButtons = {};
    const constructorToId = new Map();
    const editorToolConstructors = new Map();
    let activeToolCtor = PencilTool;
    let activeLayerIndex = 0;
    const listeners = [];
    Object.entries(toolConstructors).forEach(([id, Ctor]) => {
        const btn = document.getElementById(id);
        if (!btn) {
            throw new Error(`Missing #${id} button`);
        }
        toolButtons[id] = btn;
        constructorToId.set(Ctor, id);
    });
    let activeButton = null;
    const setActiveButton = (btn) => {
        if (activeButton)
            activeButton.classList.remove("active");
        if (btn)
            btn.classList.add("active");
        activeButton = btn;
    };
    const buttonForTool = (tool) => {
        for (const [id, ToolCtor] of Object.entries(toolConstructors)) {
            if (tool instanceof ToolCtor) {
                return toolButtons[id];
            }
        }
        return null;
    };
    const updateLayerInteractivity = () => {
        layerEntries.forEach((entry, index) => {
            entry.canvas.style.pointerEvents =
                index === activeLayerIndex ? "auto" : "none";
            entry.canvas.style.zIndex = String(index);
        });
    };
    const colorPicker = document.getElementById("colorPicker");
    const lineWidth = document.getElementById("lineWidth");
    const fillMode = document.getElementById("fillMode");
    const fontFamily = document.getElementById("fontFamily");
    const fontSize = document.getElementById("fontSize");
    const layerSelect = document.getElementById("layerSelect");
    const toolbar = document.getElementById("toolbar") || document.body;
    const saveBtn = document.getElementById("save");
    const formatSelect = document.getElementById("formatSelect");
    const colorHistory = document.getElementById("colorHistory");
    if (!colorPicker) {
        throw new Error("Missing #colorPicker input");
    }
    if (!lineWidth) {
        throw new Error("Missing #lineWidth input");
    }
    if (!fillMode) {
        throw new Error("Missing #fillMode input");
    }
    if (!saveBtn) {
        throw new Error("Missing #save button");
    }
    if (!formatSelect) {
        throw new Error("Missing #formatSelect select");
    }
    let layerPanel = document.getElementById("layerPanel");
    if (!layerPanel) {
        layerPanel = createElement("div");
        layerPanel.id = "layerPanel";
        layerPanel.className = "layer-panel";
        toolbar.appendChild(layerPanel);
    }
    let layerPanelLabel = layerPanel.querySelector(".layer-panel-label");
    if (!layerPanelLabel) {
        layerPanelLabel = createElement("p");
        layerPanelLabel.className = "layer-panel-label";
        layerPanelLabel.textContent = "Layers";
        layerPanel.appendChild(layerPanelLabel);
    }
    let layerListElement = layerPanel.querySelector("ul.layer-list");
    if (!layerListElement) {
        layerListElement = createElement("ul");
        layerListElement.className = "layer-list";
        layerPanel.appendChild(layerListElement);
    }
    const layerList = layerListElement;
    const layerListListeners = [];
    const clearLayerListListeners = () => {
        while (layerListListeners.length) {
            const remove = layerListListeners.pop();
            remove?.();
        }
    };
    const addLayerListListener = (element, type, handler) => {
        const wrapped = handler;
        element.addEventListener(type, wrapped);
        const remove = () => element.removeEventListener(type, wrapped);
        layerListListeners.push(remove);
        listeners.push(remove);
    };
    let draggedLayerIndex = null;
    if (layerSelect) {
        layerSelect.innerHTML = "";
    }
    layerEntries.forEach((entry, i) => {
        const canvas = entry.canvas;
        const canvasId = canvas.id || `layer${i + 1}`;
        if (!document.getElementById(`${canvasId}Opacity`) && i > 0) {
            const group = document.createElement("div");
            group.className = "group";
            const label = document.createElement("label");
            label.htmlFor = `${canvasId}Opacity`;
            label.textContent = `${entry.name} Opacity`;
            const input = document.createElement("input");
            input.id = `${canvasId}Opacity`;
            input.type = "number";
            input.min = "0";
            input.max = "100";
            input.value = "100";
            group.appendChild(label);
            group.appendChild(input);
            toolbar.appendChild(group);
        }
    });
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    const recentColors = [];
    const maxRecentColors = 10;
    const renderColorHistory = () => {
        if (!colorHistory)
            return;
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
    const recordColor = (color) => {
        const existing = recentColors.indexOf(color);
        if (existing !== -1)
            recentColors.splice(existing, 1);
        recentColors.unshift(color);
        if (recentColors.length > maxRecentColors)
            recentColors.pop();
        renderColorHistory();
    };
    listen(colorPicker, "input", () => {
        recordColor(colorPicker.value);
    }, listeners);
    let editor; // set after editors created
    const updateHistoryButtons = () => {
        if (undoBtn)
            undoBtn.disabled = !editor?.canUndo;
        if (redoBtn)
            redoBtn.disabled = !editor?.canRedo;
    };
    const editors = [];
    function renderLayerSelect() {
        if (!layerSelect)
            return;
        const previousSelection = layerSelect.value;
        layerSelect.innerHTML = "";
        layerEntries.forEach((entry, index) => {
            const opt = createElement("option");
            opt.value = String(index);
            opt.textContent = entry.name;
            layerSelect.appendChild(opt);
        });
        const hasLayers = layerEntries.length > 0;
        const desiredIndex = hasLayers
            ? Math.min(Math.max(activeLayerIndex, 0), layerEntries.length - 1)
            : -1;
        if (desiredIndex >= 0) {
            layerSelect.value = String(desiredIndex);
        }
        else if (previousSelection) {
            layerSelect.value = previousSelection;
        }
    }
    function syncCanvasOrder() {
        const parents = new Map();
        layerEntries.forEach((entry) => {
            const parent = entry.canvas.parentElement;
            if (!parent)
                return;
            const group = parents.get(parent);
            if (group) {
                group.push(entry.canvas);
            }
            else {
                parents.set(parent, [entry.canvas]);
            }
        });
        parents.forEach((group, parent) => {
            const onlyCanvas = Array.from(parent.children).every((child) => child instanceof HTMLCanvasElement);
            if (!onlyCanvas)
                return;
            group.forEach((canvas) => parent.appendChild(canvas));
        });
    }
    function reorderLayers(fromIndex, toIndex) {
        if (fromIndex === toIndex)
            return;
        if (fromIndex < 0 || fromIndex >= layerEntries.length)
            return;
        let targetIndex = toIndex;
        if (targetIndex < 0)
            targetIndex = 0;
        if (targetIndex > layerEntries.length)
            targetIndex = layerEntries.length;
        const [entry] = layerEntries.splice(fromIndex, 1);
        const [editorEntry] = editors.splice(fromIndex, 1);
        if (!entry || !editorEntry)
            return;
        if (targetIndex > layerEntries.length) {
            targetIndex = layerEntries.length;
        }
        layerEntries.splice(targetIndex, 0, entry);
        editors.splice(targetIndex, 0, editorEntry);
        const currentEditor = editor;
        const newActiveIndex = editors.indexOf(currentEditor);
        activeLayerIndex = newActiveIndex === -1 ? 0 : newActiveIndex;
        draggedLayerIndex = null;
        syncCanvasOrder();
        renderLayerSelect();
        renderLayerList();
        if (layerSelect) {
            layerSelect.value = String(activeLayerIndex);
        }
        updateLayerInteractivity();
        updateHistoryButtons();
    }
    function renderLayerList() {
        clearLayerListListeners();
        layerList.innerHTML = "";
        draggedLayerIndex = null;
        const enableDrag = layerEntries.length > 1;
        layerEntries.forEach((entry, index) => {
            const item = createElement("li");
            item.className = "layer-item";
            item.textContent = entry.name;
            item.dataset.index = String(index);
            item.draggable = enableDrag;
            if (index === activeLayerIndex) {
                item.classList.add("active");
            }
            layerList.appendChild(item);
            addLayerListListener(item, "click", () => {
                activateLayer(index);
            });
            if (!enableDrag) {
                return;
            }
            addLayerListListener(item, "dragstart", (event) => {
                draggedLayerIndex = index;
                item.classList.add("dragging");
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(index));
                }
            });
            addLayerListListener(item, "dragend", () => {
                item.classList.remove("dragging");
                draggedLayerIndex = null;
            });
            addLayerListListener(item, "dragover", (event) => {
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = "move";
                }
            });
            addLayerListListener(item, "drop", (event) => {
                event.preventDefault();
                const rect = item.getBoundingClientRect();
                const offset = event.clientY - rect.top;
                const targetIndex = parseInt(item.dataset.index ?? "0", 10);
                let insertIndex = targetIndex;
                if (offset > rect.height / 2) {
                    insertIndex = targetIndex + 1;
                }
                if (draggedLayerIndex !== null) {
                    reorderLayers(draggedLayerIndex, insertIndex);
                }
            });
        });
        if (enableDrag) {
            addLayerListListener(layerList, "dragover", (event) => {
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = "move";
                }
            });
            addLayerListListener(layerList, "drop", (event) => {
                event.preventDefault();
                if (draggedLayerIndex !== null) {
                    reorderLayers(draggedLayerIndex, layerEntries.length);
                }
            });
        }
    }
    layerEntries.forEach(({ canvas }) => {
        try {
            const e = new Editor(canvas, colorPicker, lineWidth, fillMode, () => {
                updateHistoryButtons();
            }, fontFamily ?? undefined, fontSize ?? undefined);
            editors.push(e);
        }
        catch {
            /* skip canvases without 2D context */
        }
    });
    if (editors.length === 0) {
        throw new Error("initEditor() requires at least one <canvas> element with a 2D context");
    }
    editors.forEach((e) => {
        const original = e.setTool.bind(e);
        e.setTool = (tool) => {
            original(tool);
            const ctor = tool.constructor;
            editorToolConstructors.set(e, ctor);
            activeToolCtor = ctor;
            setActiveButton(buttonForTool(tool));
        };
    });
    // active editor defaults to the first successfully created editor
    editor = editors[0];
    // default tool
    editor.setTool(new PencilTool());
    editorToolConstructors.set(editor, PencilTool);
    updateLayerInteractivity();
    renderLayerSelect();
    renderLayerList();
    syncCanvasOrder();
    // keyboard shortcuts
    const shortcuts = new Shortcuts(editor);
    // map button id to tool constructor
    Object.entries(toolConstructors).forEach(([id, ToolCtor]) => listen(toolButtons[id], "click", () => editor.setTool(new ToolCtor()), listeners));
    listen(undoBtn, "click", () => {
        editor.undo();
        updateHistoryButtons();
    }, listeners);
    listen(redoBtn, "click", () => {
        editor.redo();
        updateHistoryButtons();
    }, listeners);
    // saving
    listen(saveBtn, "click", () => {
        const format = formatSelect.value.toLowerCase() === "jpeg" ? "jpeg" : "png";
        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        const quality = format === "jpeg" ? 0.9 : undefined;
        let exportCanvas;
        if (layerEntries.length > 1) {
            // composite all layers respecting their opacity
            exportCanvas = document.createElement("canvas");
            exportCanvas.width = layerEntries[0].canvas.width;
            exportCanvas.height = layerEntries[0].canvas.height;
            const tempCtx = exportCanvas.getContext("2d");
            layerEntries.forEach(({ canvas }) => {
                const opacity = parseFloat(canvas.style.opacity) || 1;
                tempCtx.globalAlpha = opacity;
                tempCtx.drawImage(canvas, 0, 0);
            });
            tempCtx.globalAlpha = 1;
        }
        else {
            exportCanvas = editor.canvas;
        }
        const data = quality !== undefined
            ? exportCanvas.toDataURL(mime, quality)
            : exportCanvas.toDataURL(mime);
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
                editor.saveState();
                editor.ctx.drawImage(img, 0, 0, editor.canvas.width, editor.canvas.height);
                updateHistoryButtons();
                if (imageLoader)
                    imageLoader.value = "";
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }, listeners);
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
    listen(layerSelect, "change", () => {
        const idx = parseInt(layerSelect.value, 10);
        activateLayer(idx);
    }, listeners);
    function activateLayer(index) {
        if (index < 0 || index >= editors.length)
            return;
        activeLayerIndex = index;
        editor = editors[index];
        handle.editor = editor;
        shortcuts.switchEditor(editor);
        updateLayerInteractivity();
        const ToolCtor = editorToolConstructors.get(editor) ?? activeToolCtor;
        editor.setTool(new ToolCtor());
        updateHistoryButtons();
        if (layerSelect)
            layerSelect.value = String(index);
        renderLayerList();
    }
    const handle = {
        editor,
        editors,
        activateLayer,
        reorderLayers,
        destroy() {
            clearLayerListListeners();
            listeners.forEach((fn) => fn());
            shortcuts.destroy();
            editors.forEach((e) => e.destroy());
        },
    };
    recordColor(colorPicker.value);
    updateHistoryButtons();
    return handle;
}
