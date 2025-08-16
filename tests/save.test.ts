import { initEditor } from "../src/editor";

describe("save button", () => {
  it("calls toDataURL on click", () => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <button id="save"></button>
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = {
      scale: jest.fn(),

    } as any;
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
    const realCreate = document.createElement.bind(document);
    jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) =>
        tag === "a" ? anchor : realCreate(tag),
      );

    const handle = initEditor();

    (document.getElementById("save") as HTMLButtonElement).click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(click).toHaveBeenCalled();

    handle.destroy();
  });

  it("merges multiple layers before saving", () => {
    document.body.innerHTML = `
      <canvas id="canvas" width="100" height="100"></canvas>
      <canvas id="overlay" width="100" height="100" style="opacity:0.5"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <button id="save"></button>
    `;

    const base = document.getElementById("canvas") as HTMLCanvasElement;
    const overlay = document.getElementById("overlay") as HTMLCanvasElement;
    const ctx = { scale: jest.fn() } as any;
    base.getContext = jest.fn().mockReturnValue(ctx);
    base.toDataURL = jest.fn();
    base.getBoundingClientRect = () => ({
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

    const calls: { alpha: number; canvas: HTMLCanvasElement }[] = [];
    const tempCtx: any = {
      globalAlpha: 1,
      drawImage: jest.fn((c: HTMLCanvasElement) => {
        calls.push({ alpha: tempCtx.globalAlpha, canvas: c });
      }),
    };
    const tempCanvas: any = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => tempCtx),
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,MERGED"),
    };

    const click = jest.fn();
    const anchor = { href: "", download: "", click } as any;
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return anchor;
      if (tag === "canvas") return tempCanvas;
      return realCreate(tag);
    });

    const handle = initEditor();

    (document.getElementById("save") as HTMLButtonElement).click();

    expect(base.toDataURL).not.toHaveBeenCalled();
    expect(tempCanvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(calls).toEqual([
      { alpha: 1, canvas: base },
      { alpha: 0.5, canvas: overlay },
    ]);
    expect(click).toHaveBeenCalled();

    handle.destroy();
  });
});
