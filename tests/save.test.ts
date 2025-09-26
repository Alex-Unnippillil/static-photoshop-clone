import { initEditor } from "../src/editor.js";

describe("save button", () => {
  it("calls toDataURL on click", () => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
      <button id="bucket"></button>
      <button id="eyedropper"></button>
      <button id="magicWand"></button>
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = { scale: jest.fn(), setTransform: jest.fn() } as any;
    canvas.getContext = jest.fn().mockReturnValue(ctx);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,TEST");
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

      let anchor: HTMLAnchorElement | null = null;
      let clickSpy: jest.SpyInstance | null = null;
      jest
        .spyOn(document, "createElement")
        .mockImplementation((tag: string) => {
          const element = Document.prototype.createElement.call(
            document,
            tag,
          );
          if (tag === "a") {
            anchor = element as HTMLAnchorElement;
            clickSpy = jest
              .spyOn(anchor, "click")
              .mockImplementation(() => undefined);
          }
          return element;
        });

    const handle = initEditor();

    (document.getElementById("save") as HTMLButtonElement).click();
      expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
      expect(clickSpy).not.toBeNull();
      expect(clickSpy?.mock.calls.length).toBe(1);

      handle.destroy();
    });

  it("supports selecting jpeg format", () => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
      <button id="bucket"></button>
      <button id="eyedropper"></button>
      <button id="magicWand"></button>
      <select id="formatSelect"><option value="png">PNG</option><option value="jpeg" selected>JPEG</option></select>
      <button id="save"></button>
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = { scale: jest.fn(), setTransform: jest.fn() } as any;
    canvas.getContext = jest.fn().mockReturnValue(ctx);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/jpeg;base64,TEST");
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

      let anchor: HTMLAnchorElement | null = null;
      let clickSpy: jest.SpyInstance | null = null;
      jest
        .spyOn(document, "createElement")
        .mockImplementation((tag: string) => {
          const element = Document.prototype.createElement.call(
            document,
            tag,
          );
          if (tag === "a") {
            anchor = element as HTMLAnchorElement;
            clickSpy = jest
              .spyOn(anchor, "click")
              .mockImplementation(() => undefined);
          }
          return element;
        });

      const handle = initEditor();

      (document.getElementById("save") as HTMLButtonElement).click();
      expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.9);
      expect(anchor?.download).toBe("canvas.jpg");
      expect(clickSpy?.mock.calls.length).toBe(1);

      handle.destroy();
    });
});
