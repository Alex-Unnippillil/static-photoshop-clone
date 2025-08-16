/**
 * Base class for drawing tools. It exposes a helper that applies the
 * editor's current stroke and fill settings to a rendering context.
 */
export class DrawingTool {
    /**
     * Apply the current stroke and fill styles from the editor to the canvas
     * rendering context. Subclasses should call this before performing any
     * drawing operations.
     */
    applyStroke(ctx, editor) {
        ctx.lineWidth = editor.lineWidthValue;
        ctx.strokeStyle = editor.strokeStyle;
        ctx.fillStyle = editor.fillStyle;
    }
}
