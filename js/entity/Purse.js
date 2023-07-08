class Purse {
    maxGoldTotal = 100000;
    goldTotal = 0;

    addToPurse(gold) {
        let N = Math.min(gold.stackSize, this.maxGoldTotal - this.goldTotal);

        gold.stackSize -= N;
        this.goldTotal += N;
    }

    removeFromPurse(goldAmount) {
        this.goldTotal -= goldAmount;
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("maxGoldTotal", this.maxGoldTotal)
            .serialize("goldTotal", this.goldTotal)
        .endObject();
    }

    static deserialize(reader) {
        let purse;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            purse = new Purse();
            purse.maxGoldTotal = reader.deserialize("maxGoldTotal", "Number");
            purse.goldTotal = reader.deserialize("goldTotal", "Number");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return purse;
    }
}

module.exports = Purse;