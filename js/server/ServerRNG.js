const crypto = require("crypto");

class ServerRNG {
    seed;

    setInitialSeed(s) {
        let seedBuffer = crypto.createHash("sha256").update(Buffer.from(s, "utf-8")).digest();
        this.seed = this.reduce(seedBuffer);
    }

    reduce(arr) {
        let m = 1;
        let f = 2;
        let t = 0;
        //for(let a of arr) {
        for(let i = 0; i < 16; i++) {
            t += m * arr[i];
            m *= f;
        }

        return t;
    }

    getRandomInteger(n, arr, max) {
        this.seed += this.reduce(arr) + n;
        return this.nextInt(max);
    }

    nextInt(n) {
        // Returns a random int [0, n)
        if((n & -n) === n) { // i.e., n is a power of 2
            return ((n * this.next(31)) >> 31);
        }
    
        let bits;
        let val;
        do {
            bits = this.next(3);
            val = bits % n;
        }
        while(bits - val + (n - 1) < 0);

        return val;
    }

    next(bits) {
        this.seed = (this.seed * 0x5DEECE66D + 0xB) & 281474976710655;
        return this.seed >>> (48 - bits);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("seed", this.seed)
        .endObject();
    }

    static deserialize(reader) {
        let serverRNG = new ServerRNG();

        reader.beginObject();
        let seed = reader.deserialize("seed", "Number");
        reader.endObject();

        serverRNG.seed = seed;

        return serverRNG;
    }
}

module.exports = ServerRNG;