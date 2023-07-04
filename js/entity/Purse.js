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
            .serialize("maxGoldTotal", this.maxGoldTotal)
            .serialize("goldTotal", this.goldTotal)
        .endObject();
    }

    static deserialize(reader) {
        let purse = new Purse();

        reader.beginObject();
        let maxGoldTotal = reader.deserialize("maxGoldTotal", "Number");
        let goldTotal = reader.deserialize("goldTotal", "Number");
        reader.endObject();

        purse.maxGoldTotal = maxGoldTotal;
        purse.goldTotal = goldTotal;

        return purse;
    }
}

module.exports = Purse;