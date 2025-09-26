import { initEditor, type EditorHandle } from "../src/editor.js";
import { expectNoAxeViolations } from "./utils/axe.js";
import { renderAccessibleEditorDom } from "./utils/dom.js";

describe("keyboard shortcuts dialog", () => {
  let handle: EditorHandle | null = null;

  afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = "";
  });

  it("opens and restores focus when closed", () => {
    renderAccessibleEditorDom();
    handle = initEditor();

    const dialog = document.getElementById("shortcutsDialog") as HTMLDialogElement;
    const openButton = document.getElementById("openShortcuts") as HTMLButtonElement;
    const closeButton = dialog.querySelector<HTMLButtonElement>("[data-dialog-close]");
    expect(closeButton).not.toBeNull();

    dialog.showModal = jest.fn(() => {
      dialog.setAttribute("open", "");
    });
    dialog.close = jest.fn(() => {
      dialog.removeAttribute("open");
      dialog.dispatchEvent(new Event("close"));
    });

    const focusSpy = jest.spyOn(openButton, "focus");

    openButton.click();
    expect(dialog.showModal).toHaveBeenCalled();
    expect(dialog.hasAttribute("open")).toBe(true);

    closeButton!.click();
    expect(dialog.close).toHaveBeenCalled();
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("has no axe-core violations when displayed", async () => {
    renderAccessibleEditorDom();
    handle = initEditor();

    const dialog = document.getElementById("shortcutsDialog");
    expect(dialog).not.toBeNull();
    dialog!.setAttribute("open", "");

    await expectNoAxeViolations(dialog!, "keyboard shortcuts dialog");
  });
});
