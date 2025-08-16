import { PencilTool } from "../tools/PencilTool";
import { RectangleTool } from "../tools/RectangleTool";
import { LineTool } from "../tools/LineTool";
import { CircleTool } from "../tools/CircleTool";
import { TextTool } from "../tools/TextTool";
import { EraserTool } from "../tools/EraserTool";
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
    onKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === "z") {
                if (e.shiftKey) {
                    this.editor.redo();
                }
                else {
                    this.editor.undo();
                }
                e.preventDefault();
            }
            return;
        }
        switch (e.key.toLowerCase()) {
            case "p":
                this.editor.setTool(new PencilTool());
                break;
            case "r":
                this.editor.setTool(new RectangleTool());
                break;
            case "l":
                this.editor.setTool(new LineTool());
                break;
            case "c":
                this.editor.setTool(new CircleTool());
                break;
            case "t":
                this.editor.setTool(new TextTool());
                break;
            case "e":
                this.editor.setTool(new EraserTool());
                break;
        }
    }
    destroy() {
        document.removeEventListener("keydown", this.handler);
    }
}
