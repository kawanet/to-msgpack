"use strict";

const {WritableBuffer} = require("liberal-buffer");
const {initWriter} = require("./writer");

const YES = true;
const NO = false;

class ToMsgpack {
  //
}

exports.toMsgpack = (options) => {
  let sharedEncoder;
  let isRunning;
  const writeAny = initWriter(options);

  class MsgpackWritable extends WritableBuffer {
    //
  }

  const E = MsgpackWritable.prototype;
  E.writeMsgpack = writeMsgpack;

  let instance = new ToMsgpack();
  instance.encode = sharedEncode;
  instance.createWritable = createWritable;
  return instance;

  function sharedEncode(value) {
    if (isRunning || !sharedEncoder) {
      sharedEncoder = createWritable();
    }

    isRunning = YES;
    const buffer = sharedEncoder.writeMsgpack(value).toBuffer();
    isRunning = NO;

    return buffer;
  }

  function createWritable() {
    return new MsgpackWritable();
  }

  function writeMsgpack(value) {
    writeAny(this, value);
    return this;
  }
};
