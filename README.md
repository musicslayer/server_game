# map_maker
 Demonstration of a 2D MMO Server Game

## Launch Instructions
On the server: run app.js

On the client (i.e. a web browser): Navigate to https://localhost/

## Features
### Admin
The server terminal allows for admin commands. Currently the following commands are supported:

save: Serializes and stores the entire server state to a file.

load: Retreives and deserializes the entire server state from a file.

exit: Instantly ends the server app.

### Server

### Client
inputs: The client can handle mouse clicks, keyboard clicks, and gamepad buttons and analog sticks.

sprites: The client displays all graphics as square sprites. This includes the player, monsters, items, all other entities, and all floor tiles.

screen: The client displays the main game field, a gold purse, an inventory of items, and information on any entity that the player clicks on.

accounts: The user can login, create an account, create a character, change the password, change the email, force logout the account, delete a character, delete an account, enable the account, and disable the account.

NOTE - Currently, account actions that would normally require an email confirmation will instead just succeed. This is because sending emails would require either a third party email service or a non-residential ISP that doesn't block port 25.

For email functionality, see https://github.com/musicslayer/emailsend
