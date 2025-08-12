# Photoshop Clone

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

A simple Photoshop-like web application built with HTML5 Canvas, CSS, and JavaScript.

## Features

- Pencil tool for freehand drawing
- Rectangle tool for shape creation
- Color picker for stroke selection
- Adjustable line width
- Undo/redo support

- Text insertion
- Load and save images on the canvas

## Usage



## Build and Test

Run the following commands to compile the project and execute tests:

```bash
npm run build
npm test
```

Open `index.html` in your browser to use the app.

## Lifecycle

`initEditor()` returns an object containing the editor instance and a `destroy` function.
Call this function when the editor is no longer needed to remove all event listeners and release resources.

```ts
const { editor, destroy } = initEditor();
// ...use editor...
destroy(); // cleanup when done
```
