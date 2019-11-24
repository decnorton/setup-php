"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
/**
 * Add matches using the Actions Toolkit problem matchers syntax
 * https://github.com/actions/toolkit/blob/master/docs/problem-matchers.md
 */
function addMatchers() {
    const matchersPath = path.join(__dirname, '..', '.github/matchers');
    console.log(`##[add-matcher]${path.join(matchersPath, 'phpunit.json')}`);
}
exports.addMatchers = addMatchers;
