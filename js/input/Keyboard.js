const Server = require("../server/Server.js");

class Keyboard {
    _e = 69;

    _spacebar = 32;
    _t = 84;

    _leftarrow = 37;
    _uparrow = 38;
    _rightarrow = 39;
    _downarrow = 40;

    _w = 87;
    _a = 65;
    _s = 83;
    _d = 68;

    _i = 73;
    _k = 75;

    // TODO  _f _g _h could be inventory management.

    flagAction;
    flagTeleportHome;
    flagExperienceBoost;

    flagMoveDown;
    flagMoveUp;
    flagMoveLeft;
    flagMoveRight;

    flagScreenDown;
    flagScreenUp;
    flagScreenLeft;
    flagScreenRight;

    flagMapDown;
    flagMapUp;

    inputAction;
    inputTeleportHome;
    inputExperienceBoost;

    inputMoveDown;
    inputMoveUp;
    inputMoveLeft;
    inputMoveRight;

    inputScreenDown;
    inputScreenUp;
    inputScreenLeft;
    inputScreenRight;

    inputMapDown;
    inputMapUp;

    constructor() {
        this.inputAction = this._spacebar;
        this.inputTeleportHome = this._t;
        this.inputExperienceBoost = this._e;

        this.inputMoveDown = this._downarrow;
        this.inputMoveUp = this._uparrow;
        this.inputMoveLeft = this._leftarrow;
        this.inputMoveRight = this._rightarrow;

        this.inputScreenDown = this._s;
        this.inputScreenUp = this._w;
        this.inputScreenLeft = this._a;
        this.inputScreenRight = this._d;

        this.inputMapUp = this._i;
        this.inputMapDown = this._k;

        Server.addRefresh(() => { this.resetFlags() });
    }

    resetFlags() {
        this.flagAction = false;
        this.flagTeleportHome = false;
        this.flagExperienceBoost = false;
        this.flagMoveDown = false;
        this.flagMoveUp = false;
        this.flagMoveLeft = false;
        this.flagMoveRight = false;
        this.flagScreenDown = false;
        this.flagScreenUp = false;
        this.flagScreenLeft = false;
        this.flagScreenRight = false;
        this.flagMapDown = false;
        this.flagMapUp = false;
    }

    processKey(key) {
        let input;

        // Player Action
        if(key === this.inputAction && !this.flagAction) {
            this.flagAction = true;
            input = "action";
        }

        // Player Teleport Home
        else if(key === this.inputTeleportHome && !this.flagTeleportHome) {
            this.flagTeleportHome = true;
            input = "teleport_home";
        }

        // Player Experience Boost
        else if(key === this.inputExperienceBoost && !this.flagExperienceBoost) {
            this.flagExperienceBoost = true;
            input = "experience_boost";
        }

        // Move Position
        else if(key === this.inputMoveUp && !this.flagMoveUp) {
            this.flagMoveUp = true;
            input = "move_up";
        }
        else if(key === this.inputMoveDown && !this.flagMoveDown) {
            this.flagMoveDown = true;
            input = "move_down";
        }
        else if(key === this.inputMoveLeft && !this.flagMoveLeft) {
            this.flagMoveLeft = true;
            input = "move_left";
        }
        else if(key === this.inputMoveRight && !this.flagMoveRight) {
            this.flagMoveRight = true;
            input = "move_right";
        }

        // Move Screens
        else if(key === this.inputScreenUp && !this.flagScreenUp) {
            this.flagScreenUp = true;
            input = "screen_up";
        }
        else if(key === this.inputScreenDown && !this.flagScreenDown) {
            this.flagScreenDown = true;
            input = "screen_down";
        }
        else if(key === this.inputScreenLeft && !this.flagScreenLeft) {
            this.flagScreenLeft = true;
            input = "screen_left";
        }
        else if(key === this.inputScreenRight && !this.flagScreenRight) {
            this.flagScreenRight = true;
            input = "screen_right";
        }

        // Move Maps
        else if(key === this.inputMapUp && !this.flagMapUp) {
            this.flagMapUp = true;
            input = "map_up";
        }
        else if(key === this.inputMapDown && !this.flagMapDown) {
            this.flagMapDown = true;
            input = "map_down";
        }

        return input;
    }

    /*
    processKey(key, player) {
        // Player Action
        if(key === this.inputAction && !this.flagAction) {
            this.flagAction = true;
            player.action();
        }

        // Player Teleport Home
        else if(key === this.inputTeleportHome && !this.flagTeleportHome) {
            this.flagTeleportHome = true;
            player.teleportHome();
        }

        // Player Experience Boost
        else if(key === this.inputExperienceBoost && !this.flagExperienceBoost) {
            this.flagExperienceBoost = true;
            player.experienceBoost();
        }

        // Move Position
        else if(key === this.inputMoveLeft && !this.flagMoveLeft) {
            this.flagMoveLeft = true;
            player.moveLeft();
        }
        else if(key === this.inputMoveUp && !this.flagMoveUp) {
            this.flagMoveUp = true;
            player.moveUp();
        }
        else if(key === this.inputMoveRight && !this.flagMoveRight) {
            this.flagMoveRight = true;
            player.moveRight();
        }
        else if(key === this.inputMoveDown && !this.flagMoveDown) {
            this.flagMoveDown = true;
            player.moveDown();
        }

        // Move Screens
        else if(key === this.inputScreenUp && !this.flagScreenUp) {
            this.flagScreenUp = true;
            player.screenUp();
        }
        else if(key === this.inputScreenLeft && !this.flagScreenLeft) {
            this.flagScreenLeft = true;
            player.screenLeft();
        }
        else if(key === this.inputScreenDown && !this.flagScreenDown) {
            this.flagScreenDown = true;
            player.screenDown();
        }
        else if(key === this.inputScreenRight && !this.flagScreenRight) {
            this.flagScreenRight = true;
            player.screenRight();
        }

        // Move Maps
        else if(key === this.inputMapUp && !this.flagMapUp) {
            this.flagMapUp = true;
            player.mapUp();
        }
        else if(key === this.inputMapDown && !this.flagMapDown) {
            this.flagMapDown = true;
            player.mapDown();
        }
    }
    */
}

module.exports = Keyboard;