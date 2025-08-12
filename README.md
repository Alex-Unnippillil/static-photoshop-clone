# Photoshop Clone

A simple Photoshop-like web application built with HTML5 Canvas, CSS, and JavaScript.

## Features

- Pencil and eraser tools
- Rectangle, line, and circle drawing
- Text insertion
- Color picker and line width control
- Undo/redo support
- Load external images onto the canvas
- Save canvas as PNG

## Memory considerations

Undo/redo history stores `ImageData` snapshots. Each snapshot keeps raw pixel
data (width × height × 4 bytes), so retaining many entries can consume a large
amount of memory. The editor caps history at 20 states to avoid excessive
usage.

Open `index.html` in your browser to use the app.
