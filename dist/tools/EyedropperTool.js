/**
 * Tool that samples the canvas color at the clicked position and updates
 * the editor's color picker to the sampled value.
 */
export class EyedropperTool {
    constructor() {
        this.cursor = "crosshair";
    }
    onPointerDown(e, editor) {
        const { width, height } = editor.canvas;
        const dpr = editor.pixelRatioValue;
        const { x: worldX, y: worldY } = editor.getCanvasPoint(e);
        const x = Math.max(0, Math.min(width - 1, Math.floor(worldX * dpr)));
        const y = Math.max(0, Math.min(height - 1, Math.floor(worldY * dpr)));
        const { data } = editor.ctx.getImageData(x, y, 1, 1);
        const [r, g, b] = data;
        const toHex = (v) => v.toString(16).padStart(2, "0");
        editor.colorPicker.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        editor.colorPicker.dispatchEvent(new Event("input", { bubbles: true }));
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1)
            return;
        this.onPointerDown(e, editor);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onPointerUp(_e, _editor) {
        // intentionally unused
    }
}
