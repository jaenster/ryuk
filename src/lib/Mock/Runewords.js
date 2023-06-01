var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    } else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Mock", "../enums", "../sdk"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.Runewords = void 0;
    var Mock_1 = require("./Mock");
    var enums_1 = require("../enums");
    var sdk_1 = __importDefault(require("../sdk"));
    var _runewords = {};
    var size = getTableSize('runes');
    for (var i = 0; i < size; i++) {
        var runeword = getTableRow('runes', i);
        if (!runeword.complete)
            continue;
        var stats = [];
        for (var j = 1; j < 8; j++) {
            var code = runeword['t1code' + j];
            if (code > -1) {
                var _a = [runeword['t1min' + j], runeword['t1max' + j], runeword['t1param' + j]], min = _a[0],
                    max = _a[1], minor = _a[2];
                var property = getTableRow('properties', code);
                stats.push({
                    min: min,
                    max: max,
                    minor: minor,
                    stats: [property.stat1,
                        property.stat2,
                        property.stat3,
                        property.stat4,
                        property.stat5,
                        property.stat6,
                        property.stat7,].filter(function (el) {
                        return el !== 0 && el !== 65535;
                    })
                });
            }
        }
        // 35 is base of rune in gems
        // 610 is first rune
        for (var i_1 = 1; i_1 < 6; i_1++) {
            var rune = runeword['rune' + i_1];
            if (rune > -1) {
                console.log(rune, getTableRow('gems', 35 + (rune - 610)));
            }
        }
        var mock = new Mock_1.MockItem({
            overrides: {
                stat: stats.reduce(function (acc, _a) {
                    var stats = _a.stats, minor = _a.minor, min = _a.min;
                    stats.forEach(function (stat) {
                        return acc.push([stat, minor, min]);
                    });
                    return acc;
                }, []),
                skill: [],
                flags: 0,
            },
        });
        var itemTypes = [runeword.itype1, runeword.itype2, runeword.itype3, runeword.itype4, runeword.itype5, runeword.itype6].filter(function (el) {
            return el && el !== 65535;
        });
        var runes = [runeword.rune1, runeword.rune2, runeword.rune3, runeword.rune4, runeword.rune5, runeword.rune6].filter(function (r) {
            return Object.values(enums_1.Runes).filter(function (v) {
                return !isNaN(v);
            }).includes(r);
        });
        _runewords[runeword.rune] = {
            name: runeword.rune,
            mock: mock,
            itemTypes: itemTypes,
            runes: runes
        };
    }
    delete _runewords.default;
    // console.log(Object.keys(_runewords).sort().join("\n"));
    var Runewords = /** @class */ (function () {
        function Runewords() {
        }

        Object.defineProperty(Runewords, "all", {
            get: function () {
                return _runewords;
            },
            enumerable: false,
            configurable: true
        });
        Runewords.possibleRunewordsWithItem = function (item) {
            return Object.values(Runewords.all).filter(function (runeword) {
                var testRunes = runeword.runes.includes(item.classid);
                if (testRunes) {
                    // if it is a rune, no need to test anything else
                    return true;
                }
                var testQuality = item.quality && [enums_1.Qualities.Low, enums_1.Qualities.Normal, enums_1.Qualities.Superior].includes(item.quality);
                if (!testQuality) {
                    // if item is not low, normal, superior, no need to test anything else
                    return false;
                }
                var testSockets = item.getStat(sdk_1.default.stats.Numsockets) === runeword.runes.length;
                if (!testSockets) {
                    // if sockets don't match, no need to test anything else
                    return false;
                }
                var testType = item.itemType && runeword.itemTypes.includes(item.itemType);
                var isShield = [sdk_1.default.itemtype.shield, sdk_1.default.itemtype.auricshields, sdk_1.default.itemtype.voodooheads].includes(item.itemType);
                if (isShield && !testType) {
                    // if it is a shield, test if runeword accepts any shield
                    testType = runeword.itemTypes.includes(sdk_1.default.itemtype.anyshield);
                }
                var isHelm = [sdk_1.default.itemtype.primalhelm, sdk_1.default.itemtype.pelt, sdk_1.default.itemtype.circlet].includes(item.itemType);
                if (isHelm && !testType) {
                    // if it is a druid pelt or barb helm or circlet, test if runeword accepts any helm
                    testType = runeword.itemTypes.includes(sdk_1.default.itemtype.helm);
                }
                // ToDo: same for helms, barb helms, druid pelts, circlets
                // ToDo: same for weapons, missile weapons (bows, crossbows), melee weapons
                return testType;
            });
        };
        Runewords.possibleRunewordsWithItems = function (items) {
            return items.map(this.possibleRunewordsWithItem)
                .reduce(function (a, b) {
                    return a.intersection(b);
                });
        };
        Runewords.mockItem = function (classid, sockets, itemType, quality) {
            if (quality === void 0) {
                quality = enums_1.Qualities.Normal;
            }
            return new Mock_1.MockItem({
                overrides: {
                    stat: [[sdk_1.default.stats.Numsockets, 0, sockets]],
                    flags: 0,
                    skill: []
                },
                classid: classid, quality: quality, itemType: itemType
            });
        };
        Runewords.mockBodyArmor = function (classid, sockets, quality) {
            if (quality === void 0) {
                quality = enums_1.Qualities.Normal;
            }
            return this.mockItem(classid, sockets, sdk_1.default.itemtype.armor, quality);
        };
        Runewords.mockWeapon = function (classid, sockets, itemType, quality) {
            if (itemType === void 0) {
                itemType = sdk_1.default.itemtype.weapon;
            }
            if (quality === void 0) {
                quality = enums_1.Qualities.Normal;
            }
            return this.mockItem(classid, sockets, itemType, quality);
        };
        Runewords.mockShield = function (classid, sockets, itemType, quality) {
            if (itemType === void 0) {
                itemType = sdk_1.default.itemtype.anyshield;
            }
            if (quality === void 0) {
                quality = enums_1.Qualities.Normal;
            }
            return this.mockItem(classid, sockets, itemType, quality);
        };
        /**
         * Creates a mock enigma with mage plate normal base and 750 defense stat
         */
        Runewords.mockEnigma = function (classid, quality) {
            if (classid === void 0) {
                classid = 373;
            }
            if (quality === void 0) {
                quality = enums_1.Qualities.Normal;
            }
            return new Mock_1.MockItem(__assign(__assign({}, this.mockBodyArmor(classid, 3, quality)), Runewords.all["Enigma"].mock));
        };
        return Runewords;
    }());
    exports.Runewords = Runewords;
});
