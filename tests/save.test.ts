import { initEditor } from "../src/editor.js";

describe("save button", () => {
  it("calls toDataURL on click", () => {
    window.localStorage.clear();
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
      <select id="formatSelect"></select>
      <div id="jpegQualityGroup" hidden>
        <input
          id="jpegQuality"
          type="range"
          min="10"
          max="100"
          step="5"
          value="90"
        />
        <output id="jpegQualityValue">90%</output>
      </div>
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

    const click = jest.fn();
    const anchor = { href: "", download: "", click } as any;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((
        (tagName: string, options?: ElementCreationOptions) => {
          if (tagName === "a") {
            return anchor as unknown as HTMLElement;
          }
          return originalCreateElement(tagName, options);
        }
      ) as typeof document.createElement);

    const handle = initEditor();

    (document.getElementById("save") as HTMLButtonElement).click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(click).toHaveBeenCalled();

    handle.destroy();
    createElementSpy.mockRestore();
  });

  it("supports selecting jpeg format", () => {
    window.localStorage.clear();
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
      <select id="formatSelect"></select>
      <div id="jpegQualityGroup" hidden>
        <input
          id="jpegQuality"
          type="range"
          min="10"
          max="100"
          step="5"
          value="90"
        />
        <output id="jpegQualityValue">90%</output>
      </div>
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

    const click = jest.fn();
    const anchor = { href: "", download: "", click } as any;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((
        (tagName: string, options?: ElementCreationOptions) => {
          if (tagName === "a") {
            return anchor as unknown as HTMLElement;
          }
          return originalCreateElement(tagName, options);
        }
      ) as typeof document.createElement);

    const handle = initEditor();

    const select = document.getElementById("formatSelect") as HTMLSelectElement;
    select.value = "jpeg";
    select.dispatchEvent(new Event("change"));

    (document.getElementById("save") as HTMLButtonElement).click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.9);
    expect(anchor.download).toBe("canvas.jpg");
    expect(click).toHaveBeenCalled();

    handle.destroy();
    createElementSpy.mockRestore();
  });
});
