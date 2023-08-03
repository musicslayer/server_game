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
			// All paths will have the format "folder\file.png"
			let fileParts = filePath.split("\\");
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
	
	getImageByClassName(className, animationFrame) {
		let image;
		
		switch(className) {
            case "DeathTrap":
                image = this.getImage("trap", "death");
                break;
			case "FallbackPortal":
                image = this.getImage("portal", "teleporter");
                break;
            case "FireTrap":
                image = this.getImage("trap", "fire");
                break;
            case "Gold":
                image = this.getImage("item", "gold");
                break;
            case "HealthPotion":
                image = this.getImage("item", "health_potion_" + animationFrame);
                break;
			case "HealthRegenPotion":
                image = this.getImage("item", "health_regen_potion");
                break;
			case "HomePortal":
                image = this.getImage("portal", "teleporter");
                break;
            case "InvinciblePotion":
                image = this.getImage("item", "invincible_potion");
                break;
			case "MagicProjectile":
                image = this.getImage("magic", "orb");
                break;
            case "ManaPotion":
                image = this.getImage("item", "mana_potion");
                break;
			case "ManaRegenPotion":
                image = this.getImage("item", "mana_regen_potion");
                break;
			case "MeleeProjectile":
                image = this.getImage("melee", "orb");
                break;
            case "Monster":
                image = this.getImage("creature", "monster");
                break;
			case "MonsterSpawner":
                image = this.getImage("creature", "monster_spawner");
                break;
            case "PlayerMage":
                image = this.getImage("player", "mage");
                break;
			case "PlayerWarrior":
                image = this.getImage("player", "warrior");
                break;
            case "PVPToken":
                image = this.getImage("item", "pvp_token");
                break;
            case "RevivePortal":
                image = this.getImage("portal", "teleporter");
                break;
			case "StartPortal":
                image = this.getImage("portal", "teleporter");
                break;
            case "Teleporter":
                image = this.getImage("portal", "teleporter");
                break;
            case "Wall":
                image = this.getImage("wall", "wall");
                break;
            default:
                image = this.getImage("_base", "unknown");
        }
		
		return image;
    }
}

export { ImageCatalog };