const fs = require("fs");
const path = require("path");

class Reflection {
    static classMap = {};

    static init() {
        /*
        const modulesPaths = fs.readdirSync("js/");
        modulesPaths.forEach((modulePath) => {
            let className = modulePath.substring(0, modulePath.length - 3);
            EntityFactory.classMap[className] = require("./" + modulePath)
        });
        */

        Reflection.processDirectory(path.resolve("js/"), "");
    }

    static processDirectory(path, dir) {
        let files = fs.readdirSync(path + dir, {withFileTypes: true});
        for(const file of files) {
            const filename = dir + '/' + file.name;
            const relative = filename.slice(1); // Remove the leading /
            const absolute = path + '/' + relative;
    
            let stats = fs.lstatSync(absolute);
            if(stats.isDirectory()) {
                Reflection.processDirectory(path, filename);
            }
            else {
                if(!isExcluded(relative)) {
                    let modulePath = file.name;
                    let className = modulePath.substring(0, modulePath.length - 3);
                    Reflection.classMap[className] = require("../" + relative)
                }
            }
        }
    }

    static createInstance(className, ...args) {
        let instance;

        let classData = Reflection.classMap[className];
        if(classData) {
            instance = new classData(...args);
        }

        return instance;
    }

    static callStaticMethod(className, methodName, ...args) {
        let returnValue;

        let classData = Reflection.classMap[className];
        if(classData && isFunction(classData, methodName)) {
            returnValue = classData[methodName](...args);
        }

        return returnValue;
    }
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

function isExcluded(relative) {
    // Exclude anything that isn't a class.
    return relative === "server/server_tick.js"
        || relative === "web/http.js"
        || relative === "web/socket_io.js"
}

module.exports = Reflection;