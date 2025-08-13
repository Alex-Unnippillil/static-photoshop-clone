import { initEditor } from "./editor";

const editor = initEditor();
window.addEventListener("beforeunload", () => editor.destroy());

