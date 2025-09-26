const keyToToolId = {
    p: "pencil",
    r: "rectangle",
    l: "line",
    c: "circle",
    e: "eraser",
    t: "text",
    b: "bucket",
    i: "eyedropper",
};
/**
 * Keyboard shortcuts handler for the editor.
 * Maps specific key presses to tool changes or editor actions.
 */
export class Shortcuts {
    handler;
    editor;
    loadTool;
    constructor(editor, loadTool) {
        this.editor = editor;
        this.loadTool = loadTool;
        this.handler = (e) => {
            void this.onKeyDown(e);
        };
        document.addEventListener("keydown", this.handler);
    }
    /** Swap the editor that receives subsequent shortcut actions. */
    switchEditor(newEditor) {
        this.editor = newEditor;
    }
    async onKeyDown(e) {
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
        const key = e.key.toLowerCase();
        const toolId = keyToToolId[key];
        if (toolId) {
            e.preventDefault();
            try {
                const ToolCtor = await this.loadTool(toolId);
                this.editor.setTool(new ToolCtor());
            }
            catch {
                /* ignore failed dynamic import */
            }
        }
    }
    /** Remove keyboard listeners. */
    destroy() {
        document.removeEventListener("keydown", this.handler);
    }
}
