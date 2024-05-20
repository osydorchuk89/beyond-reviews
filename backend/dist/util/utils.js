"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatStrings = void 0;
const concatStrings = (array) => {
    array.sort();
    let concat = "";
    for (let i = 0; i < array.length; i++) {
        concat = concat + array[i];
    }
    return concat;
};
exports.concatStrings = concatStrings;
