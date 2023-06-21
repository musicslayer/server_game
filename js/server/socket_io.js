function createSocketIOServer(server, client) {
	const io = new require("socket.io")(server);

	io.on("connection", (socket) => {
		let type = "";

		if(socket.handshake.query.input) {
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
			socket.on("on_mouse_click", (button, location, info, callback) => {
				client.onClick([button], location, info);
				callback();
			});

			socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
				client.onDrag([button], location1, info1, location2, info2);
				callback();
			});
		}
		else if(socket.handshake.query.client) {
			// Send the client all the data needed to draw the player's screen.
			socket.on("get_client_data", (callback) => {
				let clientData = client.getClientData();
				callback(clientData);
			});
		}

		console.log("Socket IO Connection Success " + type);
	});

	return io;
}

module.exports.createSocketIOServer = createSocketIOServer;