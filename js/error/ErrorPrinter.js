class ErrorPrinter {
    static createErrorString(error) {
        if(error === undefined) {
            return "";
        }
    
        let errorString = "" + error;
    
        if(error.stack) {
            errorString = errorString + "\n" + error.stack;
        }
    
        if(error.cause) {
            errorString = errorString + "\n\n" + "Caused By:\n" + createErrorString(error);
        }
    
        return errorString;
    }
}

module.exports = ErrorPrinter;