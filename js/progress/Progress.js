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
            .serialize("level", this.level)
            .serialize("experience", this.experience)
        .endObject();
    }

    static deserialize(reader) {
        let progress = new Progress();

        reader.beginObject();
        let level = reader.deserialize("level", "Number");
        let experience = reader.deserialize("experience", "Number");
        reader.endObject();

        progress.level = level;
        progress.experience = experience;

        return progress;
    }
}

module.exports = Progress;