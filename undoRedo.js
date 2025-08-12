export function saveState(state) {
  state.undoStack.push(state.canvas.toDataURL());
  if (state.undoStack.length > 50) state.undoStack.shift();
  state.redoStack.length = 0;
}

function restore(state, stack, oppositeStack) {
  if (stack.length) {
    oppositeStack.push(state.canvas.toDataURL());
    const img = new Image();
    img.src = stack.pop();
    img.onload = () => {
      state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
      state.ctx.drawImage(img, 0, 0);
    };
  }
}

export function undo(state) {
  restore(state, state.undoStack, state.redoStack);
}

export function redo(state) {
  restore(state, state.redoStack, state.undoStack);
}
