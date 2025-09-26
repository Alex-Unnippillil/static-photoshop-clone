import { initEditor } from "./editor.js";
import { AutosaveManager } from "./core/AutosaveManager.js";

const handle = initEditor();

const autosaveIntervalInput = document.getElementById(
  "autosaveInterval",
) as HTMLInputElement | null;
const quotaWarningInput = document.getElementById(
  "quotaWarning",
) as HTMLInputElement | null;
const autosaveStatus = document.getElementById(
  "autosaveStatus",
) as HTMLElement | null;

const autosave = new AutosaveManager(handle, {
  intervalInput: autosaveIntervalInput,
  quotaWarningInput,
  statusElement: autosaveStatus,
});

async function restoreSession() {
  const session = await autosave.getLatestSession();
  if (!session?.state) return;
  const resume = window.confirm("Restore your last editing session?");
  if (resume) {
    await handle.restoreState(session.state);
    if (autosaveStatus) {
      autosaveStatus.textContent = "Session restored";
    }
  } else {
    await autosave.clearLatestSession();
  }
}

void (async () => {
  await restoreSession();
  await autosave.start();
})();

window.addEventListener("beforeunload", () => {
  void autosave.performSave();
  autosave.destroy();
  handle.destroy();
});
