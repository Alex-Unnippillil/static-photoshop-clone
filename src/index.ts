import { initEditor, EditorHandle } from "./editor";

const handle: EditorHandle = initEditor();
window.addEventListener("beforeunload", handle.destroy);

