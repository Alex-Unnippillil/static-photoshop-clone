const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let startX = 0;
let startY = 0;
let currentTool = 'pencil';
const undoStack = [];
const redoStack = [];

function saveState() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 50) undoStack.shift();
  redoStack.length = 0;
}

function restoreState(stack, oppositeStack) {
  if (stack.length) {
    oppositeStack.push(canvas.toDataURL());
    const img = new Image();
    img.src = stack.pop();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }
}

document.getElementById('undo').onclick = () => restoreState(undoStack, redoStack);
document.getElementById('redo').onclick = () => restoreState(redoStack, undoStack);

canvas.addEventListener('mousedown', e => {
  drawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
  if (currentTool === 'pencil' || currentTool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    saveState();
  } else if (currentTool === 'text') {
    const text = prompt('Enter text:');
    if (text) {
      saveState();
      ctx.fillStyle = document.getElementById('colorPicker').value;
      ctx.font = `${document.getElementById('lineWidth').value * 5}px sans-serif`;
      ctx.fillText(text, startX, startY);
    }
    drawing = false;
  } else {
    saveState();
  }
});

canvas.addEventListener('mousemove', e => {
  if (!drawing) return;
  const x = e.offsetX;
  const y = e.offsetY;
  ctx.lineWidth = document.getElementById('lineWidth').value;
  ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : document.getElementById('colorPicker').value;
  ctx.fillStyle = document.getElementById('colorPicker').value;

  if (currentTool === 'pencil' || currentTool === 'eraser') {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
});

canvas.addEventListener('mouseup', e => {
  if (!drawing) return;
  drawing = false;
  const x = e.offsetX;
  const y = e.offsetY;

  ctx.lineWidth = document.getElementById('lineWidth').value;
  ctx.strokeStyle = document.getElementById('colorPicker').value;
  ctx.fillStyle = document.getElementById('colorPicker').value;

  switch (currentTool) {
    case 'rectangle':
      ctx.strokeRect(startX, startY, x - startX, y - startY);
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
      break;
    case 'circle':
      const radius = Math.hypot(x - startX, y - startY);
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
});

['pencil','eraser','rectangle','line','circle','text'].forEach(tool => {
  document.getElementById(tool).onclick = () => currentTool = tool;
});


document.getElementById('imageLoader').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const img = new Image();
    img.onload = () => {
      saveState();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
