import { initEditor } from "./editor";

const editor = initEditor();

const saveButton = document.getElementById("save");
saveButton?.addEventListener("click", () => {
  const dataUrl = editor.canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "canvas.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

