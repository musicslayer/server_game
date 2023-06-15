function createSocketIOServer(server, client) {
	const io = new require("socket.io")(server);

	io.on("connection", (socket) => {
		let type = "";

		if(socket.handshake.query.key) {
			// Respond to key presses
			// Note: Multiple keys/controller buttons may be pressed at once, 
			// but mouse clicks are discrete events and are only processed one button at a time.
			type = type + "Key;";

			socket.on("on_click", (button, x, y, imageScaleFactor, callback) => {
				client.onClick([button], x, y, imageScaleFactor);
				callback();
			});

			socket.on("on_key_press", (keys, callback) => {
				client.onKeyPress(keys);
				callback();
			});

			socket.on("on_controller_press", (buttons, callback) => {
				client.onControllerPress(buttons);
				callback();
			});

			socket.on("get_data", async (imageScaleFactor, callback) => {
				let imageData = client.drawClient(imageScaleFactor);
				callback({imageData: imageData});
			});
		}

		console.log("Socket IO Connection Success " + type);
	});

	return io;
}

module.exports.createSocketIOServer = createSocketIOServer;