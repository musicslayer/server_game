const crypto = require("crypto");

// BigInt can handle an arbitrary number of bits, but we want to use 64 bits to match the long data type in Java.
const NUM_BITS = 64;

class ServerRNG {
    // This is a BigInt so that we can handle larger numbers.
    seed;

    setInitialSeed(s) {
        let seedBuffer = crypto.createHash("sha512").update(Buffer.from(s, "utf-8")).digest();
        seedBuffer = Array.from(seedBuffer, (x) => BigInt(x));
        this.seed = this.reduce(seedBuffer);
    }

    reduce(arr) {
        let m = 1n;
        let f = 2n;
        let t = 0n;
        for(let a of arr) {
            t += m * a;
            m *= f;
        }

        return t;
    }

    getRandomInteger(arr, max) {
        this.seed += this.reduce(arr);
        return Number(this.nextInt(BigInt(max)));
    }

    nextInt(n) {
        // Returns a random int [0, n)
        if((n & -n) === n) { // i.e., n is a power of 2
            return (n * this.next(31n)) >> 31n;
        }
    
        let bits;
        let val;
        do {
            bits = this.next(31n);
            val = bits % n;
        }
        while(bits - val + (n - 1n) < 0n);

        return val;
    }

    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & 281474976710655n;
        return unsignedRightShift(this.seed, 48n - bits);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("seed", this.seed)
        .endObject();
    }

    static deserialize(reader) {
        let serverRNG;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            serverRNG = new ServerRNG();
            serverRNG.seed = reader.deserialize("seed", "BigInt");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return serverRNG;
    }
}

function unsignedRightShift(value, shift) {
    // Implement >>> for BigInt.
    let result;

    if(value >= 0) {
        // >> and >>> are the same.
        result = value >> shift;
    }
    else {
        // Manually perform the unsigned shift by converting the value into a binary string.
        let n = -value - 1n;
        let bin = n.toString(2).padStart(NUM_BITS, "0");
        let binFlip = bin.split("").reduce((a, b) => a + (1 - Number(b)), "")
        let binShift = "0".repeat(Number(shift)) + binFlip.substring(0, binFlip.length - Number(shift));
        result = BigInt("0b" + binShift);
    }

    return result;
}

module.exports = ServerRNG;