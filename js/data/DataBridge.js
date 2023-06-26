class DataBridge {
    static serializeValue(obj, classname) {
        let s;

        if(obj.serialize) {
            // Ignore class name and just call the serialize method.
            s = obj.serialize();
        }
        else {
            switch(classname) {
                case "galaxy":
                    s = 1;
                    break;
                default:
            }
        }

        return s;
    }
}

module.exports = DataBridge;