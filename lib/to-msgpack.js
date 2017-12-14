"use strict";

const {WritableBuffer} = require("liberal-buffer");
const {initWriter} = require("./writer");

const YES = true;
const NO = false;

class MsgpackEncoder {

  createWritable() {
    const writable = new MsgpackWritable();
    writable._writeMsgpack = this._writeMsgpack;
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
    this._writeMsgpack(this, value);
    return this;
  }
}

exports.createEncoder = (options) => {
  const msgpack = new MsgpackEncoder();
  msgpack._writeMsgpack = initWriter(options);
  return msgpack;
};
