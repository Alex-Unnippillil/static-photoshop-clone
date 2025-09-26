import { PencilTool } from "../tools/PencilTool.js";
import { RectangleTool } from "../tools/RectangleTool.js";
import { LineTool } from "../tools/LineTool.js";
import { CircleTool } from "../tools/CircleTool.js";
import { TextTool } from "../tools/TextTool.js";
import { EraserTool } from "../tools/EraserTool.js";
import { BucketFillTool } from "../tools/BucketFillTool.js";
import { EyedropperTool } from "../tools/EyedropperTool.js";
import { HandTool } from "../tools/HandTool.js";
/**
 * Keyboard shortcuts handler for the editor.
 * Maps specific key presses to tool changes or editor actions.
 */
export class Shortcuts {
    constructor(editor) {
        this.spacePressed = false;
        this.previousToolCtor = null;
        this.editor = editor;
        this.handler = (e) => this.onKeyDown(e);
        this.keyupHandler = (e) => this.onKeyUp(e);
        document.addEventListener("keydown", this.handler);
        document.addEventListener("keyup", this.keyupHandler);
    }
    /** Swap the editor that receives subsequent shortcut actions. */
    switchEditor(newEditor) {
        this.editor = newEditor;
        const active = this.editor.activeTool;
        if (this.spacePressed) {
            if (!(active instanceof HandTool)) {
                this.previousToolCtor = this.getToolCtor(active) ?? this.previousToolCtor;
            }
            this.editor.setTool(new HandTool());
        }
        else {
            this.previousToolCtor = active instanceof HandTool ? null : this.getToolCtor(active);
        }
    }
    onKeyDown(e) {
        if (this.handleSpaceKeyDown(e)) {
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase();
            if (key === "z") {
                if (e.shiftKey) {
                    this.editor.redo();
                }
                else {
                    this.editor.undo();
                }
                e.preventDefault();
            }
            else if (key === "y" && e.ctrlKey && !e.metaKey) {
                this.editor.redo();
                e.preventDefault();
            }
            return;
        }
        switch (e.key.toLowerCase()) {
            case "p":
                e.preventDefault();
                this.editor.setTool(new PencilTool());
                break;
            case "r":
                e.preventDefault();
                this.editor.setTool(new RectangleTool());
                break;
            case "l":
                e.preventDefault();
                this.editor.setTool(new LineTool());
                break;
            case "c":
                e.preventDefault();
                this.editor.setTool(new CircleTool());
                break;
            case "e":
                e.preventDefault();
                this.editor.setTool(new EraserTool());
                break;
            case "t":
                e.preventDefault();
                this.editor.setTool(new TextTool());
                break;
            case "b":
                e.preventDefault();
                this.editor.setTool(new BucketFillTool());
                break;
            case "i":
                e.preventDefault();
                this.editor.setTool(new EyedropperTool());
                break;
        }
    }
    onKeyUp(e) {
        if (!this.spacePressed)
            return;
        if (e.key !== " " && e.key !== "Spacebar")
            return;
        e.preventDefault();
        this.spacePressed = false;
        if (this.previousToolCtor) {
            this.editor.setTool(new this.previousToolCtor());
        }
        this.previousToolCtor = null;
    }
    handleSpaceKeyDown(e) {
        if (e.key !== " " && e.key !== "Spacebar") {
            return false;
        }
        if (e.repeat) {
            e.preventDefault();
            return true;
        }
        e.preventDefault();
        if (!this.spacePressed) {
            const active = this.editor.activeTool;
            if (!(active instanceof HandTool)) {
                this.previousToolCtor = this.getToolCtor(active);
            }
            this.editor.setTool(new HandTool());
            this.spacePressed = true;
        }
        return true;
    }
    getToolCtor(tool) {
        return tool ? tool.constructor : null;
    }
    /** Remove keyboard listeners. */
    destroy() {
        document.removeEventListener("keydown", this.handler);
        document.removeEventListener("keyup", this.keyupHandler);
    }
}
