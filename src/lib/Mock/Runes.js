(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    } else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../Mock"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    var Mock_1 = require("../Mock");
    var exportObjects = {};
    var size = getTableSize('gems');
    for (var i = 35 /*el*/; i < size; i++) {
        var rune = getTableRow('gems', i);
        exportObjects[rune.letter] = new Mock_1.MockItem({
            overrides: {
                stat: 0,
                skill: [],
                flags: 0,
            }
        });
    }
    exports.default = exportObjects;
});
