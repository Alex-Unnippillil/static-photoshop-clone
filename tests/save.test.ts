import { initEditor } from "../src/editor.js";

describe("save button", () => {
  it("calls toDataURL on click", () => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
        <input id="lineWidth" value="2" />
        <input id="fillMode" type="checkbox" />
        <select id="fontFamily"><option value="sans-serif"></option></select>
        <input id="fontSize" value="16" />
        <button id="save"></button>
    `;

      const canvas = document.getElementById("canvas") as HTMLCanvasElement;
      const ctx = { setTransform: jest.fn(), scale: jest.fn(), getImageData: jest.fn(), putImageData: jest.fn(), clearRect: jest.fn() } as any;
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
      jest.spyOn(document, "createElement").mockReturnValue(anchor);

    const handle = initEditor();

    (document.getElementById("save") as HTMLButtonElement).click();
      expect(canvas.toDataURL).toHaveBeenCalledWith("image/png", undefined);
    expect(click).toHaveBeenCalled();

    handle.destroy();
  });

  it("supports selecting jpeg format", () => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
        <input id="lineWidth" value="2" />
        <input id="fillMode" type="checkbox" />
        <select id="fontFamily"><option value="sans-serif"></option></select>
        <input id="fontSize" value="16" />
        <select id="formatSelect"><option value="png">PNG</option><option value="jpeg" selected>JPEG</option></select>
        <button id="save"></button>
    `;

      const canvas = document.getElementById("canvas") as HTMLCanvasElement;
      const ctx = { setTransform: jest.fn(), scale: jest.fn(), getImageData: jest.fn(), putImageData: jest.fn(), clearRect: jest.fn() } as any;
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
    jest.spyOn(document, "createElement").mockReturnValue(anchor);

    const handle = initEditor();

    (document.getElementById("save") as HTMLButtonElement).click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.9);
    expect(anchor.download).toBe("canvas.jpg");
    expect(click).toHaveBeenCalled();

    handle.destroy();
  });
});
