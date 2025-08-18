import { initEditor } from "./editor";

const handle = initEditor();
window.addEventListener("beforeunload", () => handle.destroy());
