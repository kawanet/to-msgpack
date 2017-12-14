"use strict";

import * as assert from "assert";
import {createEncoder} from "../";

const msgpack = createEncoder();
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
