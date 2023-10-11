import { UnzipStream } from "./UnzipStream.js";

class ImageCatalog {
    imageMap = new Map();

    async createImageCatalog() {
        let fileDataMap = await this.fetchZipDataMap();
        
        for(let filePath of fileDataMap.keys()) {
            // Images are stored using both their folder name and file name.
            // "filePath" will always have the format ".../[category]/[folder]/[file].png"
            let fileParts = filePath.split("/").slice(-3);
            let category = fileParts[0];
            let folder = fileParts[1];
            let file = fileParts[2].slice(0, -4);
            
            // We load each image now and store it for future use.
            let fileData = fileDataMap.get(filePath);
            let blob = new Blob([fileData.uncompressedFileContent]);
            let imageURL = URL.createObjectURL(blob);
            let image = new Image();
            await new Promise(r => image.onload = r, image.src = imageURL);
            
            this.addImage(category, folder, file, image);
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
    

    addImage(category, folder, file, image) {
        this.imageMap.set(category + "#" + folder + "#" + file, image);
    }

    getImage(category, folder, file) {
        return this.imageMap.get(category + "#" + folder + "#" + file) ?? this.imageMap.get("_base#_base#unknown");
    }
    
    getImageByEntityClassName(className, animationFrame) {
        let image;

        className = normalizeClassName(className);
        
        switch(className) {
            case "DeathTrap":
                image = this.getImage("entity", "trap", "death");
                break;
            case "FallbackPortal":
                image = this.getImage("entity", "portal", "teleporter");
                break;
            case "FireTrap":
                image = this.getImage("entity", "trap", "fire");
                break;
            case "Gold":
                image = this.getImage("entity", "item", "gold");
                break;
            case "HealthPotion":
                image = this.getImage("entity", "item", "health_potion_" + animationFrame);
                break;
            case "HealthRegenPotion":
                image = this.getImage("entity", "item", "health_regen_potion");
                break;
            case "HomePortal":
                image = this.getImage("entity", "portal", "teleporter");
                break;
            case "InfoSign":
                image = this.getImage("entity", "info", "sign");
                break;
            case "InvinciblePotion":
                image = this.getImage("entity", "item", "invincible_potion");
                break;
            case "MagicProjectile":
                image = this.getImage("entity", "magic", "orb");
                break;
            case "ManaPotion":
                image = this.getImage("entity", "item", "mana_potion");
                break;
            case "ManaRegenPotion":
                image = this.getImage("entity", "item", "mana_regen_potion");
                break;
            case "MeleeProjectile":
                image = this.getImage("entity", "melee", "orb");
                break;
            case "Monster":
                image = this.getImage("entity", "creature", "monster");
                break;
            case "MonsterSpawner":
                image = this.getImage("entity", "creature", "monster_spawner");
                break;
            case "PlayerMage":
                image = this.getImage("entity", "player", "mage");
                break;
            case "PlayerWarrior":
                image = this.getImage("entity", "player", "warrior");
                break;
            case "PVPToken":
                image = this.getImage("entity", "item", "pvp_token");
                break;
            case "RevivePortal":
                image = this.getImage("entity", "portal", "teleporter");
                break;
            case "StartPortal":
                image = this.getImage("entity", "portal", "teleporter");
                break;
            case "Teleporter":
                image = this.getImage("entity", "portal", "teleporter");
                break;
            case "Wall":
                image = this.getImage("entity", "wall", "wall");
                break;
            default:
                image = this.getImage("_base", "_base", "unknown");
        }
        
        return image;
    }
    
    getImageByTileName(tileName, animationFrame) {
        // Tile names are always in the format "[folder]_[file]"
        let [tileFolder, tileFile] = tileName.split("_");
        let image = this.getImage("tile", tileFolder, tileFile);
        return image;
    }
    
    getImageByStatusName(statusName, animationFrame) {
        let image = this.getImage("status", "status", statusName);
        return image;
    }
}

function normalizeClassName(className) {
    // Some groups of class names all have the same image.
    let newClassName = className;

    if(newClassName.startsWith("InfoSign")) {
        newClassName = "InfoSign";
    }
    else if(newClassName.startsWith("Teleporter")) {
        newClassName = "Teleporter";
    }

    return newClassName;
}

export { ImageCatalog };