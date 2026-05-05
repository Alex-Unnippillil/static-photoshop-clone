import { initColorHistory } from "../src/editor/colorHistory.js";

test("color history renders swatches", () => {
  document.body.innerHTML = `<input id='colorPicker' value='#111111' /><div id='colorHistory'></div>`;
  initColorHistory({ cleanups: [] });
  (document.getElementById("colorPicker") as HTMLInputElement).value = "#222222";
  document.getElementById("colorPicker")!.dispatchEvent(new Event("input"));
  expect(document.querySelectorAll(".color-swatch").length).toBe(2);
});
