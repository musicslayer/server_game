class Keyboard {
    _spacebar = 32;

    _leftarrow = 37;
    _uparrow = 38;
    _rightarrow = 39;
    _downarrow = 40;

    _0 = 48;
    _1 = 49;
    _2 = 50;
    _3 = 51;
    _4 = 52;
    _5 = 53;
    _6 = 54;
    _7 = 55;
    _8 = 56;
    _9 = 57;

    _a = 65;
    _b = 66;
    _c = 67;
    _d = 68;
    _e = 69;
    _f = 70;
    _g = 71;
    _h = 72;
    _i = 73;
    _j = 74;
    _k = 75;
    _l = 76;
    _m = 77;
    _n = 78;
    _o = 79;
    _p = 80;
    _q = 81;
    _r = 82;
    _s = 83;
    _t = 84;
    _u = 85;
    _v = 86;
    _w = 87;
    _x = 88;
    _y = 89;
    _z = 90;

    _equals = 187;
    _dash = 189;

    inputMap = new Map();

    constructor(isDevMode) {
        this.inputMap.set(this._f, "inventory_previous");
        this.inputMap.set(this._g, "inventory_next");
        this.inputMap.set(this._h, "inventory_use");

        this.inputMap.set(this._spacebar, "action");
        this.inputMap.set(this._0, "teleport_home");

        this.inputMap.set(this._w, "move_up");
        this.inputMap.set(this._s, "move_down");
        this.inputMap.set(this._a, "move_left");
        this.inputMap.set(this._d, "move_right");

        if(isDevMode) {
            this.inputMap.set(this._dash, "kill");
            this.inputMap.set(this._equals, "revive");

            this.inputMap.set(this._z, "boost_experience");
            this.inputMap.set(this._x, "boost_health");
            this.inputMap.set(this._c, "boost_mana");
            this.inputMap.set(this._q, "add_gold");
            this.inputMap.set(this._e, "invincible_on");

            this.inputMap.set(this._i, "screen_up");
            this.inputMap.set(this._k, "screen_down");
            this.inputMap.set(this._j, "screen_left");
            this.inputMap.set(this._l, "screen_right");

            this.inputMap.set(this._m, "map_up");
            this.inputMap.set(this._n, "map_down");
        }
    }

    processKeyPress(keys) {
        let inputs = [];

        for(let key of keys) {
            inputs.push(this.inputMap.get(key));
        }

        return inputs;
    }
}

module.exports = Keyboard;