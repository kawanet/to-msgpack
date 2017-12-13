"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const _1 = require("../");
const msgpack = _1.toMsgpack();
const TITLE = __filename.split("/").pop();
describe(TITLE, () => {
    it("msgpack.encode", () => {
        const buf = msgpack.encode(-1);
        assert.equal(buf.length, 1);
        assert.equal(buf[0], 255);
    });
    it("msgpack.createWritable().writeMsgpack().toBuffer()", () => {
        const buf = msgpack.createWritable().writeMsgpack(127).toBuffer();
        assert.equal(buf.length, 1);
        assert.equal(buf[0], 127);
    });
});
