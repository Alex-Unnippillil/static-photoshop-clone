import { initEditor } from "./editor";

const { destroy } = initEditor();
window.addEventListener("beforeunload", destroy);

