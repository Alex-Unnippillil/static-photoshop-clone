import type { Editor } from "../core/Editor.js";
import type { Tool } from "../tools/Tool.js";
import { listen, requireElement, type Cleanup } from "./domHelpers.js";

export interface ToolControlsInput {
  toolConstructors: Record<string, new () => Tool>;
  editorToolConstructors: Map<Editor, new () => Tool>;
  setActiveToolCtor: (ctor: new () => Tool) => void;
  getActiveToolCtor: () => new () => Tool;
  getEditor: () => Editor;
  cleanups: Cleanup[];
}

export interface ToolControlsOutput {
  syncActiveButtonFromTool: (tool: Tool) => void;
  applyCurrentToolToEditor: (editor: Editor) => void;
  destroy: Cleanup;
}

export function initToolControls(input: ToolControlsInput): ToolControlsOutput {
  const { toolConstructors, editorToolConstructors, cleanups } = input;
  const toolButtons: Record<string, HTMLButtonElement> = {};
  Object.entries(toolConstructors).forEach(([id]) => {
    toolButtons[id] = requireElement<HTMLButtonElement>(id, "button");
  });

  let activeButton: HTMLButtonElement | null = null;
  const setActiveButton = (btn: HTMLButtonElement | null) => {
    if (activeButton) activeButton.classList.remove("active");
    if (btn) btn.classList.add("active");
    activeButton = btn;
  };

  const buttonForTool = (tool: Tool): HTMLButtonElement | null => {
    for (const [id, ToolCtor] of Object.entries(toolConstructors)) {
      if (tool instanceof ToolCtor) return toolButtons[id];
    }
    return null;
  };

  Object.entries(toolConstructors).forEach(([id, ToolCtor]) =>
    listen(toolButtons[id], "click", () => input.getEditor().setTool(new ToolCtor()), cleanups),
  );

  return {
    syncActiveButtonFromTool: (tool) => {
      const ctor = tool.constructor as new () => Tool;
      editorToolConstructors.set(input.getEditor(), ctor);
      input.setActiveToolCtor(ctor);
      setActiveButton(buttonForTool(tool));
    },
    applyCurrentToolToEditor: (editor) => {
      const ToolCtor = editorToolConstructors.get(editor) ?? input.getActiveToolCtor();
      editor.setTool(new ToolCtor());
    },
    destroy: () => {},
  };
}
