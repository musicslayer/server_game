import { GameScreen } from "./GameScreen.js";
import { CanvasPainter } from "./CanvasPainter.js";
import { InputManager } from "./InputManager.js";

const NUM_TILES_X = 26;
const NUM_TILES_Y = 12;
const CANVAS_BORDER_PIXELS = 10;

class GameClient {
    gameScreen;
    canvasPainter;
    inputManager;

    constructor(canvas, imageCatalog, imageScaleFactor) {
        canvas.width = NUM_TILES_X * imageScaleFactor;
        canvas.height = NUM_TILES_Y * imageScaleFactor;
        canvas.style.border = CANVAS_BORDER_PIXELS + "px solid";

        this.gameScreen = new GameScreen(canvas, CANVAS_BORDER_PIXELS, CANVAS_BORDER_PIXELS, imageScaleFactor);
        this.canvasPainter = new CanvasPainter(canvas, this.gameScreen, imageCatalog);
        this.inputManager = new InputManager(this.gameScreen);
    }
}

export { GameClient };