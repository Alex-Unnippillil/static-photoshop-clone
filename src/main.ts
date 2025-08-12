import { Editor } from './core/Editor';
import { PencilTool } from './tools/PencilTool';
import { RectangleTool } from './tools/RectangleTool';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const editor = new Editor(canvas, {
    pencil: new PencilTool(),
    rectangle: new RectangleTool(),
  });

  const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
  const lineWidth = document.getElementById('lineWidth') as HTMLInputElement;

  colorPicker.addEventListener('change', () => (editor.color = colorPicker.value));
  lineWidth.addEventListener('change', () => (editor.lineWidth = parseInt(lineWidth.value, 10)));

  (document.getElementById('pencil') as HTMLButtonElement).onclick = () => editor.useTool('pencil');
  (document.getElementById('rectangle') as HTMLButtonElement).onclick = () => editor.useTool('rectangle');

  (document.getElementById('undo') as HTMLButtonElement).onclick = () => editor.undo();
  (document.getElementById('redo') as HTMLButtonElement).onclick = () => editor.redo();
});
