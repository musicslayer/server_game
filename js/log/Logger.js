const fs = require("fs");

const MAX_LOG_SIZE = 1 * 1024 * 1024 * 1024; // 1GB
const MAX_BASE_LOG_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

// TODO Treat base log as just another log to simplify code?
// TODO Log levels?

class Logger {
	static loggerMap = new Map();

	static baseFileName;
	static baseFileNameError;
	static baseMarker;
	static baseMarkerError;
	static baseSizeLimit;
	static baseSizeLimitError;

	category;
	reference;
	separator;
	errorCount;

	fileName;
	fileNameError;
	marker;
	markerError;
	sizeLimit;
	sizeLimitError;

	static getLogger(category) {
		return Logger.loggerMap.get(category);
	}

	static setLogger(category, logger) {
		Logger.loggerMap.set(category, logger);
	}

	static createLogger(category, reference, fileName, fileNameError) {
		Logger.setLogger(category, new Logger(category, reference, fileName, fileNameError));
	}

	static initialize() {
		Logger.baseFileName = "logs/_log.txt";
		Logger.baseFileNameError = "logs/_error_log.txt";

		// Markers will contain a value if logging is disabled.
		Logger.baseMarker = [];
		Logger.baseMarkerError = [];

		// Limit base log file sizes to 5GB.
		Logger.baseSizeLimit = MAX_BASE_LOG_SIZE;
		Logger.baseSizeLimitError = MAX_BASE_LOG_SIZE;

		// Create the log files.
		fs.writeFileSync(Logger.baseFileName, "");
		fs.writeFileSync(Logger.baseFileNameError, "");
	}

    static logEvent(category, id, eventName, ...infoArgs) {
        const logger = Logger.getLogger(category);
        logger.logEvent(id, eventName, infoArgs);
    }
    
    static logError(category, id, errorName, error, ...infoArgs) {
        const logger = Logger.getLogger(category);
        logger.logError(id, errorName, error, infoArgs);
    }

	constructor(category, reference, fileName, fileNameError) {
		Logger.loggerMap.set(category, this);

		this.category = category;
		this.reference = reference;
		this.separator = " ----- ";
		this.errorCount = 0;

		this.fileName = fileName;
		this.fileNameError = fileNameError;
		
		// Markers will contain a value if logging is disabled.
		this.marker = [];
		this.markerError = [];

		// Limit log file sizes to 1GB.
		this.sizeLimit = MAX_LOG_SIZE;
		this.sizeLimitError = MAX_LOG_SIZE;

		// Create the log files.
		fs.writeFileSync(fileName, "");
		fs.writeFileSync(fileNameError, "");
	}

	logEvent(id, eventName, infoArgs) {
		const timestamp = new Date().toISOString();
		const categoryString = this.category + "_EVENT";
		const infoString = this.createInfoString(infoArgs);

		const str = timestamp + this.separator + categoryString + this.separator + id + this.separator + eventName + this.separator + infoString + "\n";
		this.writeToLogFile(str);

		this.logBaseEvent(timestamp, categoryString, this.separator, id, eventName, infoString);
	}

	logBaseEvent(timestamp, categoryString, separator, id, eventName, infoString) {
		const str = timestamp + separator + categoryString + separator + id + separator + eventName + separator + infoString + "\n";
		this.writeToBaseLogFile(str);
	}

	logError(id, errorName, error, infoArgs) {
		// Log basic info in the log file and include a reference to a fuller entry in the error log file.
		this.errorCount++;

		const timestamp = new Date().toISOString();
		const categoryString = this.category + "_ERROR";
		const errorRefString = "#" + this.reference + "[" + this.errorCount + "]";
		const infoString = this.createInfoString(infoArgs);
	
		const str = timestamp + this.separator + categoryString + this.separator + id + this.separator + errorName + this.separator + errorRefString + this.separator + infoString + "\n";
		this.writeToLogFile(str);
	
		const errorString = errorRefString + "\n" + 
			"ERROR: " + error + "\n" +
			"ERROR STACK: " + error.stack + "\n\n";
	
		this.writeToErrorLogFile(errorString);

		this.logBaseError(timestamp, categoryString, this.separator, id, errorName, errorRefString, errorString, infoString);
	}

	// All other log error functions should call this one too.
	logBaseError(timestamp, categoryString, separator, id, errorName, errorRefString, errorString, infoString) {
		// Log basic info in the log file and include a reference to a fuller entry in the error log file.
		const str = timestamp + separator + categoryString + separator + id + separator + errorName + separator + errorRefString + separator + infoString + "\n";

		this.writeToBaseLogFile(str);
		this.writeToBaseErrorLogFile(errorString);
	}

	writeToLogFile(str) {
		this.doWrite(str, this.fileName, this.marker, this.sizeLimit)
	}

	writeToErrorLogFile(str) {
		this.doWrite(str, this.fileNameError, this.markerError, this.sizeLimitError)
	}

	writeToBaseLogFile(str) {
		this.doWrite(str, Logger.baseFileName, Logger.baseMarker, Logger.baseSizeLimit)
	}

	writeToBaseErrorLogFile(str) {
		this.doWrite(str, Logger.baseFileNameError, Logger.baseMarkerError, Logger.baseSizeLimitError)
	}

	doWrite(str, logFile, marker, sizeLimit) {
		// Write to log file, but if we error or the size would be too big then just print once to console.
		if(marker.length > 0) { return; }
	
		try {
			let currentSize = fs.statSync(logFile).size;
			let newSize = Buffer.byteLength(str, "utf8");
			let totalSize = currentSize + newSize;
		
			if(totalSize > sizeLimit) {
				marker.push(true);
				console.log("LOG FILE LIMIT REACHED: " + logFile);
				console.log("Last Log String: " + str);
			}
			else {
				fs.appendFileSync(logFile, str);
			}
		}
		catch(err) {
			marker.push(true);
			console.log("LOG FILE ERROR: " + logFile);
			console.log(err);
			console.log("Last Log String: " + str);
		}
	}

	createInfoString(infoArgs) {
		return infoArgs.join("|");
	}
}

module.exports = Logger;