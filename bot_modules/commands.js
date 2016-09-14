/**
 * This is the module for the discord bot commands
 **/
 
const Properties = require("../package.json");

module.exports = function(bot) {
    console.log("Initialization of bot commands.js module");
    
    bot.on('message', message => {
	
	switch (message.content) {
		case '!author':
			message.reply("My authors are " + Properties.author);
			break;
		case '!ping':
			message.reply('pong');
			break;
	}
});

}

