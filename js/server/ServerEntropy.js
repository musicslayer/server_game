class ServerEntropy {
    entropyArray = Array.from({length: 64}, () => 0);

    serialize(writer) {
        writer.beginObject()
            .serializeArray("entropyArray", this.entropyArray)
        .endObject();
    }

    static deserialize(reader) {
        let serverEntropy = new ServerEntropy();

        reader.beginObject();
        let entropyArray = reader.deserializeArray("entropyArray", "Number");
        reader.endObject();

        serverEntropy.entropyArray = entropyArray;

        return serverEntropy;
    }
}

module.exports = ServerEntropy;