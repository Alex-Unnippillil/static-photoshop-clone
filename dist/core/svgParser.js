import { VectorLayer } from "./VectorLayer.js";
const SUPPORTED_TAGS = new Set([
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "g",
]);
const IGNORE_TAGS = new Set(["defs", "title", "desc", "metadata"]);
function parseNumber(value) {
    if (!value) {
        return undefined;
    }
    const numeric = parseFloat(value);
    return Number.isFinite(numeric) ? numeric : undefined;
}
function parseOpacity(value) {
    const numeric = parseNumber(value);
    if (numeric === undefined) {
        return undefined;
    }
    if (numeric < 0)
        return 0;
    if (numeric > 1)
        return 1;
    return numeric;
}
function parsePoints(value) {
    const points = [];
    const pairs = value
        .trim()
        .replace(/\s+/g, " ")
        .split(/[\s,]+/);
    if (pairs.length % 2 !== 0) {
        return undefined;
    }
    for (let i = 0; i < pairs.length; i += 2) {
        const x = parseFloat(pairs[i]);
        const y = parseFloat(pairs[i + 1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return undefined;
        }
        points.push({ x, y });
    }
    return points;
}
function parseStrokeLineCap(value) {
    switch (value) {
        case "butt":
        case "round":
        case "square":
            return value;
        default:
            return undefined;
    }
}
function parseStrokeLineJoin(value) {
    switch (value) {
        case "miter":
        case "round":
        case "bevel":
            return value;
        default:
            return undefined;
    }
}
function getCommonAttributes(element, warnings) {
    const fill = element.getAttribute("fill") ?? undefined;
    const fillOpacity = parseOpacity(element.getAttribute("fill-opacity"));
    const stroke = element.getAttribute("stroke") ?? undefined;
    const strokeOpacity = parseOpacity(element.getAttribute("stroke-opacity"));
    const strokeWidth = parseNumber(element.getAttribute("stroke-width"));
    const opacity = parseOpacity(element.getAttribute("opacity"));
    const strokeLineCap = parseStrokeLineCap(element.getAttribute("stroke-linecap"));
    const strokeLineJoin = parseStrokeLineJoin(element.getAttribute("stroke-linejoin"));
    if (element.hasAttribute("stroke-dasharray")) {
        warnings.push(`<${element.tagName}> stroke-dasharray is not supported and was ignored.`);
    }
    if (element.hasAttribute("transform")) {
        warnings.push(`<${element.tagName}> transform attributes are not supported and were ignored.`);
    }
    if (element.hasAttribute("style")) {
        warnings.push(`<${element.tagName}> inline styles are not fully supported and may be ignored.`);
    }
    return {
        fill,
        fillOpacity,
        stroke,
        strokeOpacity,
        strokeWidth,
        opacity,
        strokeLineCap,
        strokeLineJoin,
    };
}
function parseRect(element, warnings) {
    const width = parseNumber(element.getAttribute("width"));
    const height = parseNumber(element.getAttribute("height"));
    if (width === undefined || height === undefined) {
        warnings.push("<rect> is missing width or height and was skipped.");
        return null;
    }
    const x = parseNumber(element.getAttribute("x")) ?? 0;
    const y = parseNumber(element.getAttribute("y")) ?? 0;
    return {
        type: "rect",
        x,
        y,
        width,
        height,
        ...getCommonAttributes(element, warnings),
    };
}
function parseCircle(element, warnings) {
    const r = parseNumber(element.getAttribute("r"));
    if (r === undefined) {
        warnings.push("<circle> is missing r and was skipped.");
        return null;
    }
    const cx = parseNumber(element.getAttribute("cx")) ?? 0;
    const cy = parseNumber(element.getAttribute("cy")) ?? 0;
    return {
        type: "circle",
        cx,
        cy,
        r,
        ...getCommonAttributes(element, warnings),
    };
}
function parseEllipse(element, warnings) {
    const rx = parseNumber(element.getAttribute("rx"));
    const ry = parseNumber(element.getAttribute("ry"));
    if (rx === undefined || ry === undefined) {
        warnings.push("<ellipse> is missing rx or ry and was skipped.");
        return null;
    }
    const cx = parseNumber(element.getAttribute("cx")) ?? 0;
    const cy = parseNumber(element.getAttribute("cy")) ?? 0;
    return {
        type: "ellipse",
        cx,
        cy,
        rx,
        ry,
        ...getCommonAttributes(element, warnings),
    };
}
function parseLine(element, warnings) {
    const x1 = parseNumber(element.getAttribute("x1"));
    const y1 = parseNumber(element.getAttribute("y1"));
    const x2 = parseNumber(element.getAttribute("x2"));
    const y2 = parseNumber(element.getAttribute("y2"));
    if (x1 === undefined ||
        y1 === undefined ||
        x2 === undefined ||
        y2 === undefined) {
        warnings.push("<line> is missing coordinates and was skipped.");
        return null;
    }
    return {
        type: "line",
        x1,
        y1,
        x2,
        y2,
        ...getCommonAttributes(element, warnings),
    };
}
function parsePolyline(element, closed, warnings) {
    const pointsAttr = element.getAttribute("points");
    if (!pointsAttr) {
        warnings.push(`<${element.tagName}> is missing points and was skipped.`);
        return null;
    }
    const points = parsePoints(pointsAttr);
    if (!points) {
        warnings.push(`<${element.tagName}> points could not be parsed and was skipped.`);
        return null;
    }
    return {
        type: "polyline",
        points,
        closed,
        ...getCommonAttributes(element, warnings),
    };
}
function walk(element, warnings, out) {
    const tag = element.tagName.toLowerCase();
    if (IGNORE_TAGS.has(tag)) {
        return;
    }
    if (!SUPPORTED_TAGS.has(tag)) {
        warnings.push(`Unsupported <${element.tagName}> was ignored.`);
        return;
    }
    if (tag === "g") {
        if (element.hasAttribute("transform")) {
            warnings.push("<g> transform attributes are not supported and were ignored.");
        }
        for (const child of Array.from(element.children)) {
            walk(child, warnings, out);
        }
        return;
    }
    let shape = null;
    switch (tag) {
        case "rect":
            shape = parseRect(element, warnings);
            break;
        case "circle":
            shape = parseCircle(element, warnings);
            break;
        case "ellipse":
            shape = parseEllipse(element, warnings);
            break;
        case "line":
            shape = parseLine(element, warnings);
            break;
        case "polyline":
            shape = parsePolyline(element, false, warnings);
            break;
        case "polygon":
            shape = parsePolyline(element, true, warnings);
            break;
    }
    if (shape) {
        out.push(shape);
    }
}
export function parseSvgToVectorLayer(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.documentElement;
    const warnings = [];
    if (!svg || svg.tagName.toLowerCase() !== "svg") {
        warnings.push("The provided file is not a valid SVG document.");
        return { layer: new VectorLayer([], { width: 1, height: 1 }), warnings };
    }
    const viewBoxAttr = svg.getAttribute("viewBox");
    let minX = 0;
    let minY = 0;
    let viewBoxWidth;
    let viewBoxHeight;
    if (viewBoxAttr) {
        const parts = viewBoxAttr.split(/\s+/).map((part) => parseFloat(part));
        if (parts.length === 4 && parts.every((part) => Number.isFinite(part))) {
            [minX, minY, viewBoxWidth, viewBoxHeight] = parts;
        }
        else {
            warnings.push("SVG viewBox could not be parsed. Falling back to width/height.");
        }
    }
    const widthAttr = svg.getAttribute("width");
    const heightAttr = svg.getAttribute("height");
    const width = parseNumber(widthAttr ?? "");
    const height = parseNumber(heightAttr ?? "");
    const sourceWidth = viewBoxWidth ?? width ?? 1;
    const sourceHeight = viewBoxHeight ?? height ?? 1;
    if (!svg.hasAttribute("viewBox") && (!width || !height)) {
        warnings.push("SVG is missing explicit dimensions; assuming a 1:1 coordinate system.");
    }
    const shapes = [];
    for (const child of Array.from(svg.children)) {
        walk(child, warnings, shapes);
    }
    if (shapes.length === 0) {
        warnings.push("No supported shapes were found in the SVG.");
    }
    return {
        layer: new VectorLayer(shapes, {
            minX,
            minY,
            width: sourceWidth,
            height: sourceHeight,
        }),
        warnings,
    };
}
