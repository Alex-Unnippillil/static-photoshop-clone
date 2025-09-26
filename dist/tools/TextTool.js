export class TextTool {
    constructor() {
        this.textarea = null;
        this.blurListener = null;
        this.keydownListener = null;
        this.viewUnsubscribe = null;
        this.anchor = null;
    }
    onPointerDown(e, editor) {
        this.cleanup();
        const textarea = document.createElement("textarea");
        textarea.style.position = "absolute";
        const parent = editor.canvas.parentElement || document.body;
        const point = editor.getCanvasPoint(e);
        this.anchor = point;
        const screen = editor.canvasToScreen(point.x, point.y);
        textarea.style.left = `${screen.x}px`;
        textarea.style.top = `${screen.y}px`;
        textarea.style.color = editor.strokeStyle;
        textarea.style.fontSize = `${editor.fontSizeValue * editor.zoomFactor}px`;
        textarea.style.fontFamily = editor.fontFamilyValue;
        textarea.style.background = "transparent";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        parent.appendChild(textarea);
        textarea.focus();
        const commit = () => {
            const text = textarea.value;
            const anchor = this.anchor;
            this.cleanup();
            if (text && anchor) {
                editor.ctx.fillStyle = editor.strokeStyle;
                const fontSize = editor.fontSizeValue / editor.zoomFactor;
                editor.ctx.font = `${fontSize}px ${editor.fontFamilyValue}`;
                editor.ctx.fillText(text, anchor.x, anchor.y);
            }
        };
        const cancel = () => {
            this.cleanup();
        };
        this.blurListener = cancel;
        textarea.addEventListener("blur", this.blurListener);
        this.keydownListener = (ev) => {
            if (ev.key === "Enter") {
                ev.preventDefault();
                commit();
            }
            else if (ev.key === "Escape") {
                ev.preventDefault();
                cancel();
            }
        };
        textarea.addEventListener("keydown", this.keydownListener);
        this.textarea = textarea;
        this.viewUnsubscribe = editor.onViewChange((state) => {
            if (!this.textarea || !this.anchor)
                return;
            const screenPos = editor.canvasToScreen(this.anchor.x, this.anchor.y);
            this.textarea.style.left = `${screenPos.x}px`;
            this.textarea.style.top = `${screenPos.y}px`;
            this.textarea.style.fontSize = `${editor.fontSizeValue * state.zoom}px`;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onPointerMove(_e, _editor) {
        /* no-op */
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onPointerUp(_e, _editor) {
        if (this.textarea && document.activeElement !== this.textarea) {
            this.cleanup();
        }
    }
    destroy() {
        this.cleanup();
    }
    cleanup() {
        if (!this.textarea)
            return;
        if (this.blurListener) {
            this.textarea.removeEventListener("blur", this.blurListener);
        }
        if (this.keydownListener) {
            this.textarea.removeEventListener("keydown", this.keydownListener);
        }
        if (this.viewUnsubscribe) {
            this.viewUnsubscribe();
            this.viewUnsubscribe = null;
        }
        this.textarea.remove();
        this.textarea = null;
        this.blurListener = null;
        this.keydownListener = null;
        this.anchor = null;
    }
}
