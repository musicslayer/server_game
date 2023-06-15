function createSocketIOServer(server, client) {
	const io = new require("socket.io")(server);

	io.on("connection", (socket) => {
		let type = "";

		if(socket.handshake.query.key) {
			// Respond to key presses and mouse clicks.
			type = type + "Key;";

			// Multiple keys/controller buttons may be pressed at once.
			socket.on("on_key_press", (keys, callback) => {
				client.onKeyPress(keys);
				callback();
			});

			socket.on("on_controller_press", (buttons, callback) => {
				client.onControllerPress(buttons);
				callback();
			});

			socket.on("on_controller_sticks", (axes, callback) => {
				client.onControllerSticks(axes);
				callback();
			});

			// Mouse events are discrete and are only processed one at a time.
			socket.on("on_mouse_click", (button, x, y, imageScaleFactor, callback) => {
				client.onClick([button], x, y, imageScaleFactor);
				callback();
			});

			socket.on("on_mouse_drag", (button, x1, y1, x2, y2, imageScaleFactor, callback) => {
				client.onDrag([button], x1, y1, x2, y2, imageScaleFactor);
				callback();
			});

			// Send the client the image data needed to draw the game.
			socket.on("get_image_data", async (imageScaleFactor, callback) => {
				let imageData = client.drawClient(imageScaleFactor);
				callback({imageData: imageData});
			});
		}

		console.log("Socket IO Connection Success " + type);
	});

	return io;
}

module.exports.createSocketIOServer = createSocketIOServer;