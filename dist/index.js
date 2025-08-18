import { initEditor } from "./editor.js";
const handle = initEditor();
window.addEventListener("beforeunload", () => handle.destroy());
