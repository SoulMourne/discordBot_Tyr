const Configuration = require("./../../conf/conf.json");
const Command = require("./../../libs/command.js").Command;
const Parameter = require("./../../libs/parameter.js").Parameter;
const Utilities = require("./../../libs/utilities.js");
const ModuleLoader = require("./../../libs/module_loader.js").ModuleLoader;
const MessageFormat = require("./../../libs/message_format.js");
const fs = require("fs");

module.exports = function(bot) {

  var moduleLoader = arguments[1]["moduleLoader"];
  var Properties = arguments[1]["Properties"];

  //When the bot records a new message on the server
  bot.on('message', message => {
    //If the message is interpreted as a command to the bot
    if (message.content.startsWith(Configuration.command_marker)) {

      //Get the command
      let cmd = new Command(message.content.substring(Configuration.command_marker.length, message.content.length));

      //Create a reply variable
      let reply = "";

      //Tests the command
      switch (cmd.getCommandName().toLowerCase()) {
        //TODO : Check if command is in file
        case 'load':
          if (cmd.getCommandParameters().length == 0) { //If there is no parameters
            //Show the list of modules
            let modules = moduleLoader.listModules();
            reply = "`Modules : `\n"
            for (var i = 0; i < modules.length; i++) {
              reply += "`- " + modules[i] + " : " + moduleLoader.getModuleDescription(modules[i]) + "`\n"
            }
          } else { //If there is at least one parameter
            for (var i = 0; i < cmd.getCommandParameters().length; i++) { //For every module passed
              try {
                var moduleName = cmd.getCommandParameters()[i].parameterName; //get the passed
                if (moduleLoader.loadedModules.indexOf(moduleName) > -1) { //Check if the module is already loaded
                  reply += "The module is already loaded";
                } else { // Load the module if it is found
                  moduleLoader.loadModule(moduleName, bot);
                  Configuration.modules[Configuration.modules.length] = moduleName;
                  fs.writeFile("./conf/conf.json", JSON.stringify(Configuration));
                  reply += "Successfully loaded " + moduleName + "\n";
                }
              } catch (e) {
                reply += e.message + "\n";
              }
            }
          }
          message.reply(reply).then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.log);
          break;
        case 'unload':
          if (cmd.getCommandParameters().length == 0) { //If there is no parameters, sends an error
            reply += "A parameter is expected. Please see the help (" + Configuration.command_marker + "help)";
          } else { // If there is at least one parameter
            for (var i = 0; i < cmd.getCommandParameters().length; i++) { // For each parameter (module name) passed
              var index = -1; //Sets an index at -1
              for (var j = 0; j < Configuration.modules.length; j++) { //Search if the modules exists
                let moduleName = cmd.getCommandParameters()[j].parameterName
                if (Configuration.modules[i] == moduleName) {
                  index = j;
                }
              }
              if (index != -1) { //If the module was found, remove him from the configuration file
                Configuration.modules.splice(i, 1);
                fs.writeFile("./conf/conf.json", JSON.stringify(Configuration));
                reply += cmd.getCommandParameters()[i].parameterName + " successfully removed. Please restart the bot to apply the changes."
              } else { //If the module was not found, tell the clien
                reply += "Module not loaded or found (" + cmd.getCommandParameters()[i].parameterName + ")";
              }
            }
          }
          message.reply(reply).then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.log);
          break;
        case 'status':
          var moduleString = "";
          for (var i = 0; i < moduleLoader.loadedModules.length; i++) {
            moduleString += moduleLoader.loadedModules[i] + "; ";
          }
          if (moduleString == "") {
            moduleString = "None";
          }
          reply += "\n\n";
          reply += bot.user + " , The Hand of Justice ready to serve you !\n\n";
          reply += "Name : Tyr Bot\n";
          reply += "Description : " + Properties.description + "\n";
          reply += "Uptime : " + Utilities.millisecondsToString(bot.uptime) + "\n";
          reply += "Version : " + Properties.version + "\n";
          reply += "Authors : " + Properties.author + "\n";
          reply += "Loaded modules : " + moduleString + "\n";
          reply += "Command marker : " + Configuration.command_marker;
          message.reply(reply).then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.log);
          break;
        case 'help':
          var response = "\n";

          for(var i = 0; i < moduleLoader.loadedModules.length; i++) {
            moduleName = moduleLoader.loadedModules[i];
            response += MessageFormat.formatModuleNameHeader(moduleName);
            moduleCommands = moduleLoader.getModuleCommands(moduleName);
            for (var j in Object.keys(moduleCommands)) {
              var currentCommand = moduleCommands[j];
              response += MessageFormat.formatCommand(currentCommand);
            }
          }

          //Sends the response to the user and logs it
          message.reply(response)
            .then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.log);

          break;
        case 'bye':
          //Get the main channel of the server
          let channel = message.channel;

          //Build a logout message
          let logoutMessage = bot.user + " , The Hand of Justice is retiring !\n" +
            "It was a pleasure to serve you all !";

          //Send the logout message to the server and log it
          channel.send(logoutMessage)
            .then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.log);

          //Wait 2000ms (time for the bot to send the message) then exit node.js without an error
          setTimeout(function() {
            process.exit(0);
          }, 2000);

          break;
        case 'ccm':
          //Check the number of parameters
          if (cmd.getCommandParameters().length > 0) {
            let param = cmd.getCommandParameters()[0];
            //Get the first parameter and change it in the JSON object
            switch (param.getParameterName()) {
              //Replace the command marker with the default one
              case '-r':
              case '-reset':
                //If the marker is not the default one
                if (Configuration.command_marker != '&') {
                  Configuration.command_marker = '&';
                  reply = "Sucessfully reset the command marker to `&`";
                } else { //If the marker is already the default one
                  reply = "The command marker is already set to default (`&`)";
                }
                break;
              default: //The command marker is changed
                if (param.isMention()) {
                  reply = "The command marker cannot be a mention";
                } else {
                  Configuration.command_marker = cmd.getCommandParameters()[0].getParameterName();
                  reply = "Successfully changed the command marker to `" + cmd.getCommandParameters()[0].getParameterName() +
                    "`. You may now use it to launch other commands";
                }
                break;
            }
            message.reply(reply).then(message => console.log(`Sent message: ${message.content}`))
              .catch(console.log);
            //Save the new Configuration
            fs.writeFile("./conf/conf.json", JSON.stringify(Configuration));
            console.log("Changed and saved the new configuration in the conf file");
            //Update the bot status
            bot.user.setStatus('online', 'cm : ' + Configuration.command_marker)
              .then(user => console.log('Changed status to ' + bot.user.status))
              .catch(console.log);
          } else {
            reply = "Error while changing the command marker. Did you pass a new command marker?\n" +
              "Type the " + Configuration.command_marker + "help command for more information.";
            message.reply(reply).then(message => console.log(`Sent message: ${message.content}`))
              .catch(console.log);
          }
          break;
        default:
          break;

      }

      var command_recognized = false
      for(var i = 0; i < moduleLoader.loadedModules.length; i++) {
        var moduleName = moduleLoader.loadedModules[i];
        response += MessageFormat.formatModuleNameHeader(moduleName);
        var moduleCommands = moduleLoader.getModuleCommands(moduleName);
        for (var j in Object.keys(moduleCommands)) {
          var currentCommand = moduleCommands[j].name;
          if (currentCommand == cmd.getCommandName()) {
            command_recognized = true
          }
        }
      }
      if (!command_recognized) {
        console.log("Use of command `" + cmd.getCommandName() + "` not recognized");
      }
    }
  });

}
