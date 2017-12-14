"use strict";

const {WritableBuffer} = require("liberal-buffer");
const {initWriter} = require("./writer");

const YES = true;
const NO = false;

class MsgpackEncoder {

  createWritable() {
    const writable = new MsgpackWritable();
    writable.writeMsgpack = this._writeMsgpack;
    return writable;
  }

  encode(value) {
    const writable = !this.running && this.writable || (this.writable = this.createWritable());

    // end the last for safe
    writable.end();

    this.running = YES;
    const buffer = writable.writeMsgpack(value).toBuffer();
    this.running = NO;

    return buffer;
  }
}

class MsgpackWritable extends WritableBuffer {

  writeMsgpack(value) {
    throw new Error("writeMsgpack() not implemented");
  }
}

exports.createEncoder = (options) => {
  const writeAny = initWriter(options);

  const msgpack = new MsgpackEncoder();
  msgpack._writeMsgpack = writeMsgpack;
  return msgpack;

  function writeMsgpack(value) {
    writeAny(this, value);
    return this;
  }
};
