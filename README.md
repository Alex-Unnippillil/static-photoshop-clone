# Photoshop Clone

[![CI](https://github.com/openai/photoshop-clone/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/openai/photoshop-clone/actions/workflows/ci.yml)

A simple Photoshop-like web application built with HTML5 Canvas, CSS, and JavaScript.

## Features

- Pencil tool for freehand drawing
- Line tool for straight lines
- Rectangle tool for shape creation
- Circle tool for drawing circles and ellipses
- Text tool for adding labels
- Bucket fill tool for painting contiguous areas
- Eyedropper tool for sampling colors from the canvas
- Color picker for stroke selection
- Layer selection and opacity controls
- Adjustable line width
- Undo/redo support
- Bucket fill tool for coloring regions
- Eyedropper tool for sampling colors
- Image import/export
- Multi-layer support
- Zoom and pan controls


### Keyboard Shortcuts

- `P`: Pencil
- `R`: Rectangle
- `L`: Line
- `C`: Circle
- `T`: Text
- `E`: Eraser
- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z`: Redo
- `Ctrl++`: Zoom in
- `Ctrl+-`: Zoom out
- `Ctrl+0`: Reset view
- Arrow keys: Pan canvas


## Usage

Draw on the canvas using a mouse, a single finger, or a stylus. Pointer events
enable touch input. Zoom using the mouse wheel or `Ctrl` `+`/`-` and pan with
the middle mouse button or arrow keys. Multi-touch gestures such as
pinch-to-zoom are handled by the browser and are not yet supported by the app.
At least one `<canvas>` element with a 2D rendering context must be present in
the DOM before calling `initEditor()`; initialization will throw an error
otherwise.

The editor also expects the following toolbar elements to exist:

```html
<input type="color" id="colorPicker" />
<input type="number" id="lineWidth" />
<input type="checkbox" id="fillMode" />

<button id="pencil"></button>
<button id="eraser"></button>
<button id="rectangle"></button>
<button id="line"></button>
<button id="circle"></button>
<button id="text"></button>
<button id="bucket"></button>
<button id="eyedropper"></button>

<button id="undo"></button>
<button id="redo"></button>
<select id="layerSelect"></select>
<input type="file" id="imageLoader" />
<select id="formatSelect"></select>
<button id="save"></button>
```

If any of these elements are missing, `initEditor()` throws an error such as
`"Missing #bucket button"` and halts initialization.

For additional layers, opacity inputs with IDs like `layer2Opacity` control
the transparency of each canvas; these are created automatically if absent.

Call `initEditor()` only after the DOM has been populated with these elements;
the function returns an {@link EditorHandle} with a `destroy` method for
cleanup.

Layer selectors and opacity sliders are generated dynamically, enabling
switching between layers and adjusting their transparency on the fly.

## Installing Dependencies

Install the project dependencies using npm:

```bash
npm ci
```

## Building

Compile the project assets:

```bash
npm run build
```

## Linting

Check the code style with:

```bash
npm run lint
```

## Running Tests

Execute the test suite:

```bash
npm test
```

Open `index.html` in your browser to use the app.

## Deployment

Build the project and publish the `dist` directory to the `gh-pages` branch to deploy on GitHub Pages.

## Lifecycle

`initEditor()` returns an object containing the editor instance and a `destroy` function.
Call this function when the editor is no longer needed to remove all event listeners and release resources.

```ts
const { editor, destroy } = initEditor();
// ...use editor...
destroy(); // cleanup when done
```
