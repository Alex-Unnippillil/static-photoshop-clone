# Photoshop Clone

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

A simple Photoshop-like web application built with HTML5 Canvas, CSS, and JavaScript.

## Features

- Pencil tool for freehand drawing
- Rectangle tool for shape creation
- Color picker for stroke selection
- Adjustable line width
- Undo/redo support

## Planned Features

- Eraser tool for removing parts of your drawing
- Line tool for straight lines
- Circle tool for perfect curves
- Text insertion
- Load and save images on the canvas

## Usage

Select a tool from the toolbar to begin drawing.

## Build and Test

Run the following commands to compile the project and execute tests:

```bash
npm run build
npm test
```

Open `index.html` in your browser to use the app.

## Lifecycle

The `Editor` instance returned from `initEditor()` attaches several event listeners. When the editor is no longer needed, call `editor.destroy()` to remove those listeners and clean up resources.
