/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses a simple stack-based flood fill on the canvas' pixel data.
 */
export class BucketFillTool {
    onPointerDown(e, editor) {
        const ctx = editor.ctx;
        const { width, height } = editor.canvas;
        const image = ctx.getImageData(0, 0, width, height);
        const targetColor = this.getPixel(image, e.offsetX, e.offsetY);
        const fillColor = this.hexToRgb(editor.fillStyle);
        // if target already the fill color, nothing to do
        if (this.colorsMatch(targetColor, fillColor))
            return;
        const stack = [[e.offsetX | 0, e.offsetY | 0]];
        while (stack.length) {
            const [x, y] = stack.pop();
            const current = this.getPixel(image, x, y);
            if (!this.colorsMatch(current, targetColor))
                continue;
            this.setPixel(image, x, y, fillColor);
            if (x > 0)
                stack.push([x - 1, y]);
            if (x < width - 1)
                stack.push([x + 1, y]);
            if (y > 0)
                stack.push([x, y - 1]);
            if (y < height - 1)
                stack.push([x, y + 1]);
        }
        ctx.putImageData(image, 0, 0);
    }
    onPointerMove(_e, _editor) { }
    onPointerUp(_e, _editor) { }
    getPixel(image, x, y) {
        const { width, data } = image;
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    }
    setPixel(image, x, y, color) {
        const { width, data } = image;
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[idx] = color[0];
        data[idx + 1] = color[1];
        data[idx + 2] = color[2];
        data[idx + 3] = 255;
    }
    colorsMatch(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
    hexToRgb(hex) {
        let h = hex.replace(/^#/, "");
        if (h.length === 3) {
            h = h.split("").map((c) => c + c).join("");
        }
        const num = parseInt(h, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
}
