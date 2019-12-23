catan
=====

## Installing
1. Clone the repo
2. `npm install`
3. Run the app with `npm start`

## Linting
* `npm run lint` will lint
* `npm run lintfix` will auto fix most issues

---

Todo list:----------
Trading
    ports
    other players
Use a knight before roll

Small --------
Spend cards
Begin game
    others not allowed to join game
knight and road building will be cut off if refresh
Need to update roomData when someone changes a room from chat server
    Also need to resend the ui to that room's ui
    Need to update playerData to remove the user if they have disconnected
It should remember what room you were in last and connect you to that room

Not necessary for first time use ----------
6 and 8 can't be next to each other
victory point change should be changed in catanjs
refactor longest road code into its own file
Move dice into the svg

Intermittent----------
Knight still flashes even when no houses to rob

![alt tag](https://i.imgur.com/WoTQ2Mm.png)
