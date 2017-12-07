"use strict";
// import * as assert from "assert";
var assert = require("assert");
// import {toMsgpack} from "../";
// const msgpack = toMsgpack();
var msgpack = require("../index").toMsgpack();
var TITLE = __filename.split("/").pop();
describe(TITLE, function () {
    it("msgpack.encode", function () {
        var buf = msgpack.encode(-1);
        assert.equal(buf.length, 1);
        assert.equal(buf[0], 255);
    });
    it("msgpack.createEncoder().encode()", function () {
        var buf = msgpack.createEncoder().encode(127);
        assert.equal(buf.length, 1);
        assert.equal(buf[0], 127);
    });
});
