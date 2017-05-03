var Logger = require('./Logger');
var UserRoleEnum = require("../enum/UserRoleEnum");

function PlayerCommand(gameServer, playerTracker) {
    this.gameServer = gameServer;
    this.playerTracker = playerTracker;
    this.roleList = [];
    this.SCInterval;
}

module.exports = PlayerCommand;

PlayerCommand.prototype.writeLine = function (text) {
    this.gameServer.sendChatMessage(null, this.playerTracker, text);
};
PlayerCommand.prototype.skinchanger = function () {
        var self = this;
        this.SCInterval = setInterval(function() {
        var rSkin = self.playerTracker.socket.packetHandler.getRandomSkin();
        self.playerTracker.setSkin(rSkin);
        for (var i in self.playerTracker.cells) {
        var cell = self.playerTracker.cells[i];
        var Player = require('../entity/PlayerCell');
        var newCell = new Player(self.gameServer, self.playerTracker, cell.position, cell._size);
        self.gameServer.removeNode(cell);
        self.gameServer.addNode(newCell);
       }
        }, 10000) // Every 10 seconds
}
PlayerCommand.prototype.executeCommandLine = function(commandLine) {
    if (!commandLine) return;
    if (!this.parsePluginCommands(commandLine)) return;

    // Splits the string
    var args = commandLine.split(" ");
    
    // Process the first string value
    var first = args[0].toLowerCase();
    
    // Get command function
    var execute = playerCommands[first];
    if (typeof execute != 'undefined') {
        execute.bind(this)(args);
    } else {
        this.writeLine("ERROR: Unknown command, type /help for command list");
    }
};

PlayerCommand.prototype.parsePluginCommands = function(str) {
    // Splits the string
    var args = str.split(" ");
    
    // Process the first string value
    var first = args[0].toLowerCase();
    
    // Get command function
    var execute = this.gameServer.PluginHandler.playerCommands[first];
    if (typeof execute != 'undefined') {
        execute(this, args, this.playerTracker, this.gameServer);
        return false;
    } else return true;
}

PlayerCommand.prototype.userLogin = function (username, password) {
    if (!username || !password) return null;
    for (var i = 0; i < this.gameServer.userList.length; i++) {
        var user = this.gameServer.userList[i];
        if (user.username != username)
            continue;
        if (user.password != password)
            continue;
        return user;
    }
    return null;
};

PlayerCommand.prototype.createAccount = function (username, password) {
    var fs = require('fs');
    if (!username || !password) return null;
    for (var i in this.gameServer.userList) {
        var user = this.gameServer.userList[i];
        if (user.username == username) {
            this.writeLine("That User Name is already taken!");
            return false;
        }
    }
    var user = {username: username, password: password, role: 1, name: "Local User", level: 0, exp: 0};
    this.gameServer.userList.push(user);
    json = JSON.stringify(this.gameServer.userList);
    var file = '../src/enum/UserRoles.json';
    fs.writeFileSync(file, json, 'utf-8');
    this.gameServer.loadFiles();
    return true;
};

var playerCommands = {
    help: function (args) {
        var page = parseInt(args[1]);
        if (this.playerTracker.userRole == UserRoleEnum.ADMIN || this.playerTracker.userRole == UserRoleEnum.MODER) {
            if (isNaN(page)) {
                this.writeLine("Please Enter a Page Number!");
                return;
            }
            if (page == 1) { // 10 Fit per Page
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("/skin %shark - change skin");
            this.writeLine("/kill - self kill");
            this.writeLine("/help [page #] - this command list");
            this.writeLine("/id - Gets your playerID");
            this.writeLine("/mass - gives mass to yourself or to other players");
            this.writeLine("/merge - Instantly Recombines all of your cells or other players cells");
            this.writeLine("/rec - Toggles rec mode for you or for other players - MUST BE ADMIN");
            this.writeLine("/spawnmass - gives yourself or other players spawnmass - MUST BE ADMIN");
            this.writeLine("/minion - gives yourself or other players minions");
            this.writeLine("/minion remove - removes all of your minions or other players minions");
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("Showing Page 1 of 3.");
            } else if (page == 2) {
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("/userrole - Allows you to give User Role to a player ID - MUST BE ADMIN");
            this.writeLine("/userrole list - Lists all the people you have given a Role - MUST BE ADMIN");
            this.writeLine("/kick - Kicks a Player ID to make them lose their Temporarily Role");
            this.writeLine("/addbot - Adds Bots to the Server - MUST BE ADMIN");
            this.writeLine("/change - Allows you to Temporarily change the config of the Server! - MUST BE ADMIN");
            this.writeLine("/reloadconfig - Reloads the config of the Server to the gameServer.ini file - MUST BE ADMIN");
            this.writeLine("/shutdown - SHUTDOWNS THE SERVER - MUST BE ADMIN");
            this.writeLine("/restart - RESTARTS THE SERVER - MUST BE ADMIN");
            this.writeLine("/status - Shows Status of the Server");
            this.writeLine("/gamemode - Allows you to change the Game Mode of the Server. - MUST BE ADMIN");
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("Showing Page 2 of 3.");
            } else if (page == 3) {
                this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                this.writeLine("/popsplit - Gives you the ability to do perfect popsplits (within reason)");
                this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            }
        }
        else {
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("/skin %shark - change skin");
            this.writeLine("/kill - self kill");
            this.writeLine("/help - this command list");
            this.writeLine("/id - Gets your playerID");
            this.writeLine("/account - Allows you to manage your account");
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            }
    },
    id: function (args) {
        this.writeLine("Your PlayerID is " + this.playerTracker.pID);
    },
    skin: function (args) {
        var skinName = "";
        if (args[1]) skinName = args[1];
        if (skinName == "") {
            this.playerTracker.setSkin(skinName);
            this.writeLine("Your skin was removed");
        }
        else if (skinName == "c" || skinName == "changer") {
            this.playerTracker.skinchanger = !this.playerTracker.skinchanger;
            if (this.playerTracker.skinchanger) {
                this.writeLine("You now have a skin changer!");
                this.skinchanger();
            } else {
                this.writeLine("You no longer have a skin changer");
                clearInterval(this.SCInterval);
            }
        } 
         else {
            this.playerTracker.setSkin(skinName);
            for (var i in this.playerTracker.cells) {
                var cell = this.playerTracker.cells[i];
                var Player = require('../entity/PlayerCell');
                var newCell = new Player(this.gameServer, this.playerTracker, cell.position, cell._size);
                this.gameServer.removeNode(cell);
                this.gameServer.addNode(newCell);
            }
            this.writeLine("Your skin set to " + skinName);
        }
},
    account: function (args) {
        var whattodo = args[1];
        if (args[1] == null) {
            this.writeLine("Do /account stats or /account status to get your account level and spawnmass! - MUST BE LOGIN IN FIRST!");
            this.writeLine("Do /account create [username] [password] to create a account! - MUST NOT BE LOGINED IN!");
            return;
        }
        if (args[1] == "create" && this.playerTracker.userRole == UserRoleEnum.GUEST) {
            // Creating an account
            try {
                var username = args[2].trim();
            } catch (error) {
                this.writeLine("ERROR: Missing Username Argument!");
                return;
            }
            try {
                var password = args[3].trim();
            } catch (error) {
                this.writeLine("ERROR: Missing Password Argument!");
                return;
            }
            var test = this.createAccount(username, password);
            if (test) {
            this.writeLine("Successfully Created your Account!");
            this.writeLine("Do /login [User Name] [Password] to login in!");
        }
        } else if (args[1] == "status" || args[1] == "stats" && this.playerTracker.userRole != UserRoleEnum.GUEST) {
            this.writeLine("Level: " + this.playerTracker.level);
            this.writeLine("Exp: " + parseInt(this.playerTracker.exp).toFixed())
            var exp_to_next_level;
            if (this.playerTracker.levelexps[this.playerTracker.level + 1] - this.playerTracker.exp < 0 && this.playerTracker.level < 99) {
                exp_to_next_level = "You can level up. Just respawn!";
            } else if (this.playerTracker.level > 100) {
                exp_to_next_level = "You have achieved the highest level";
            } else if (this.playerTracker.level == 100) {
                exp_to_next_level = "You only have one level left!";
            } else {
                exp_to_next_level = (parseInt(this.playerTracker.levelexps[this.playerTracker.level + 1] - this.playerTracker.exp)).toFixed()
            }
            this.writeLine("Exp to next level: " + exp_to_next_level);
        }
    },
    kill: function (args) {
        if (!this.playerTracker.cells.length) {
            this.writeLine("You cannot kill yourself, because you're still not joined to the game!");
            return;
        }
        while (this.playerTracker.cells.length) {
            var cell = this.playerTracker.cells[0];
            this.gameServer.removeNode(cell);
            // replace with food
            var food = require('../entity/Food');
            food = new food(this.gameServer, null, cell.position, cell._size);
            food.setColor(cell.color);
            this.gameServer.addNode(food);
        }
        this.writeLine("You killed yourself");
    },
    mass: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = parseInt(args[1]);
        var id = args[2];
        var size = Math.sqrt(mass * 100);
        
        if (isNaN(mass)) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }
        
        if (id == null) {
            this.writeLine("Warn: missing ID arguments. This will change your mass.");
            for (var i in this.playerTracker.cells) {
                this.playerTracker.cells[i].setSize(size);
            }
            this.writeLine("Set mass of " + this.playerTracker._name + " to " + size * size / 100);
            
        } else {
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.accountusername == id || client.pID.toString() == id) {
                    for (var j in client.cells) {
                        client.cells[j].setSize(size);
                    }
                    this.writeLine("Set mass of " + client._name + " to " + size * size / 100);
                    var text = this.playerTracker._name + " changed your mass to " + size * size / 100;
                    this.gameServer.sendChatMessage(null, client, text);
                }
            }
        }

    },
    spawnmass: function (args) {        
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = parseInt(args[1]);
        var id = args[2];
        var size = Math.sqrt(mass * 100);
        
        if (isNaN(mass)) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }
        
        if (id == null) {
            this.playerTracker.spawnmass = size; 
            this.writeLine("Warn: missing ID arguments. This will change your spawnmass.");
            this.writeLine("Set spawnmass of " + this.playerTracker._name + " to " + size * size / 100);
        } else {
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.accountusername == id || client.pID.toString() == id) {
                    client.spawnmass = size;
                    this.writeLine("Set spawnmass of " + client._name + " to " + size * size / 100);
                    var text = this.playerTracker._name + " changed your spawn mass to " + size * size / 100; 
                    this.gameServer.sendChatMessage(null, client, text);
                }
            }
        }
    },
    minion: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var add = args[1];
        var id = args[2];
        var player = this.playerTracker;
        
        /** For you **/
        if (id == null) {
            this.writeLine("Warn: missing ID arguments. This will give you minions.");
            // Remove minions
            if (player.minionControl == true && add == "remove") {
                player.minionControl = false;
                player.miQ = 0;
                this.writeLine("Succesfully removed minions for " + player._name);
            // Add minions
            } else {
                player.minionControl = true;
                // Add minions for self
                if (isNaN(parseInt(add))) add = 1;
                for (var i = 0; i < add; i++) {
                    this.gameServer.bots.addMinion(player);
                }
                this.writeLine("Added " + add + " minions for " + player._name);
            }
        
        } else {
            /** For others **/
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.accountusername == id || client.pID.toString() == id) {
                    // Remove minions
                    if (client.minionControl == true) {
                        client.minionControl = false;
                        client.miQ = 0;
                        this.writeLine("Succesfully removed minions for " + client._name);
                        var text = this.playerTracker._name + " removed all off your minions.";
                        this.gameServer.sendChatMessage(null, client, text);
                    // Add minions
                    } else {
                        client.minionControl = true;
                        // Add minions for client
                        if (isNaN(add)) add = 1;
                        for (var i = 0; i < add; i++) {
                            this.gameServer.bots.addMinion(client);
                        }
                        this.writeLine("Added " + add + " minions for " + client._name);
                        var text = this.playerTracker._name + " gave you " + add + " minions.";
                        this.gameServer.sendChatMessage(null, client, text);
                    }
                }
            }
        }
    },
    userrole: function(args) {
        // Temporarily changes the User Role of a player until that player leaves the server.
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied");
            return;
        }
        var id = args[1];
        var role = args[2];
        if (id == null) {
            this.writeLine("Please specify a valid player ID or User Name!");
            return;
        } else if (id == "list") {
            if (!this.roleList.length) {
                this.writeLine("You have not given anyone a Role!");
                return;
            }
            this.writeLine(" ID   |   SCORE   |   NICK");
            for (var i in this.roleList) {
                var client = this.roleList[i];
                var id = client.accountusername;
                var nick = client._name;
                var score = Math.round(client._score);
                this.writeLine(id + "    " + score + "    " + nick);
            }
            return;
    } else {
        if (role != "moder" && role != "user" && role != "guest" || role == null) {
            this.writeLine("Please specify a valid Role!");
            return;
        }
        if (this.playerTracker.pID.toString() == id || this.playerTracker.accountusername == id) {
            this.writeLine("You cannot change your own Role!");
            return;
        }
        for (var i in this.gameServer.clients) {
            var client = this.gameServer.clients[i].playerTracker;
            if (client.pID.toString() == id || client.accountusername == id) {
                if (client.userRole == UserRoleEnum.ADMIN) {
                    this.writeLine("You cannot change Admins Roles!");
                    return;
                }
                if (role == "moder") {
                        client.userRole = UserRoleEnum.MODER;
                        this.writeLine("Successfully changed " + client._name + "'s Role to Moder");
                        this.gameServer.sendChatMessage(null, client, "You have been temporarily changed to MODER."); // notify
                        this.roleList.push(client);
                    } else if (role == "user") {
                        client.userRole = UserRoleEnum.USER;
                        this.writeLine("Successfully changed " + client._name + "'s Role to User!");
                        this.gameServer.sendChatMessage(null, client, "You have been temporarily changed to USER."); // notify
                        this.roleList.push(client);
                    } else {
                        client.userRole = UserRoleEnum.GUEST;
                        this.writeLine("Successfully changed " + client._name + "'s Role to Guest!");
                        this.gameServer.sendChatMessage(null, client, "You have been temporarily changed to GUEST."); // notify
                        this.roleList.push(client);
                    }
                }
            }
        }
    },
    kick: function(args) {
        var id = args[1];
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: acces denied!");
            return;
        }
        if (id == null) {
            this.writeLine("Please specify a valid player ID or User Name!");
            return;
        }
        // kick player
        var count = 0;
        this.gameServer.clients.forEach(function (socket) {
            if (socket.isConnected === false)
               return;
            if (id !== 0 && socket.playerTracker.pID.toString() != id && socket.playerTracker.accountusername != id)
                return;
            if (socket.playerTracker.userRole == UserRoleEnum.ADMIN) {
                this.writeLine("You cannot kick a ADMIN in game!");
                return;
            }
            // remove player cells
                for (var j = 0; j < socket.playerTracker.cells.length; j++) {
                    this.gameServer.removeNode(socket.playerTracker.cells[0]);
                    count++;
                }
            // disconnect
            socket.close(1000, "Kicked from server");
            var name = socket.playerTracker._name;
            this.writeLine("Successfully kicked " + name);
            count++;
        }, this);
        if (count) return;
        if (!id) this.writeLine("Warn: No players to kick!");
        else this.writeLine("Warn: Player with ID " + id + " not found!");
    },
    addbot: function(args) {
        var add = parseInt(args[1]);
        if (isNaN(add)) add = 1;
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        for (var i = 0; i < add; i++) {
            this.gameServer.bots.addBot();
        }
        Logger.warn(this.playerTracker.socket.remoteAddress + " ADDED " + add + " BOTS");
        this.writeLine("Added " + add + " Bots");
    },
    status: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if ('_socket' in this.gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        var ini = require('./ini.js');
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        this.writeLine("Connected players: " + this.gameServer.clients.length + "/" + this.gameServer.config.serverMaxConnections);
        this.writeLine("Players: " + humans + " - Bots: " + bots);
        this.writeLine("Server has been running for " + Math.floor(process.uptime() / 60) + " minutes");
        this.writeLine("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10) / 10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10) / 10 + " mb");
        this.writeLine("Current game mode: " + this.gameServer.gameMode.name);
        this.writeLine("Current update time: " + this.gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(this.gameServer.updateTimeAvg) + ")");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    },
    merge: function(args) {
        // Validation checks
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var id = args[1];
        if (id == null) {
            this.writeLine("Warn: Missing ID arguments. This will merge you.");
            if (this.playerTracker.cells.length == 1) {
                this.writeLine("You already have one cell!");
                return;
            }
            this.playerTracker.mergeOverride = !this.playerTracker.mergeOverride;
            if (this.playerTracker.mergeOverride) this.writeLine(this.playerTracker._name + " is now force mergeing");
            else this.writeLine(this.playerTracker._name + " isn't force merging anymore");
        } else {
        
        // Find client with same ID as player entered
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if (id == this.gameServer.clients[i].playerTracker.pID.toString() || id == this.gameServer.clients[i].playerTracker.accountusername) {
                var client = this.gameServer.clients[i].playerTracker;
                    if (client.cells.length == 1) {
                        this.writeLine("Client already has one cell!");
                        return;
                    }
                    // Set client's merge override
                    client.mergeOverride = !client.mergeOverride;
                    if (client.mergeOverride) {
                        this.writeLine(client._name + " is now force merging");
                        var text = this.playerTracker._name + " Caused you to merge!";
                        this.gameServer.sendChatMessage(null, client, text); // notify
                    }
                    else {
                        this.writeLine(client._name + " isn't force merging anymore");
                        var text = this.playerTracker._name + " Stopped your mergeing"
                        this.gameServer.sendChatMessage(null, client, text); // notify
                    }
                }
            }
        }
    },
    gamemode: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mode = parseInt(args[1]);
        if (isNaN(mode)) {
            this.writeLine("Invalid Game Mode Selected!");
            return;
        }
        if (mode > 8 || mode < 0) {
            this.writeLine("Invalid Game Mode Selected!");
            return;
        }
        var GameMode = require('../Gamemodes');
        var Command = require('./CommandList');
        var gamemode = GameMode.get(mode);
        // Reset
        this.gameServer.gameMode.packetLB = gamemode.packetLB;
        this.gameServer.gameMode.updateLB = gamemode.updateLB;
        Command.list.reset(this.gameServer, args);
        this.gameServer.loadFiles(); // Load Config In case Previous Gamemodes changed them
        this.gameServer.gameMode = gamemode;
        gamemode.onServerInit(this.gameServer);
        Command.list.reset(this.gameServer, args); // Just in Case
        this.writeLine("Successfully Changed Game Mode to: " + this.gameServer.gameMode.name);
        Logger.warn("GAMEMODE CHANGE FROM  " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " AS " + this.playerTracker.socket.userAuth);
        for (var i in this.gameServer.clients) {
            var client = this.gameServer.clients[i].playerTracker;
            var text = this.playerTracker._name + " Changed to Game Mode to: " + this.gameServer.gameMode.name;
            this.gameServer.sendChatMessage(null, client, text);
        }
    },
    rec: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var id = args[1];
        if (id == null) {
            this.writeLine("Warn: Missing ID arguments. This will give you rec mode.");
            this.playerTracker.rec = !this.playerTracker.rec;
            if (this.playerTracker.rec) this.writeLine(this.playerTracker._name + " is now in rec mode!");
            else this.writeLine(this.playerTracker._name + " is no longer in rec mode");
        }
        
        // set rec for client
        for (var i in this.gameServer.clients) {
        	var client = this.gameServer.clients[i].PlayerTracker;
            if (client.pID.toString() == id || client.accountusername == id) {
                var client = this.gameServer.clients[i].playerTracker;
                client.rec = !client.rec;
                if (client.rec) {
                    this.writeLine(client._name + " is now in rec mode!");
                    var text = this.playerTracker._name + " gave you rec mode!";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                } else {
                    this.writeLine(client._name + " is no longer in rec mode");
                    var text = this.playerTracker._name + " Removed your rec mode";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                }
            }
        }
    },
    popsplit: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var id = args[1];
        if (id == null) {
            this.writeLine("Warn: Missing ID arguments. This will give you popsplit mode.");
            this.playerTracker.perfectpopsplit = !this.playerTracker.perfectpopsplit;
            if (this.playerTracker.perfectpopsplit) this.writeLine(this.playerTracker._name + " is now in popsplit mode!");
            else this.writeLine(this.playerTracker._name + " is no longer in popsplit mode");
        }

        // set popsplit for client
        for (var i in this.gameServer.clients) {
            var client = this.gameServer.clients[i].playerTracker;
            if (client.pID.toString() == id || client.accountusername == id) {
                
                client.popsplit = !client.popsplit;

                if (client.popsplit) {
                    this.writeLine(client._name + " is now in popsplit mode!");
                    var text = this.playerTracker._name + " gave you the ability to do perfect popsplits!";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                } else {
                    this.writeLine(client._name + " is no longer in popsplit mode");
                    var text = this.playerTracker._name + " Removed your ability to do perfect popsplits!";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                }
            }
        }
    },
    change: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        if (args.length < 3) {
            this.writeLine("Invalid command arguments");
            return;
        }
        var key = args[1];
        var value = args[2];
        
        // Check if int/float
        if (value.indexOf('.') != -1) {
            value = parseFloat(value);
        } else {
            value = parseInt(value);
        }
        
        if (value == null || isNaN(value)) {
            this.writeLine("Invalid value: " + value);
            return;
        }
        if (!this.gameServer.config.hasOwnProperty(key)) {
            this.writeLine("Unknown config value: " + key);
            return;
        }
        this.gameServer.config[key] = value;
        
        // update/validate
        this.gameServer.config.playerMinSize = Math.max(32, this.gameServer.config.playerMinSize);
        Logger.setVerbosity(this.gameServer.config.logVerbosity);
        Logger.setFileVerbosity(this.gameServer.config.logFileVerbosity);
        this.writeLine("Set " + key + " = " + this.gameServer.config[key]);
        Logger.warn("CONFIGURATION CHANGE REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        Logger.info(key + " WAS CHANGED TO " + value);
    },
    reloadconfig: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        this.gameServer.loadFiles();
        Logger.warn("CONFIGURATION RELOAD REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        this.writeLine("Configuration was Successfully Reloaded!");
    },
    login: function (args) {
        try {
        var username = args[1].trim();
    } catch (error) {
        this.writeLine("ERROR: you have to type in a username!");
        return;
    }
    try {
        var password = args[2].trim();
        } catch (error) {
            this.writeLine("ERROR: You have to type in a password!");
            return;
        }
        var user = this.userLogin(username, password);
        if (!user) {
            this.writeLine("ERROR: login failed!");
            return;
        }
        var PlayerTracker = require("../PlayerTracker");
        var Packet = require("../packet");
        PlayerTracker.prototype.joinGame = function(name, skin) {
     for (var i in this.levelexps) {
        if (this.levelexps[i + 1] < this.level)
            continue;
        if (this.exp > this.levelexps[i] && this.level < 101) {
            this.level++;
            this.exp = this.exp - this.levelexps[i];
            this.onLevel();
        }
    }
    if (this.cells.length) return;

    if (skin) this.setSkin(skin);
    if (!name) name = "An unnamed cell";
    // 4 = Admin 2 = Mod
    if (this.userRole == UserRoleEnum.ADMIN) name = name + "ᴬᴰᴹᴵᴺ";
        else if (this.userRole == UserRoleEnum.MODER) name = name + "ᴹᴼᴰᴱᴿ";
    // Perform check to see if someone that isn't admin has a check
    if (this.userRole != UserRoleEnum.ADMIN && this.userRole != UserRoleEnum.MODER) {
                for (var i in name) {
                name = name.replace('ᴬᴰᴹᴵᴺ', '');
                name = name.replace('ᴹᴼᴰᴱᴿ', '');
            }
        } 
    this.setName(name);
    this.spectate = false;
    this.freeRoam = false;
    this.spectateTarget = null;
    var packetHandler = this.socket.packetHandler;

    if (!this.isMi && this.socket.isConnected != null) {
        // some old clients don't understand ClearAll message
        // so we will send update for them
        if (packetHandler.protocol < 6) {
            packetHandler.sendPacket(new Packet.UpdateNodes(this, [], [], [], this.clientNodes));
        }
        packetHandler.sendPacket(new Packet.ClearAll());
        this.clientNodes = [];
        this.scramble();
        if (this.gameServer.config.serverScrambleLevel < 2) {
            // no scramble / lightweight scramble
            packetHandler.sendPacket(new Packet.SetBorder(this, this.gameServer.border));
        }
        else if (this.gameServer.config.serverScrambleLevel == 3) {
            var ran = 10065536 * Math.random();
            // Ruins most known minimaps (no border)
            var border = {
                minx: this.gameServer.border.minx - ran,
                miny: this.gameServer.border.miny - ran,
                maxx: this.gameServer.border.maxx + ran,
                maxy: this.gameServer.border.maxy + ran
            };
            packetHandler.sendPacket(new Packet.SetBorder(this, border));
        }
    }
    this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
};

PlayerTracker.prototype.checkConnection = function() {
    // Handle disconnection
    if (!this.socket.isConnected) {
        // Wait for playerDisconnectTime
        var pt = this.gameServer.config.playerDisconnectTime;
        var dt = (this.gameServer.stepDateTime - this.socket.closeTime) / 1e3;
        if (pt && (!this.cells.length || dt >= pt)) {
            // Remove all client cells
            while (this.cells.length) this.gameServer.removeNode(this.cells[0]);
        }
        this.cells = [];
        this.isRemoved = true;
        this.mouse = null;
        this.socket.packetHandler.pressSpace = false;
        this.socket.packetHandler.pressQ = false;
        this.socket.packetHandler.pressW = false;
        return;
    }

    // Check timeout
    if (!this.isCloseRequested && this.gameServer.config.serverTimeout) {
        dt = (this.gameServer.stepDateTime - this.socket.lastAliveTime) / 1000;
        if (dt >= this.gameServer.config.serverTimeout) {
            this.socket.close(1000, "Connection timeout");
            this.isCloseRequested = true;
        }
    }
};
        Logger.info(username + " Logined in as " + user.name + " from " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort);
        this.playerTracker.userRole = user.role;
        this.playerTracker.userAuth = user.name;
        this.playerTracker.accountusername = user.username;
        this.playerTracker.accountpassword = user.password;
        this.playerTracker.level = user.level;
        this.playerTracker.exp = user.exp;
        this.playerTracker.spawnmass = (this.gameServer.config.playerStartSize + (2 * (Math.sqrt(user.level * 100))) < 500) ? this.gameServer.config.playerStartSize + (2 * (Math.sqrt(user.level * 100))) : 500; // 2500 Spawnmass is wayy too much
        this.writeLine("Login done as \"" + user.name + "\"");
        return;
    },
    logout: function (args) {
        if (this.playerTracker.userRole == UserRoleEnum.GUEST) {
            this.writeLine("ERROR: not logged in");
            return;
        }
        var username = this.playerTracker.username;
        Logger.info(username + " Logged out from " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort);
        this.playerTracker.userRole = UserRoleEnum.GUEST;
        this.playerTracker.userAuth = null;
        this.writeLine("Logout done");
    },
    shutdown: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        Logger.warn("SHUTDOWN REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        process.exit(0);
    },
    restart: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: acces denied!");
            return;
        }
        Logger.warn("RESTART REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        process.exit(3);
    }
};
