import { describe, expect, it, beforeEach, jest } from "@jest/globals";

describe("save", () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="imageLoader" />
      <button id="save"></button>
      <button id="undo"></button>
      <button id="redo"></button>
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;

    canvas.getContext = jest
      .fn()
      .mockReturnValue({ scale: jest.fn() } as unknown as CanvasRenderingContext2D) as unknown as typeof canvas.getContext;

    canvas.toDataURL = jest
      .fn()
      .mockReturnValue("data:image/png;base64,TEST") as unknown as typeof canvas.toDataURL;
  });

  it("downloads canvas as PNG when save clicked", async () => {
    const clickMock = jest.fn();

    const createElementOrig = document.createElement.bind(document);
    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        const element = createElementOrig(tagName) as HTMLElement;
        if (tagName.toLowerCase() === "a") {
          (element as HTMLAnchorElement).click = clickMock;
        }
        return element;
      });

    await import("../src/index");

    (document.getElementById("save") as HTMLButtonElement).click();

    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(clickMock).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });
});

