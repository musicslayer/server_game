# map_maker
 Demonstration of a 2D MMO Server Game

## Launch Instructions
On the server (i.e. a computer): run app.js

On the client (i.e. a web browser running on the same computer): Navigate to https://localhost/ or http://localhost/

(Depending on whether the SSL credentials are present, the app will automatically decide whether to use http or https.)

## Features
### Overall
The code's only external dependency is on socket.io, which can be found here: https://socket.io/

### Admin
The server terminal allows for admin commands. Currently the following commands are supported:

save: Serializes and stores the entire server state to a file.

load: Retreives and deserializes the entire server state from a file.

exit: Instantly ends the server app.

### Server
clients: The server handles client inputs and requests for information.

accounts: The server stores player accounts. Each account can have multiple characters.

security: If any client sends invalid inputs or sends too many requests per second (measured per IP address), the server will instantly disconnect the client.

animations: The motion of entities (including projectiles) is smoothly animated across grid spaces.

serialization: The entire server state can be serialized to a JSON string or deserialized from a JSON string. This is done by allowing each class to define methods to handle any state it stores. Primitive values such as strings, numbers, and booleans are handled directly, as are any structures such as arrays and maps.

server code: Each server instance has its own clock and RNG capabilities. The server clock makes sure that any change in state caused by players, monsters, or anything else is scheduled to occur at a specific frame. The clock uses a worker thread to ensure a steady 60 FPS. The RNG is deterministic but is affected by (among other things) player actions, so in practice the RNG is difficult to manipulate.

inputs: Client inputs from the mouse, keyboard, and gamepads are handled. The server converts input number values to actions (such as "move_left" and "action"). The server also allows special "developer" accounts to have additional actions not available to normal accounts (such as unrestricted teleporting).

zip: The server gives the client all the sprite graphics by zipping the images (and the client in turn unzips them). Zip/unzip code available in its own repository: https://github.com/musicslayer/zip

worlds: Each server instance can have multiple worlds, which each have multiple maps, which each have multiple screens. Instance maps exist that will disappear when the last player leaves. Dynamic maps exist that dynamically generate screens.

### Client
inputs: The client can handle mouse clicks, keyboard clicks, and gamepad buttons and analog sticks.

sprites: The client displays all graphics as square sprites. This includes the player, monsters, items, all other entities, and all floor tiles.

screen: The client displays the main game field, a gold purse, an inventory of items, and information on any entity that the player clicks on.

accounts: The user can login, create an account, create a character, change the password, change the email, force logout the account, delete a character, delete an account, enable the account, and disable the account.

NOTE - Currently, account actions that would normally require an email confirmation will instead just succeed. This is because sending emails would require either a third party email service or a non-residential ISP that doesn't block port 25.

For email functionality, see https://github.com/musicslayer/emailsend
