"use strict";

const {Msg, MsgExt} = require("msg-interface");

const UINT16_NEXT = 0x10000;
const UINT32_NEXT = 0x100000000;
const UINT48_NEXT = 0x10000000000;
const undef = void 0;

exports.initWriter = (options) => {

  const writeForType = {
    boolean: writeBoolean,
    number: writeNumber,
    object: writeObject,
    string: writeString,
    "undefined": writeNil,
  };

  return writeAny;

  function writeAny(writable, value) {
    const type = typeof value;
    const writer = writeForType[type];
    if (writer) {
      return writer(writable, value);
    }
  }

  function writeObject(writable, value) {
    if (value === null) {
      return writeNil(writable);
    }

    if (Msg.isMsg(value)) {
      return writeMsg(writable, value);
    }

    if (Buffer.isBuffer(value)) {
      return writeBinary(writable, value);
    }

    if (Array.isArray(value)) {
      return writeArray(writable, value);
    }

    return writeMap(writable, value);
  }

  function writeArray(writable, value) {
    const length = value.length;

    if (length < 16) {
      writable.writeUInt8(0x90 | length);
    } else if (length < 65536) {
      writable.writeUInt8(0xdc);
      writable.writeUInt16BE(length);
    } else {
      writable.writeUInt8(0xdd);
      writable.writeUInt32BE(length);
    }

    for (const item of value) {
      writeAny(writable, item);
    }
  }

  function writeMap(writable, value) {
    const keys = Object.keys(value);
    const length = keys.length;

    if (length < 16) {
      writable.writeUInt8(0x80 | length);
    } else if (length < 65536) {
      writable.writeUInt8(0xde);
      writable.writeUInt16BE(length);
    } else {
      writable.writeUInt8(0xdf);
      writable.writeUInt32BE(length);
    }

    for (const key in value) {
      writeAny(writable, key);
      writeAny(writable, value[key]);
    }
  }
};

function writeNil(writable, value) {
  writable.writeUInt8(0xC0);
}

function writeBoolean(writable, value) {
  writable.writeUInt8(value ? 0xC3 : 0xC2);
}

function writeMsg(writable, value) {
  // TODO:
  const buffer = MsgExt.prototype.toMsgpack.call(value);
  if (buffer.length < 259) {
    return writable.writeBuffer(buffer);
  } else {
    return writable.insertBuffer(buffer);
  }
}

function writeBinary(writable, value) {
  const length = value.length;

  if (length < 256) {
    writable.writeUInt8(0xc4);
    writable.writeUInt8(length);
  } else if (length < 65536) {
    writable.writeUInt8(0xc5);
    writable.writeUInt16BE(length);
  } else {
    writable.writeUInt8(0xc6);
    writable.writeUInt32BE(length);
  }

  if (length < 256) {
    // smaller buffer
    writable.writeBuffer(value);
  } else {
    // larger buffer
    writable.insertBuffer(value);
  }
}

function writeNumber(writable, value) {
  const isInteger = (value | 0 === value) || (0 < value && value < UINT48_NEXT && !(value % 1));

  if (!isInteger) {
    writable.writeUInt8(0xcb);
    writable.writeDoubleBE(value);
  } else if (-33 < value && value < 128) {
    writable.writeInt8(value);
  } else if (value > 0) {
    if (value < 256) {
      writable.writeUInt8(0xcc);
      writable.writeUInt8(value);
    } else if (value < UINT16_NEXT) {
      writable.writeUInt8(0xcd);
      writable.writeUInt16BE(value);
    } else if (value < UINT32_NEXT) {
      writable.writeUInt8(0xce);
      writable.writeUInt32BE(value);
    } else {
      writable.writeUInt8(0xcf);
      writable.writeUInt32BE(Math.floor(value / UINT32_NEXT));
      writable.writeUInt32BE(value % UINT32_NEXT);
    }
  } else if (value < 0) {
    if (-129 < value) {
      writable.writeUInt8(0xd0);
      writable.writeInt8(value);
    } else if (-32769 < value) {
      writable.writeUInt8(0xd1);
      writable.writeUInt16BE(value);
    } else {
      writable.writeInt8(0xd2);
      writable.writeInt32BE(value);
    }
  }
}

function writeString(writable, value) {
  let expBodyLength = value.length;

  // reserve a single buffer and rewind
  const maxLength = 5 + expBodyLength * 3;
  writable.reserve(maxLength);
  writable.reserve(-maxLength);

  if (expBodyLength > 10) {
    // guess string byte length with the first character
    const c = value.charCodeAt(0);
    if (c > 0x07FF) {
      // U+0080 - U+07FF
      expBodyLength *= 3;
    } else if (c > 0x007F) {
      // U+0800 - U+FFFF
      expBodyLength *= 2;
    }
  }

  // token
  const expToken = _stringToken(expBodyLength);
  writable.writeUInt8(expToken);

  // byte length
  const expHeadWriter = _stringLengthWriteMethod(expBodyLength);
  if (expHeadWriter) writable[expHeadWriter](expBodyLength);

  // body
  const realBodyLength = writable.writeString(value);

  // exactly correct length
  if (expBodyLength === realBodyLength) return;

  // rewind
  const expHeadLength = _stringHeadLength(expBodyLength);
  writable.reserve(-expHeadLength - realBodyLength);

  // token (rewrite)
  const realToken = _stringToken(realBodyLength);
  writable.writeUInt8(realToken);

  // byte length (rewrite)
  const realHeadWriter = _stringLengthWriteMethod(expBodyLength);
  if (realHeadWriter) writable[realHeadWriter](expBodyLength);

  // body
  const realHeadLength = _stringHeadLength(realBodyLength);
  if (expHeadLength === realHeadLength) {
    // fast forward
    writable.reserve(realBodyLength);
  } else {
    // body (rewrite)
    writable.writeString(value);
  }
}

function _stringToken(length) {
  return (length < 32) ? (0xa0 | length) : (length < 256) ? 0xd9 : (length < 65536) ? 0xda : 0xdb;
}

function _stringLengthWriteMethod(length) {
  return (length < 32) ? undef : (length < 256) ? "writeUInt8" : (length < 65536) ? "writeUInt16BE" : "writeUInt32BE";
}

function _stringHeadLength(length) {
  return (length < 32) ? 1 : (length < 256) ? 2 : (length < 65536) ? 3 : 5;
}
