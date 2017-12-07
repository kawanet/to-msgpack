"use strict";

const BUFFER_SIZE = 65536;
const YES = true;
const NO = false;

const LinkedBuffer = require("from-msgpack/lib/linked-buffer").LinkedBuffer;

exports.init = (env) => {
  const initWriter = require("./writer").init(env);

  class ToMsgpack {
    //
  }

  return (options) => {
    let sharedEncoder;
    let isRunning;
    const writeAny = initWriter(options);

    class Encoder {
      //
    }

    const E = Encoder.prototype;
    E.cursor = 0;
    E.encode = encode;

    let instance = new ToMsgpack();
    instance.encode = sharedEncode;
    instance.createEncoder = createEncoder;
    return instance;

    function sharedEncode(value) {
      if (isRunning || !sharedEncoder) {
        sharedEncoder = createEncoder();
      }

      isRunning = YES;
      const buffer = sharedEncoder.encode(value);
      isRunning = NO;

      return buffer;
    }

    function createEncoder() {
      return new Encoder();
    }

    function encode(value) {
      const that = this;
      let current = that.chain || (that.chain = alloc());
      const first = current;
      let cursor = current.start;

      // start encoding
      writeAny(reserve, value);

      const end = current.end;
      current.end = cursor;
      current.next = void 0;
      const buffer = first.toBuffer();
      current.start = cursor;
      current.end = end;

      return buffer;

      function reserve(size, value, then) {
        let offset = cursor;

        cursor += size;

        if (!size && Buffer.isBuffer(value) && value.length) {
          insert(current, offset, value);
          current = current.next.next;
          offset = cursor = current.start;
        } else if (cursor > current.end) {
          current.end = offset;
          const next = alloc(Math.max(size, BUFFER_SIZE));
          current.next = next;
          that.chain = current = next;
          offset = 0;
          cursor = size;
        }

        return then && then(current.buffer, offset, value);
      }
    }

    function alloc(size) {
      return LinkedBuffer.from(Buffer.alloc(size || BUFFER_SIZE));
    }
  }
};

function insert(chain, offset, buffer) {
  const currentBuffer = chain.buffer;
  const currentEnd = chain.end;
  const currentNext = chain.next;

  chain.end = offset;
  chain = chain.next = LinkedBuffer.from(buffer);
  chain = chain.next = LinkedBuffer.from(currentBuffer, offset, currentEnd);
  chain.next = currentNext;
}

