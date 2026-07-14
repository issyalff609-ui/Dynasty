"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightedPick = exports.pickUpToTwo = exports.shuffle = exports.pickOne = exports.randomInt = void 0;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
exports.randomInt = randomInt;
const pickOne = (items) => items[(0, exports.randomInt)(0, items.length - 1)];
exports.pickOne = pickOne;
const shuffle = (items) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
};
exports.shuffle = shuffle;
const pickUpToTwo = (items, allowZero) => {
    const roll = Math.random();
    let count = 1;
    if (allowZero && roll < 0.05) {
        count = 0;
    }
    else if (roll < 0.55) {
        count = 1;
    }
    else {
        count = 2;
    }
    return (0, exports.shuffle)(items).slice(0, count);
};
exports.pickUpToTwo = pickUpToTwo;
const weightedPick = (items) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) {
            return item.value;
        }
    }
    return items[items.length - 1].value;
};
exports.weightedPick = weightedPick;
