class ImageCatalog {
    imageMap = new Map();

    async createImageCatalog() {
		let zip = await this.fetchImages();
		
		for(let filePath in zip.files) {
			if(!filePath.endsWith(".png")) {
				continue;
			}
			
			// We load each image now and store it for future use.
			let blob = await zip.files[filePath].async("blob");
			let imageURL = URL.createObjectURL(blob);
			let image = new Image();
			await new Promise(r => image.onload = r, image.src = imageURL);
			
			// Images are stored using both their folder name and file name.
			// All paths will have the format "image/folder/file.png"
			let fileParts = filePath.split("/");
			let folder = fileParts[1];
			let file = fileParts[2].slice(0, -4);
			
			this.addImage(folder, file, image);
		};
    }
	
	async fetchImages() {
		// Get a zip file containing all game images from the server.
		let response = await fetch("/images");		
		let data = await response.arrayBuffer();
		let zip = new JSZip();
		await zip.loadAsync(data);
		return zip;
	}

    addImage(folder, file, image) {
        this.imageMap.set(folder + "#" + file, image);
    }

    getImage(folder, file) {
        return this.imageMap.get(folder + "#" + file);
    }
	
	// TODO Alphabetize
	getImageByID(id) {
		let image;
		
		switch(id) {
            case "player":
				// Add lots of stuff
                image = this.getImage("player", "mage");
                break;
            case "gold":
                image = this.getImage("item", "gold");
                break;
            case "pvp_token":
                image = this.getImage("item", "token_pvp");
                break;
            case "fire_trap":
                image = this.getImage("trap", "fire");
                break;
            case "death_trap":
                image = this.getImage("trap", "death");
                break;
            case "health_potion":
                image = this.getImage("item", "potion_health");
                break;
            case "invincible_potion":
                image = this.getImage("item", "potion_invincible");
                break;
            case "mana_potion":
                image = this.getImage("item", "potion_mana");
                break;
            case "monster":
				// Add health bar
                image = this.getImage("creature", "monster");
                break;
            case "projectile":
                image = this.getImage("magic", "orb");
                break;
            case "wall":
                image = this.getImage("wall", "wall");
                break;
            case "teleporter":
                image = this.getImage("portal", "teleporter");
                break;
            case "revive_portal":
                image = this.getImage("portal", "teleporter");
                break;
            default:
                image = this.getImage("_base", "unknown");
        }
		
		return image;
    }
}

export { ImageCatalog };