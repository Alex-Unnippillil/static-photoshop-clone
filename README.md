# Photoshop Clone

[![CI](https://github.com/openai/photoshop-clone/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/openai/photoshop-clone/actions/workflows/ci.yml)

A simple Photoshop-like web application built with HTML5 Canvas, CSS, and JavaScript.

## Features

- Pencil tool for freehand drawing
- Line tool for straight lines
- Rectangle tool for shape creation
- Circle tool for drawing circles and ellipses
- Text tool for adding labels
- Color picker for stroke selection
- Adjustable line width
- Undo/redo support


### Keyboard Shortcuts

- `P`: Pencil
- `R`: Rectangle
- `L`: Line
- `C`: Circle
- `T`: Text
- `E`: Eraser
- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z`: Redo


## Usage

Draw on the canvas using a mouse, a single finger, or a stylus. Pointer events
enable touch input, but multi-touch gestures such as pinch-to-zoom or panning
are handled by the browser and are not yet supported by the app.

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
