import { initEditor } from "./editor";

// Initialize a single editor instance for the existing #canvas element
// and clean it up when the page unloads.
const handle = initEditor();
window.addEventListener("beforeunload", () => handle.destroy());

