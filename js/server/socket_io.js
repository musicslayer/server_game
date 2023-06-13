function createSocketIOServer(server, client) {
	const io = new require("socket.io")(server);

	io.on("connection", (socket) => {
		let type = "";

		if(socket.handshake.query.key) {
			// Respond to key press
			type = type + "Key;";

			socket.on("on_click", (button, x, y, imageScaleFactor, callback) => {
				client.onClick(button, x, y, imageScaleFactor);
				callback();
			});

			socket.on("on_key", (key, callback) => {
				client.onKeyPress(key);
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