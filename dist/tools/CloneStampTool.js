class BrushPreview {
    constructor(canvas) {
        const container = canvas.parentElement ?? canvas;
        this.overlay = document.createElement("div");
        this.overlay.className = "clone-stamp-preview";
        this.overlay.style.position = "absolute";
        this.overlay.style.top = "0";
        this.overlay.style.left = "0";
        this.overlay.style.right = "0";
        this.overlay.style.bottom = "0";
        this.overlay.style.pointerEvents = "none";
        container.appendChild(this.overlay);
        this.brush = document.createElement("div");
        this.brush.className = "clone-stamp-brush";
        this.overlay.appendChild(this.brush);
        this.source = document.createElement("div");
        this.source.className = "clone-stamp-source";
        this.overlay.appendChild(this.source);
        this.hideBrush();
        this.hideSource();
    }
    updateBrush(x, y, size) {
        const diameter = Math.max(1, Math.round(size));
        this.brush.style.display = "block";
        this.brush.style.width = `${diameter}px`;
        this.brush.style.height = `${diameter}px`;
        this.brush.style.left = `${x}px`;
        this.brush.style.top = `${y}px`;
        this.brush.style.marginLeft = `${-diameter / 2}px`;
        this.brush.style.marginTop = `${-diameter / 2}px`;
    }
    hideBrush() {
        this.brush.style.display = "none";
    }
    updateSource(x, y) {
        this.source.style.display = "block";
        this.source.style.left = `${x}px`;
        this.source.style.top = `${y}px`;
    }
    hideSource() {
        this.source.style.display = "none";
    }
    destroy() {
        this.overlay.remove();
    }
}
export class CloneStampTool {
    constructor() {
        this.source = null;
        this.offset = null;
        this.snapshot = null;
        this.painting = false;
        this.preview = null;
    }
    getPreview(editor) {
        if (!this.preview) {
            this.preview = new BrushPreview(editor.canvas);
        }
        return this.preview;
    }
    onPointerDown(e, editor) {
        const preview = this.getPreview(editor);
        preview.updateBrush(e.offsetX, e.offsetY, editor.lineWidthValue);
        if (e.altKey) {
            this.source = { x: e.offsetX, y: e.offsetY };
            this.offset = null;
            this.snapshot = null;
            preview.updateSource(e.offsetX, e.offsetY);
            this.painting = false;
            return;
        }
        if (!this.source) {
            preview.hideSource();
            return;
        }
        this.painting = true;
        this.snapshot = editor.ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
        this.offset = {
            x: e.offsetX - this.source.x,
            y: e.offsetY - this.source.y,
        };
        this.stampAt(e.offsetX, e.offsetY, editor);
    }
    onPointerMove(e, editor) {
        const preview = this.getPreview(editor);
        preview.updateBrush(e.offsetX, e.offsetY, editor.lineWidthValue);
        if (e.altKey) {
            preview.updateSource(e.offsetX, e.offsetY);
            return;
        }
        if (this.painting && e.buttons === 1) {
            this.stampAt(e.offsetX, e.offsetY, editor);
            return;
        }
        if (this.source) {
            preview.updateSource(this.source.x, this.source.y);
        }
        else {
            preview.hideSource();
        }
    }
    onPointerUp(e, editor) {
        if (this.painting) {
            this.painting = false;
            this.stampAt(e.offsetX, e.offsetY, editor);
        }
        this.snapshot = null;
        this.offset = null;
        if (this.source) {
            this.preview?.updateSource(this.source.x, this.source.y);
        }
        else {
            this.preview?.hideSource();
        }
    }
    destroy() {
        this.preview?.destroy();
        this.preview = null;
    }
    stampAt(x, y, editor) {
        if (!this.snapshot || !this.source || !this.offset) {
            return;
        }
        const sampleX = Math.round(x - this.offset.x);
        const sampleY = Math.round(y - this.offset.y);
        const size = Math.max(1, Math.round(editor.lineWidthValue));
        const half = size / 2;
        const destLeft = Math.round(x - half);
        const destTop = Math.round(y - half);
        const srcLeft = Math.round(sampleX - half);
        const srcTop = Math.round(sampleY - half);
        const srcData = this.snapshot.data;
        const srcWidth = this.snapshot.width;
        const srcHeight = this.snapshot.height;
        const canvasWidth = editor.canvas.width;
        const canvasHeight = editor.canvas.height;
        const temp = new Uint8ClampedArray(size * size * 4);
        let minDX = size;
        let minDY = size;
        let maxDX = -1;
        let maxDY = -1;
        for (let dy = 0; dy < size; dy++) {
            const destY = destTop + dy;
            const srcY = srcTop + dy;
            if (destY < 0 || destY >= canvasHeight)
                continue;
            if (srcY < 0 || srcY >= srcHeight)
                continue;
            for (let dx = 0; dx < size; dx++) {
                const destX = destLeft + dx;
                const srcX = srcLeft + dx;
                if (destX < 0 || destX >= canvasWidth)
                    continue;
                if (srcX < 0 || srcX >= srcWidth)
                    continue;
                const srcIndex = (srcY * srcWidth + srcX) * 4;
                const destIndex = (dy * size + dx) * 4;
                temp[destIndex] = srcData[srcIndex];
                temp[destIndex + 1] = srcData[srcIndex + 1];
                temp[destIndex + 2] = srcData[srcIndex + 2];
                temp[destIndex + 3] = srcData[srcIndex + 3];
                if (dx < minDX)
                    minDX = dx;
                if (dx > maxDX)
                    maxDX = dx;
                if (dy < minDY)
                    minDY = dy;
                if (dy > maxDY)
                    maxDY = dy;
            }
        }
        if (maxDX < minDX || maxDY < minDY) {
            return;
        }
        const width = maxDX - minDX + 1;
        const height = maxDY - minDY + 1;
        const data = new Uint8ClampedArray(width * height * 4);
        for (let dy = minDY; dy <= maxDY; dy++) {
            for (let dx = minDX; dx <= maxDX; dx++) {
                const srcIndex = (dy * size + dx) * 4;
                const destIndex = ((dy - minDY) * width + (dx - minDX)) * 4;
                data[destIndex] = temp[srcIndex];
                data[destIndex + 1] = temp[srcIndex + 1];
                data[destIndex + 2] = temp[srcIndex + 2];
                data[destIndex + 3] = temp[srcIndex + 3];
            }
        }
        const imageData = this.createImageData(data, width, height);
        editor.ctx.putImageData(imageData, destLeft + minDX, destTop + minDY);
        this.preview?.updateSource(sampleX, sampleY);
    }
    createImageData(data, width, height) {
        if (typeof ImageData !== "undefined") {
            const image = new ImageData(width, height);
            image.data.set(data);
            return image;
        }
        return { data, width, height };
    }
}
