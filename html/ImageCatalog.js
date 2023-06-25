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
			// All paths will have the format "folder/file.png"
			let fileParts = filePath.split("/");
			let folder = fileParts[0];
			let file = fileParts[1].slice(0, -4);
			
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
	
	getImageByID(id, animationFrame) {
		let image;
		
		switch(id) {
            case "death_trap":
                image = this.getImage("trap", "death");
                break;
            case "fire_trap":
                image = this.getImage("trap", "fire");
                break;
            case "gold":
                image = this.getImage("item", "gold");
                break;
            case "health_potion":
                image = this.getImage("item", "health_potion_" + animationFrame);
                break;
			case "home_portal":
                image = this.getImage("portal", "teleporter");
                break;
            case "invincible_potion":
                image = this.getImage("item", "invincible_potion");
                break;
			case "magic_projectile":
                image = this.getImage("magic", "orb");
                break;
            case "mana_potion":
                image = this.getImage("item", "mana_potion");
                break;
			case "melee_projectile":
                image = this.getImage("melee", "orb");
                break;
            case "monster":
                image = this.getImage("creature", "monster");
                break;
			case "monster_spawner":
                image = this.getImage("creature", "monster_spawner");
                break;
            case "player_mage":
                image = this.getImage("player", "mage");
                break;
			case "player_warrior":
                image = this.getImage("player", "warrior");
                break;
            case "pvp_token":
                image = this.getImage("item", "pvp_token");
                break;
            case "revive_portal":
                image = this.getImage("portal", "teleporter");
                break;
            case "teleporter":
                image = this.getImage("portal", "teleporter");
                break;
            case "wall":
                image = this.getImage("wall", "wall");
                break;
            default:
                image = this.getImage("_base", "unknown");
        }
		
		return image;
    }
}

export { ImageCatalog };