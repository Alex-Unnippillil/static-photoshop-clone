const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

beforeAll(() => {
  HTMLCanvasElement.prototype.toDataURL = function (
    this: HTMLCanvasElement,
    type?: string,
  ): string {
    const mime = typeof type === "string" ? type : "image/png";
    if (mime === "image/webp" || mime === "image/avif") {
      return "data:image/png;base64,MOCK";
    }
    return `data:${mime};base64,MOCK`;
  };
});

afterAll(() => {
  HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
});
