class Util {
    static getDirectionalShift(direction) {
        let shiftArray = [0, 0];
    
        if(direction === "up") {
            shiftArray = [0, -1];
        }
        else if(direction === "down") {
            shiftArray = [0, 1];
        }
        else if(direction === "left") {
            shiftArray = [-1, 0];
        }
        else if(direction === "right") {
            shiftArray = [1, 0];
        }
    
        return shiftArray;
    }
}

module.exports = Util;