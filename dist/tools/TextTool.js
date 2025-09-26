export class TextTool {
    constructor() {
        this.textarea = null;
        this.blurListener = null;
        this.keydownListener = null;
        this.startX = 0;
        this.startY = 0;
        this.fontWeight = "normal";
        this.fontStyle = "normal";
        this.textAlign = "left";
        this.multiline = true;
        this.defaultWidth = 200;
        this.defaultHeight = 48;
    }
    onPointerDown(e, editor) {
        this.cleanup();
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.fontWeight = editor.fontWeightValue;
        this.fontStyle = editor.fontStyleValue;
        this.textAlign = editor.textAlignValue;
        this.multiline = editor.textMultiline;
        const textarea = document.createElement("textarea");
        textarea.style.position = "absolute";
        const parent = editor.canvas.parentElement || document.body;
        textarea.style.left = `${this.startX}px`;
        textarea.style.top = `${this.startY}px`;
        textarea.style.color = editor.strokeStyle;
        textarea.style.fontSize = `${editor.fontSizeValue}px`;
        textarea.style.fontFamily = editor.fontFamilyValue;
        textarea.style.fontWeight = this.fontWeight;
        textarea.style.fontStyle = this.fontStyle;
        textarea.style.background = "transparent";
        textarea.style.border = "1px dashed #888";
        textarea.style.outline = "none";
        textarea.style.resize = this.multiline ? "both" : "horizontal";
        textarea.style.overflow = this.multiline ? "auto" : "hidden";
        textarea.wrap = this.multiline ? "soft" : "off";
        textarea.style.whiteSpace = this.multiline ? "pre-wrap" : "nowrap";
        textarea.style.minWidth = "80px";
        textarea.style.minHeight = `${Math.max(32, editor.fontSizeValue * 1.5)}px`;
        textarea.style.width = `${this.defaultWidth}px`;
        textarea.style.height = `${this.defaultHeight}px`;
        textarea.style.padding = "0";
        textarea.style.textAlign = this.textAlign;
        parent.appendChild(textarea);
        textarea.focus();
        const commit = () => {
            if (!this.textarea) {
                return;
            }
            const currentTextarea = this.textarea;
            const text = this.multiline
                ? currentTextarea.value
                : currentTextarea.value.split(/\r?\n/)[0] ?? "";
            if (!text.trim()) {
                this.cleanup();
                return;
            }
            const width = this.getDimension(currentTextarea, "width");
            const font = this.composeFont(editor);
            const lines = this.computeLines(text, width, editor, font);
            this.drawLines(lines, width, editor, font);
            this.cleanup();
        };
        const cancel = () => {
            this.cleanup();
        };
        this.blurListener = () => {
            commit();
        };
        textarea.addEventListener("blur", this.blurListener);
        this.keydownListener = (ev) => {
            if (ev.key === "Enter") {
                if (this.multiline && !(ev.metaKey || ev.ctrlKey)) {
                    return;
                }
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
        this.textarea.remove();
        this.textarea = null;
        this.blurListener = null;
        this.keydownListener = null;
    }
    composeFont(editor) {
        const parts = [];
        if (this.fontStyle !== "normal") {
            parts.push(this.fontStyle);
        }
        if (this.fontWeight !== "normal") {
            parts.push(this.fontWeight);
        }
        parts.push(`${editor.fontSizeValue}px`);
        parts.push(editor.fontFamilyValue);
        return parts.join(" ");
    }
    getDimension(textarea, prop) {
        const clientValue = prop === "width" ? textarea.clientWidth : textarea.clientHeight;
        if (clientValue)
            return clientValue;
        const fromStyle = parseFloat(window.getComputedStyle(textarea)[prop]);
        if (!Number.isNaN(fromStyle) && fromStyle > 0) {
            return fromStyle;
        }
        return prop === "width" ? this.defaultWidth : this.defaultHeight;
    }
    computeLines(text, maxWidth, editor, font) {
        const ctx = editor.ctx;
        ctx.save();
        ctx.font = font;
        const lines = [];
        if (!this.multiline || maxWidth <= 0) {
            text
                .split(/\r?\n/)
                .forEach((line) => lines.push(line));
            ctx.restore();
            return lines;
        }
        const paragraphs = text.split(/\r?\n/);
        paragraphs.forEach((paragraph, index) => {
            if (!paragraph.length) {
                lines.push("");
                return;
            }
            const words = paragraph.split(/\s+/);
            let current = "";
            words.forEach((word) => {
                if (!word)
                    return;
                const tentative = current ? `${current} ${word}` : word;
                if (ctx.measureText(tentative).width > maxWidth && current) {
                    lines.push(current);
                    current = word;
                }
                else {
                    current = tentative;
                }
            });
            if (current) {
                lines.push(current);
            }
            if (index < paragraphs.length - 1 && paragraph.endsWith(" ")) {
                lines.push("");
            }
        });
        ctx.restore();
        return lines;
    }
    drawLines(lines, width, editor, font) {
        const ctx = editor.ctx;
        ctx.save();
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = font;
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = "alphabetic";
        const defaultAscent = editor.fontSizeValue * 0.8;
        const defaultDescent = editor.fontSizeValue * 0.2;
        let y = this.startY;
        lines.forEach((line, index) => {
            const metrics = ctx.measureText(line || " ");
            const ascent = metrics.actualBoundingBoxAscent || defaultAscent;
            const descent = metrics.actualBoundingBoxDescent || defaultDescent;
            y += ascent;
            ctx.fillText(line, this.resolveX(width), y);
            y += descent;
            if (this.multiline && index < lines.length - 1) {
                y += defaultDescent;
            }
        });
        ctx.restore();
    }
    resolveX(width) {
        switch (this.textAlign) {
            case "center":
                return this.startX + width / 2;
            case "right":
            case "end":
                return this.startX + width;
            case "left":
            case "start":
            default:
                return this.startX;
        }
    }
}
