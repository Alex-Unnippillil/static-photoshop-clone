import { initEditor, type EditorHandle } from "../src/editor.js";
import { expectNoAxeViolations } from "./utils/axe.js";
import { renderAccessibleEditorDom } from "./utils/dom.js";

describe("toolbar accessibility", () => {
  let handle: EditorHandle | null = null;

  afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = "";
  });

  it("has no axe-core violations", async () => {
    renderAccessibleEditorDom();

    handle = initEditor();

    const toolbar = document.getElementById("toolbar");
    expect(toolbar).not.toBeNull();
    await expectNoAxeViolations(toolbar!, "toolbar");
  });
});
