const crypto = require("crypto");

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
        return this.nextInt(BigInt(max));
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
        return this.seed >> (48n - bits);

        // TODO Should be 
        // return this.seed >>> (48n - bits);
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

module.exports = ServerRNG;