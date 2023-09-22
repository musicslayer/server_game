const readline = require('readline');

class AppAdmin {
    appState;
    readlineInterface;

    constructor(appState) {
        this.appState = appState;
    }

    createConsoleInterface() {
        this.readlineInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        this.readlineInterface.on("line", (line) => {
            console.log("Received: " + line);

            switch(line) {
                case "save":
                    this.appState.save();
                    console.log("Save complete.");
                    break;

                case "load":
                    this.appState.load();
                    console.log("Load complete.");
                    break;

                case "exit":
                    // The app will properly close itself after catching the error.
                    throw(new Error("Admin is exiting the app."));

                default:
                    console.log("Command not recognized.");
            }

            console.log("Enter an admin command:");
        });
    }

    terminate() {
        this.readlineInterface?.close();
    }
}

module.exports = AppAdmin;