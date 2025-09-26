export function floodFill(data, options) {
    const { width, height, startX, startY, fill, maxPixels } = options;
    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
        return { dirtyRects: [], processed: 0, aborted: false };
    }
    const startIndex = startY * width + startX;
    const targetOffset = startIndex * 4;
    const targetR = data[targetOffset];
    const targetG = data[targetOffset + 1];
    const targetB = data[targetOffset + 2];
    const targetA = data[targetOffset + 3];
    const [fillR, fillG, fillB, fillA] = fill;
    if (targetR === fillR &&
        targetG === fillG &&
        targetB === fillB &&
        targetA === fillA) {
        return { dirtyRects: [], processed: 0, aborted: false };
    }
    const pixelCount = width * height;
    const queue = new Uint32Array(pixelCount);
    const visited = new Uint8Array(pixelCount);
    let head = 0;
    let tail = 0;
    let processed = 0;
    let aborted = false;
    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;
    queue[tail++] = startIndex;
    visited[startIndex] = 1;
    while (head < tail) {
        const idx = queue[head++];
        const offset = idx * 4;
        if (data[offset] !== targetR ||
            data[offset + 1] !== targetG ||
            data[offset + 2] !== targetB ||
            data[offset + 3] !== targetA) {
            continue;
        }
        data[offset] = fillR;
        data[offset + 1] = fillG;
        data[offset + 2] = fillB;
        data[offset + 3] = fillA;
        processed++;
        if (processed > maxPixels) {
            aborted = true;
            break;
        }
        const x = idx % width;
        const y = (idx / width) | 0;
        if (x < minX)
            minX = x;
        if (x > maxX)
            maxX = x;
        if (y < minY)
            minY = y;
        if (y > maxY)
            maxY = y;
        if (x > 0) {
            const left = idx - 1;
            if (!visited[left]) {
                queue[tail++] = left;
                visited[left] = 1;
            }
        }
        if (x < width - 1) {
            const right = idx + 1;
            if (!visited[right]) {
                queue[tail++] = right;
                visited[right] = 1;
            }
        }
        if (y > 0) {
            const up = idx - width;
            if (!visited[up]) {
                queue[tail++] = up;
                visited[up] = 1;
            }
        }
        if (y < height - 1) {
            const down = idx + width;
            if (!visited[down]) {
                queue[tail++] = down;
                visited[down] = 1;
            }
        }
    }
    if (processed === 0) {
        return { dirtyRects: [], processed: 0, aborted };
    }
    const rectWidth = maxX - minX + 1;
    const rectHeight = maxY - minY + 1;
    const rectBuffer = new Uint8ClampedArray(rectWidth * rectHeight * 4);
    for (let row = 0; row < rectHeight; row++) {
        const sourceStart = ((minY + row) * width + minX) * 4;
        const destStart = row * rectWidth * 4;
        rectBuffer.set(data.subarray(sourceStart, sourceStart + rectWidth * 4), destStart);
    }
    return {
        dirtyRects: [
            {
                x: minX,
                y: minY,
                width: rectWidth,
                height: rectHeight,
                buffer: rectBuffer.buffer,
            },
        ],
        processed,
        aborted,
    };
}
