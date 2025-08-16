import { initEditor } from "./editor";

const handles = [initEditor("layer1"), initEditor("layer2")];
window.addEventListener("beforeunload", () =>
  handles.forEach((h) => h.destroy()),
);

