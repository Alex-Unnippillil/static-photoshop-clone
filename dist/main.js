import { Editor } from './core/Editor';
import { PencilTool } from './tools/PencilTool';
import { RectangleTool } from './tools/RectangleTool';
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const editor = new Editor(canvas, {
        pencil: new PencilTool(),
        rectangle: new RectangleTool(),
    });
    const colorPicker = document.getElementById('colorPicker');
    const lineWidth = document.getElementById('lineWidth');
    colorPicker.addEventListener('change', () => (editor.color = colorPicker.value));
    lineWidth.addEventListener('change', () => (editor.lineWidth = parseInt(lineWidth.value, 10)));
    document.getElementById('pencil').onclick = () => editor.useTool('pencil');
    document.getElementById('rectangle').onclick = () => editor.useTool('rectangle');
    document.getElementById('undo').onclick = () => editor.undo();
    document.getElementById('redo').onclick = () => editor.redo();
});
