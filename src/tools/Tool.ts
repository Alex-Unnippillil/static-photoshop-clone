import { Editor } from "../core/Editor.js";

/**
 * Contract implemented by every editor tool.
 *
 * Tools can participate in a simple lifecycle in addition to responding to
 * pointer events. When a tool is selected via {@link Editor.setTool} the
 * following flow occurs:
 *
 * 1. The previously active tool receives {@link Tool.onDeactivate}.
 * 2. The new tool is assigned and receives {@link Tool.onActivate}.
 * 3. Pointer events are forwarded to the active tool until another tool is
 *    chosen.
 * 4. When the editor itself is destroyed the current tool receives
 *    {@link Tool.onDeactivate} (if it has not already) followed by
 *    {@link Tool.destroy}.
 *
 * Implementations that attach DOM listeners or allocate resources should tear
 * them down inside {@link Tool.onDeactivate} so switching away from the tool
 * does not leak resources. {@link Tool.destroy} acts as a finalizer for
 * releasing anything that outlives a single activation.
 */
export interface Tool {
  /** Optional cursor that should be displayed while the tool is active. */
  cursor?: string;

  /**
   * Invoked immediately after the tool becomes the active tool for an editor.
   * Ideal for setting up listeners that depend on the editor state.
   */
  onActivate?(editor: Editor): void;

  /** Handle pointer down events occurring on the editor's canvas. */
  onPointerDown(e: PointerEvent, editor: Editor): void;

  /** Handle pointer move events occurring on the editor's canvas. */
  onPointerMove(e: PointerEvent, editor: Editor): void;

  /** Handle pointer up events occurring on the editor's canvas. */
  onPointerUp(e: PointerEvent, editor: Editor): void;

  /**
   * Called when the tool is replaced by another tool. Implementations should
   * clean up DOM listeners or transient resources created during activation.
   */
  onDeactivate?(editor: Editor): void;

  /**
   * Final teardown hook invoked when the tool is permanently discarded. Any
   * remaining resources should be released here.
   */
  destroy?(): void;
}
