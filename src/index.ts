
const handle = initEditor();
window.addEventListener("beforeunload", () => handle.destroy());
