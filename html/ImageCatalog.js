import { UnzipStream } from "./UnzipStream.js";

class ImageCatalog {
    imageMap = new Map();

    async createImageCatalog() {
        let fileDataMap = await this.fetchZipDataMap();
        
        for(let filePath of fileDataMap.keys()) {
            // Images are stored using both their folder name and file name.
            // "filePath" will always have the format ".../[folder]/[file].png"
            let fileParts = filePath.split("/").slice(-2);
            let folder = fileParts[0];
            let file = fileParts[1].slice(0, -4);
            
            // We load each image now and store it for future use.
            let fileData = fileDataMap.get(filePath);
            let blob = new Blob([fileData.uncompressedFileContent]);
            let imageURL = URL.createObjectURL(blob);
            let image = new Image();
            await new Promise(r => image.onload = r, image.src = imageURL);
            
            this.addImage(folder, file, image);
        };
    }
    
    async fetchZipDataMap() {
        // Get a zip file containing all game images from the server.
        let response = await fetch("/images");        
        let data = new Uint8Array(await response.arrayBuffer());
        
        // Return a map with the uncompressed file information.
        let unzipStream = new UnzipStream(data);
        await unzipStream.extractFiles();
        return unzipStream.fileDataMap;
    }
    

    addImage(folder, file, image) {
        this.imageMap.set(folder + "#" + file, image);
    }

    getImage(folder, file) {
        return this.imageMap.get(folder + "#" + file);
    }
    
    getImageByEntityClassName(className, animationFrame) {
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
    
    getImageByTileName(tileName, animationFrame) {
        let image;
        
        switch(tileName) {
            case "letter_upperA":
                image = this.getImage("letter", "upperA");
                break;
            case "letter_upperB":
                image = this.getImage("letter", "upperB");
                break;
            case "letter_upperC":
                image = this.getImage("letter", "upperC");
                break;
            case "letter_upperD":
                image = this.getImage("letter", "upperD");
                break;
            case "letter_upperE":
                image = this.getImage("letter", "upperE");
                break;
            case "letter_upperF":
                image = this.getImage("letter", "upperF");
                break;
            case "letter_upperG":
                image = this.getImage("letter", "upperG");
                break;
            case "letter_upperH":
                image = this.getImage("letter", "upperH");
                break;
            case "letter_upperI":
                image = this.getImage("letter", "upperI");
                break;
            case "letter_upperJ":
                image = this.getImage("letter", "upperJ");
                break;
            case "letter_upperK":
                image = this.getImage("letter", "upperK");
                break;
            case "letter_upperL":
                image = this.getImage("letter", "upperL");
                break;
            case "letter_upperM":
                image = this.getImage("letter", "upperM");
                break;
            case "letter_upperN":
                image = this.getImage("letter", "upperN");
                break;
            case "letter_upperO":
                image = this.getImage("letter", "upperO");
                break;
            case "letter_upperP":
                image = this.getImage("letter", "upperP");
                break;
            case "letter_upperQ":
                image = this.getImage("letter", "upperQ");
                break;
            case "letter_upperR":
                image = this.getImage("letter", "upperR");
                break;
            case "letter_upperS":
                image = this.getImage("letter", "upperS");
                break;
            case "letter_upperT":
                image = this.getImage("letter", "upperT");
                break;
            case "letter_upperU":
                image = this.getImage("letter", "upperU");
                break;
            case "letter_upperV":
                image = this.getImage("letter", "upperV");
                break;
            case "letter_upperW":
                image = this.getImage("letter", "upperW");
                break;
            case "letter_upperX":
                image = this.getImage("letter", "upperX");
                break;
            case "letter_upperY":
                image = this.getImage("letter", "upperY");
                break;
            case "letter_upperZ":
                image = this.getImage("letter", "upperZ");
                break;
            case "floor_red":
                image = this.getImage("floor", "red");
                break;
            case "floor_green":
                image = this.getImage("floor", "green");
                break;
            case "floor_blue":
                image = this.getImage("floor", "blue");
                break;
            case "marker_home":
                image = this.getImage("marker", "home");
                break;
            default:
                image = this.getImage("_base", "unknown");
        }
        
        return image;
    }
    
    getImageByStatusName(statusName, animationFrame) {
        let image;
        
        switch(statusName) {
            case "invincible":
                image = this.getImage("status", "invincible");
                break;
            default:
                image = this.getImage("_base", "unknown");
        }
        
        return image;
    }
}

export { ImageCatalog };