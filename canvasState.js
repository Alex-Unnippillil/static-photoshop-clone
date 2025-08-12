export default class CanvasState {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currentTool = null;
    this.undoStack = [];
    this.redoStack = [];
  }

  setTool(tool) {
    this.currentTool = tool;
  }
}
