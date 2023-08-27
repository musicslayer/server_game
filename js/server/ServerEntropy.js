class ServerEntropy {
    entropyArray = Array.from({length: 64}, () => 0n);

    processBoolean(b) {
        // Flip the sign of every other element, offset by the boolean.
        for(let i = b ? 0 : 1; i < this.entropyArray.length; i += 2) {
            this.entropyArray[i] = -this.entropyArray[i];
        }
    }

    processNumber(n) {
        // Shift the values of the array by the number.
        let shift = n % this.entropyArray.length;
        if(shift === 0) {
            // This is a no-op so just skip for better performance.
            return;
        }
        
        let newFront = this.entropyArray.slice(shift, this.entropyArray.length);
        let newBack = this.entropyArray.slice(0, shift);
        this.entropyArray = newFront.concat(newBack);
    }

    processString(s, offset) {
        // For each character, add its code value to the array.
        for(let i = 0; i < s.length; i++) {
            let code = BigInt(s.charCodeAt(i));
            this.entropyArray[(offset + i) % this.entropyArray.length] += code;
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serializeArray("entropyArray", this.entropyArray)
        .endObject();
    }

    static deserialize(reader) {
        let serverEntropy;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            serverEntropy = new ServerEntropy();
            serverEntropy.entropyArray = reader.deserializeArray("entropyArray", "BigInt");
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return serverEntropy;
    }
}

module.exports = ServerEntropy;