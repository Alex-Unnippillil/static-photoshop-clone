import CanvasState from './canvasState.js';
import PencilTool from './tools/pencil.js';
import RectangleTool from './tools/rectangle.js';
import { undo, redo, saveState } from './undoRedo.js';

const canvas = document.getElementById('canvas');
const state = new CanvasState(canvas);
state.setTool(new PencilTool());

canvas.addEventListener('mousedown', e => state.currentTool?.onPointerDown(state, e));
canvas.addEventListener('mousemove', e => state.currentTool?.onPointerMove(state, e));
canvas.addEventListener('mouseup', e => state.currentTool?.onPointerUp(state, e));

document.getElementById('pencil').onclick = () => state.setTool(new PencilTool());
document.getElementById('eraser').onclick = () => state.setTool(new PencilTool(true));
document.getElementById('rectangle').onclick = () => state.setTool(new RectangleTool());

document.getElementById('undo').onclick = () => undo(state);
document.getElementById('redo').onclick = () => redo(state);

document.getElementById('imageLoader').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const img = new Image();
    img.onload = () => {
      saveState(state);
      state.ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('save').onclick = () => {
  const link = document.createElement('a');
  link.download = 'image.png';
  link.href = canvas.toDataURL();
  link.click();
};
