const fs = require("fs");
const path = require("path");

const Constants = require("../constants/Constants.js");

class Reflection {
    static classMap = new Map();

    static init() {
        Reflection.processDirectory(Constants.path.JS_SOURCE_FOLDER);
    }

    static processDirectory(dir) {
        let items = fs.readdirSync(dir);
        for(let item of items) {
            let itemPath = path.join(dir, item);
    
            let stats = fs.lstatSync(itemPath);
            if(stats.isDirectory()) {
                Reflection.processDirectory(itemPath);
            }
            else {
                let className = item.substring(0, item.length - 3);
                Reflection.addClassDataFromFile(className, itemPath);
            }
        }
    }

    static addClassDataFromFile(className, filePath) {
        if(!isExcluded(filePath)) {
            Reflection.classMap.set(className, require(filePath));
        }
    }

    static getClassData(className) {
        let parts = className.split(".");
        let classData = Reflection.classMap.get(parts.shift());
        while(parts.length > 0) {
            classData = classData[parts.shift()];
        }
        return classData;
    }

    static createInstance(className, ...args) {
        let instance;

        let classData = Reflection.classMap.get(className);
        if(classData) {
            instance = new classData(...args);
        }

        return instance;
    }

    static isStaticMethod(className, methodName) {
        let classData = Reflection.getClassData(className);
        return classData && isFunction(classData, methodName);
    }

    static callStaticMethod(className, methodName, ...args) {
        let returnValue;

        let classData = Reflection.getClassData(className);
        if(classData && isFunction(classData, methodName)) {
            returnValue = classData[methodName](...args);
        }

        return returnValue;
    }

    static isSubclass(classNameA, classNameB) {
        // Returns whether classNameA is a subclass of classNameB.
        let classDataA = Reflection.getClassData(classNameA);
        let classDataB = Reflection.getClassData(classNameB);
        return classDataA && classDataB && classDataB.isPrototypeOf(classDataA);
    }

    static getSubclasses(classNameB) {
        let subclasses = [];

        for(let classNameA of Reflection.classMap.keys()) {
            if(Reflection.isSubclass(classNameA, classNameB)) {
                subclasses.push(classNameA);
            }
        }

        return subclasses;
    }
}

function isFunction(value, fcnName) {
	return value !== undefined && 
        (typeof value[fcnName] === "function" || (typeof value[fcnName] === "object" && value[fcnName] instanceof Function));
}

function isExcluded(absolutePath) {
    // Read the file to look for the exclude pragma.
    let fileContent = fs.readFileSync(absolutePath, "ascii");
    return fileContent.includes(Constants.reflection.PRAGMA_EXCLUDE);
}

module.exports = Reflection;