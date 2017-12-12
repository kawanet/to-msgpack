"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var _1 = require("../");
var msgpack = _1.toMsgpack();
var TITLE = __filename.split("/").pop();
describe(TITLE, function () {
    it("msgpack.encode", function () {
        var buf = msgpack.encode(-1);
        assert.equal(buf.length, 1);
        assert.equal(buf[0], 255);
    });
    it("msgpack.createWritable().writeMsgpack().toBuffer()", function () {
        var buf = msgpack.createWritable().writeMsgpack(127).toBuffer();
        assert.equal(buf.length, 1);
        assert.equal(buf[0], 127);
    });
});
