export function renderAccessibleEditorDom() {
  document.body.innerHTML = `
    <div id="toolbar" role="toolbar" aria-label="Drawing controls">
      <div class="group">
        <label class="visually-hidden" for="colorPicker">Stroke color</label>
        <input type="color" id="colorPicker" value="#000000" aria-describedby="colorPickerHint" />
        <span id="colorPickerHint" class="visually-hidden">Choose the drawing color.</span>
        <p id="colorHistoryLabel" class="visually-hidden">Recent colors</p>
        <ul id="colorHistory" aria-labelledby="colorHistoryLabel" aria-live="polite"></ul>
      </div>
      <div class="group">
        <label class="visually-hidden" for="lineWidth">Line width (pixels)</label>
        <input type="number" id="lineWidth" min="1" value="2" />
      </div>
      <div class="group">
        <label class="visually-hidden" for="fontFamily">Font family</label>
        <select id="fontFamily">
          <option value="sans-serif">Sans-Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>
      <div class="group">
        <label class="visually-hidden" for="fontSize">Font size (pixels)</label>
        <input type="number" id="fontSize" min="1" value="16" />
      </div>
      <div class="group">
        <input type="checkbox" id="fillMode" />
        <label for="fillMode">Fill shapes</label>
      </div>
      <button id="pencil" class="tool-button" title="Pencil">
        <img src="icons/pencil.svg" alt="Pencil" />
      </button>
      <button id="eraser" class="tool-button" title="Eraser">
        <img src="icons/eraser.svg" alt="Eraser" />
      </button>
      <button id="rectangle" class="tool-button" title="Rectangle">
        <img src="icons/rectangle-horizontal.svg" alt="Rectangle" />
      </button>
      <button id="line" class="tool-button" title="Line">
        <img src="icons/slash.svg" alt="Line" />
      </button>
      <button id="circle" class="tool-button" title="Circle">
        <img src="icons/circle.svg" alt="Circle" />
      </button>
      <button id="text" class="tool-button" title="Text">
        <img src="icons/type.svg" alt="Text" />
      </button>
      <button id="eyedropper" class="tool-button" title="Eyedropper">
        <img src="icons/pipette.svg" alt="Eyedropper" />
      </button>
      <button id="bucket" class="tool-button" title="Bucket">
        <img src="icons/paint-bucket.svg" alt="Bucket" />
      </button>
      <div class="group">
        <label class="visually-hidden" for="imageLoader">Import image</label>
        <input type="file" id="imageLoader" accept="image/*" />
      </div>
      <button id="undo" class="tool-button" title="Undo" disabled>
        <img src="icons/undo.svg" alt="Undo" />
      </button>
      <button id="redo" class="tool-button" title="Redo" disabled>
        <img src="icons/redo.svg" alt="Redo" />
      </button>
      <div class="group" role="group" aria-labelledby="layerSelectLabel">
        <label id="layerSelectLabel" for="layerSelect">Layer</label>
        <select id="layerSelect"></select>
      </div>
      <div class="group">
        <label class="visually-hidden" for="formatSelect">Export format</label>
        <select id="formatSelect">
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
      </div>
      <button id="save" class="tool-button" title="Save" type="button">
        <img src="icons/save.svg" alt="Save" />
      </button>
      <button id="openShortcuts" class="tool-button" type="button" aria-haspopup="dialog" aria-controls="shortcutsDialog">
        Shortcuts
      </button>
    </div>
    <dialog id="shortcutsDialog" aria-labelledby="shortcutsDialogTitle" aria-describedby="shortcutsDialogDescription" aria-modal="true">
      <form method="dialog">
        <h2 id="shortcutsDialogTitle">Keyboard shortcuts</h2>
        <p id="shortcutsDialogDescription">Use these keys to quickly switch tools and undo actions.</p>
        <dl>
          <div>
            <dt><kbd>P</kbd></dt>
            <dd>Select the pencil tool</dd>
          </div>
          <div>
            <dt><kbd>E</kbd></dt>
            <dd>Switch to the eraser</dd>
          </div>
          <div>
            <dt><kbd>B</kbd></dt>
            <dd>Activate the bucket fill tool</dd>
          </div>
          <div>
            <dt><kbd>Ctrl</kbd> + <kbd>Z</kbd></dt>
            <dd>Undo the previous action</dd>
          </div>
          <div>
            <dt><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></dt>
            <dd>Redo the last undone action</dd>
          </div>
        </dl>
        <div class="dialog-actions">
          <button type="button" value="close" data-dialog-close data-initial-focus>Close</button>
        </div>
      </form>
    </dialog>
    <canvas id="canvas" width="800" height="600" aria-label="Primary drawing layer"></canvas>
    <canvas id="layer2" width="800" height="600" aria-label="Secondary drawing layer"></canvas>
  `;

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const canvas2 = document.getElementById("layer2") as HTMLCanvasElement;
  const ctx = {
    setTransform: jest.fn(),
    scale: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
  } as Partial<CanvasRenderingContext2D>;
  const ctx2 = { ...ctx } as Partial<CanvasRenderingContext2D>;

  [canvas, canvas2].forEach((c, index) => {
    c.getContext = jest
      .fn()
      .mockReturnValue((index === 0 ? ctx : ctx2) as CanvasRenderingContext2D);
    c.getBoundingClientRect = () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });
  return { canvas, canvas2 };
}
