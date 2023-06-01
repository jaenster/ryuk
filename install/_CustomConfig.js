var CustomConfig = {
    /* Format:
        "Config_Filename_Without_Extension": ["array", "of", "profiles"]

        Multiple entries are separated by commas
    */


};


/** Ryuk specifics */
{
    const ensureFile = (file, content) => !FileTools.exists(file) && FileTools.writeText(file, content);

    // Run unit tests if that inclues in the window title
    if (me.windowtitle.includes("unit-tests")) {
        ensureFile("libs/config/unit-tests.js", "require('../Ryuk/tests/starter')")
        CustomConfig["unit-tests"] = [me.windowtitle];
    } else {
        const classes = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"];
        // All possible config files for char
        const files = [classes[me.classid] + "." + me.profile + ".js", me.realm + "." + classes[me.classid] + "." + me.charname + ".js", classes[me.classid] + "." + me.charname + ".js", me.profile + ".js"];

        // Load ryuk if no files are found
        if (!files.some(el => FileTools.exists("libs/config/" + el))) {
            ensureFile("libs/config/Ryuk.js", "require('../Ryuk/starter');");
            CustomConfig['Ryuk'] = [me.windowtitle]
        }
    }
}