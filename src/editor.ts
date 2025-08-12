let canvas, ctx, colorPicker, lineWidth, imageLoader, saveBtn;
const toolButtons = {};
let drawing = false;
let startX = 0;
let startY = 0;
let currentTool = "pencil";
const MAX_HISTORY = 20;
const undoStack: ImageData[] = [];
const redoStack: ImageData[] = [];

export function saveState() {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
}

function restoreState(stack: ImageData[], oppositeStack: ImageData[]) {
  if (stack.length) {
    oppositeStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (oppositeStack.length > MAX_HISTORY) oppositeStack.shift();
    const imgData = stack.pop();
    if (imgData) ctx.putImageData(imgData, 0, 0);
  }
}

function handleMouseDown(e) {
  drawing = true;
  startX = e.offsetX;
  startY = e.offsetY;

  if (currentTool === "text") {
    const text = prompt("Enter text:");
    if (text) {
      saveState();
      ctx.fillStyle = colorPicker.value;
      ctx.font = `${lineWidth.value * 5}px sans-serif`;
      ctx.fillText(text, startX, startY);
    }
    drawing = false;
    return;
  }

  saveState();
  if (currentTool === "pencil" || currentTool === "eraser") {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
}

function handleMouseMove(e) {
  if (!drawing) return;
  const x = e.offsetX;
  const y = e.offsetY;
  ctx.lineWidth = lineWidth.value;
  ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : colorPicker.value;
  ctx.fillStyle = colorPicker.value;

  if (currentTool === "pencil" || currentTool === "eraser") {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function handleMouseUp(e) {
  if (!drawing) return;
  drawing = false;
  const x = e.offsetX;
  const y = e.offsetY;

  ctx.lineWidth = lineWidth.value;
  ctx.strokeStyle = colorPicker.value;
  ctx.fillStyle = colorPicker.value;

  switch (currentTool) {
    case "rectangle":
      ctx.strokeRect(startX, startY, x - startX, y - startY);
      break;
    case "line":
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
      break;
    case "circle": {
      const radius = Math.hypot(x - startX, y - startY);
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }
}

function handleImageLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      saveState();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = evt.target.result as string;
  };
  reader.readAsDataURL(file);
}

function handleSave() {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const offscreen = document.createElement("canvas");
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;
  offCtx.putImageData(data, 0, 0);
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

export function initEditor() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  colorPicker = document.getElementById("colorPicker");
  lineWidth = document.getElementById("lineWidth");
  imageLoader = document.getElementById("imageLoader");
  saveBtn = document.getElementById("save");

  document.getElementById("undo").onclick = () =>
    restoreState(undoStack, redoStack);
  document.getElementById("redo").onclick = () =>
    restoreState(redoStack, undoStack);

  ["pencil", "eraser", "rectangle", "line", "circle", "text"].forEach(
    (tool) => {
      const btn = document.getElementById(tool);
      toolButtons[tool] = btn;
      btn.onclick = () => (currentTool = tool);
    },
  );

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);

  imageLoader.addEventListener("change", handleImageLoad);
  saveBtn.onclick = handleSave;
}
