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
}

module.exports = Progress;