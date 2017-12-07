"use strict";

// import * as assert from "assert";
const assert = require("assert");

// import {toMsgpack} from "../";
// const msgpack = toMsgpack();
const msgpack = require("../index").toMsgpack();

const TITLE = __filename.split("/").pop();

describe(TITLE, () => {
	it("msgpack.encode", () => {
		const buf = msgpack.encode(-1);
		assert.equal(buf.length, 1);
		assert.equal(buf[0], 255);
	});

	it("msgpack.createEncoder().encode()", () => {
		const buf = msgpack.createEncoder().encode(127);
		assert.equal(buf.length, 1);
		assert.equal(buf[0], 127);
	});
});
