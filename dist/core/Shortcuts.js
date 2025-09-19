import { PencilTool } from "../tools/PencilTool.js";
import { RectangleTool } from "../tools/RectangleTool.js";
import { LineTool } from "../tools/LineTool.js";
import { CircleTool } from "../tools/CircleTool.js";
import { TextTool } from "../tools/TextTool.js";
import { EraserTool } from "../tools/EraserTool.js";
import { BucketFillTool } from "../tools/BucketFillTool.js";
import { EyedropperTool } from "../tools/EyedropperTool.js";
/**
 * Keyboard shortcuts handler for the editor.
 * Maps specific key presses to tool changes or editor actions.
 */
export class Shortcuts {
    constructor(editor) {
        this.editor = editor;
        this.handler = (e) => this.onKeyDown(e);
        document.addEventListener("keydown", this.handler);
    }
    /** Swap the editor that receives subsequent shortcut actions. */
    switchEditor(newEditor) {
        this.editor = newEditor;
    }
    onKeyDown(e) {
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
    /** Remove keyboard listeners. */
    destroy() {
        document.removeEventListener("keydown", this.handler);
    }
}
