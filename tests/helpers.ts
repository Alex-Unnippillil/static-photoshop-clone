export interface PreviewCanvasMock {
  ctx: jest.Mocked<CanvasRenderingContext2D>;
  spy: jest.SpyInstance;
  restore(): void;
}

export function mockPreviewCanvas(): PreviewCanvasMock {
  const previewCtx = {
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    setLineDash: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    strokeRect: jest.fn(),
    fillRect: jest.fn(),
    ellipse: jest.fn(),
    arc: jest.fn(),
    closePath: jest.fn(),
    setTransform: jest.fn(),
    scale: jest.fn(),
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: "#000",
    fillStyle: "#000",
  } as unknown as jest.Mocked<CanvasRenderingContext2D>;

  const originalCreateElement = document.createElement.bind(document);
  const spy = jest
    .spyOn(document, "createElement")
    .mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "canvas") {
        (element as HTMLCanvasElement).getContext = jest
          .fn()
          .mockReturnValue(previewCtx);
        (element as HTMLCanvasElement).getBoundingClientRect = () => ({
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        });
      }
      return element;
    });

  return {
    ctx: previewCtx,
    spy,
    restore() {
      spy.mockRestore();
    },
  };
}
