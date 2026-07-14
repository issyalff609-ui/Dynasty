"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = void 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
exports.clamp = clamp;
