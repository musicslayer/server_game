class Progress {
    level = 1;
    experience = 0;

    doAddExperience(experience) {
        this.experience += experience;

        if(this.experience >= 100) {
            this.experience -= 100;
            this.level++; 
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("level", this.level)
            .serialize("experience", this.experience)
        .endObject();
    }

    static deserialize(reader) {
        let progress;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            progress = new Progress();
            progress.level = reader.deserialize("level", "Number");
            progress.experience = reader.deserialize("experience", "Number");
        }
        else {
            throw(new Error("Unknown version number: " + version));
        }

        reader.endObject();
        return progress;
    }
}

module.exports = Progress;