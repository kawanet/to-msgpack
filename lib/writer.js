"use strict";

const Msg = require("from-msgpack/lib/msg").Msg;
const MsgExt = require("from-msgpack/lib/msg-ext").MsgExt;

const UINT16_NEXT = 0x10000;
const UINT32_NEXT = 0x100000000;
const UINT48_NEXT = 0x10000000000;
const undef = void 0;
const forEach = [].forEach;

exports.init = (env) => {
  return (options) => {
    const writeForType = {
      boolean: writeBoolean,
      number: writeNumber,
      object: writeObject,
      string: writeString,
      "undefined": writeNil,
    };

    return writeAny;

    function writeAny(reserve, value) {
      const type = typeof value;
      const writer = writeForType[type];
      if (writer) writer(reserve, value);
    }

    function writeNil(reserve, value) {
      reserve(1, 0xC0, writeInt8);
    }

    function writeBoolean(reserve, value) {
      reserve(1, (value ? 0xC3 : 0xC2), writeInt8);
    }

    function writeBinary(reserve, value) {
      const length = value.length;

      if (length < 256) {
        reserve(1, 0xc4, writeInt8);
        reserve(1, length, writeInt8);
      } else if (length < 65536) {
        reserve(1, 0xc5, writeInt8);
        reserve(2, length, writeUInt16BE);
      } else {
        reserve(1, 0xc6, writeInt8);
        reserve(4, length, writeUInt32BE);
      }

      reserve(length, undef, (buffer, offset) => {
        value.copy(buffer, offset);
      });
    }

    function writeNumber(reserve, value) {
      const isInteger = (value | 0 === value) || (0 < value && value < UINT48_NEXT && !(value % 1));

      if (!isInteger) {
        reserve(1, 0xcb, writeInt8);
        reserve(8, value, writeDoubleBE);
      } else if (-33 < value && value < 128) {
        reserve(1, value, writeInt8);
      } else if (value > 0) {
        if (value < 256) {
          reserve(1, 0xcc, writeInt8);
          reserve(1, value, writeInt8);
        } else if (value < UINT16_NEXT) {
          reserve(1, 0xcd, writeInt8);
          reserve(2, value, writeUInt16BE);
        } else if (value < UINT32_NEXT) {
          reserve(1, 0xce, writeInt8);
          reserve(4, value, writeUInt32BE);
        } else {
          reserve(1, 0xcf, writeInt8);
          reserve(8, value, writeUint64BE);
        }
      } else if (value < 0) {
        if (-129 < value) {
          reserve(1, 0xd0, writeInt8);
          reserve(1, value, writeInt8);
        } else if (-32769 < value) {
          reserve(1, 0xd1, writeInt8);
          reserve(2, value, writeUInt16BE);
        } else {
          reserve(1, 0xd2, writeInt8);
          reserve(4, value, writeInt32BE);
        }
      }
    }

    function writeString(reserve, value) {
      const tempLen = value.length * 3;
      return reserve(5 + tempLen, undef, (buffer, origin) => {
        const tempPos = checkSize(undef, origin, tempLen); // temporary position
        const realLen = buffer.write(value, tempPos, tempLen);
        const finalPos = checkSize(buffer, origin, realLen); // final position

        if (finalPos < tempPos) {
          buffer.copy(buffer, finalPos, tempPos, tempPos + realLen);
        }

        const rewind = finalPos - origin - 5 + realLen - tempLen;
        if (rewind) reserve(rewind);
      });
    }

    function checkSize(buffer, start, size) {
      let pos = start + 1;
      let head;
      if (size < 32) {
        head = 0xa0 + size;
      } else if (size < 256) {
        head = 0xd9;
        if (buffer) buffer[pos] = size;
        pos++;
      } else if (size < UINT16_NEXT) {
        head = 0xda;
        if (buffer) writeUInt16BE(buffer, pos, size);
        pos += 2;
      } else {
        head = 0xdb;
        if (buffer) writeUInt32BE(buffer, pos, size);
        pos += 4;
      }
      if (buffer) buffer[start] = head;
      return pos;
    }

    function writeObject(reserve, value) {
      if (value === null) {
        return writeNil(reserve, value);
      }

      if (Msg.isMsg(value)) {
        // dummy
        return MsgExt.prototype.toMsgpack.call(value, reserve);
      }

      if (Buffer.isBuffer(value)) {
        return writeBinary(reserve, value);
      }

      if (Array.isArray(value)) {
        return writeArray(reserve, value);
      }

      return writeMap(reserve, value);
    }

    function writeArray(reserve, value) {
      const length = value.length;

      if (length < 16) {
        reserve(1, (0x90 | length), writeInt8);
      } else if (length < 65536) {
        reserve(1, 0xdc, writeInt8);
        reserve(2, length, writeUInt16BE);
      } else {
        reserve(1, 0xdd, writeInt8);
        reserve(4, length, writeUInt32BE);
      }

      forEach.call(value, each);

      function each(value) {
        writeAny(reserve, value);
      }
    }

    function writeMap(reserve, value) {
      const keys = Object.keys(value);
      const length = keys.length;

      if (length < 16) {
        reserve(1, (0x80 | length), writeInt8);
      } else if (length < 65536) {
        reserve(1, 0xde, writeInt8);
        reserve(2, length, writeUInt16BE);
      } else {
        reserve(1, 0xdf, writeInt8);
        reserve(4, length, writeUInt32BE);
      }

      keys.forEach(each);

      function each(key) {
        writeAny(reserve, key);
        writeAny(reserve, value[key]);
      }
    }
  };
};

function writeInt8(buffer, offset, value) {
  buffer[offset] = value & 255;
}

function writeUInt16BE(buffer, offset, value) {
  buffer[offset] = (value >> 8) & 255;
  buffer[offset + 1] = value & 255;
}

function writeInt32BE(buffer, offset, value) {
  buffer.writeInt32BE(value, offset);
}

function writeUInt32BE(buffer, offset, value) {
  buffer.writeUInt32BE(value, offset);
}

function writeUint64BE(buffer, offset, value) {
  writeUInt32BE(buffer, offset, Math.floor(value / UINT32_NEXT));
  writeUInt32BE(buffer, offset + 4, value % UINT32_NEXT);
}

function writeDoubleBE(buffer, offset, value) {
  buffer.writeDoubleBE(value, offset);
}