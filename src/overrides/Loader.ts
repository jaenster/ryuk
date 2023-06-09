import {Override} from "./Override";

Loader.skipTown.push('Ryuk');

new Override(Loader, Loader.loadScripts, function () {
  var reconfiguration, s, script,
    unmodifiedConfig = {};

  this.copy(Config, unmodifiedConfig);

  if (!this.fileList.length) {
    showConsole();

    throw new Error("You don't have any valid scripts in bots folder.");
  }

  for (s in Scripts) {
    // Skip test script. Only set on true so default.dbj doesn't mess with town stuff on game join
    if (s === 'Test') continue;

    if (Scripts.hasOwnProperty(s) && Scripts[s]) {
      this.scriptList.push(s);
    }
  }

  for (this.scriptIndex = 0; this.scriptIndex < this.scriptList.length; this.scriptIndex++) {
    script = this.scriptList[this.scriptIndex];

    // If bot name function isnt loaded, try to open the file
    // ryuk loads by setting the global function Ryuk up
    if (!globalThis[script]) {
      if (this.fileList.indexOf(script) < 0) {
        Misc.errorReport("ÿc1Script " + script + " doesn't exist.");
        continue;
      }

      if (!include("bots/" + script + ".js")) {
        Misc.errorReport("Failed to include script: " + script);
        continue;
      }
    }

    // Small modified behaviour here
    if (typeof (globalThis[script]) === "function" || isIncluded("bots/" + script + ".js")) {
      try {
        if (typeof (globalThis[script]) !== "function") {
          throw new Error("Invalid script function name");
        }

        if (this.skipTown.indexOf(script) > -1 || Town.goToTown()) {
          print("ÿc2Starting script: ÿc9" + script);

          //@ts-ignore
          Messaging.sendToScript("tools/toolsthread.js", JSON.stringify({currScript: script}));

          reconfiguration = typeof Scripts[script] === 'object';

          if (reconfiguration) {
            print("ÿc2Copying Config properties from " + script + " object.");
            this.copy(Scripts[script], Config);
          }

          globalThis[script]();

          if (reconfiguration) {
            print("ÿc2Reverting back unmodified config properties.");
            this.copy(unmodifiedConfig, Config);
          }
        }
      } catch (error) {
        Misc.errorReport(error, script);
      }
    }
  }
});