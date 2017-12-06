/**
 * @see https://github.com/kawanet/to-msgpack
 */

const toMsgpack = ((module) => {

  const defaultSize = 65536;
  const UINT16_MAX = 0x10000;
  const UINT32_MAX = 0x100000000;
  const UINT48_MAX = 0x10000000000 - 1;
  const undef = void 0;
  const YES = true;
  const NO = false;

  // toMsgpack pseudo class

  const toMsgpack = {encoder: encoder};

  // commonJS
  if (module) module.exports = toMsgpack;

  return toMsgpack;

  function encoder(options) {
    let startEncode;
    let isRunning;
    if (!options) options = {};
    return {encode: encode};

    /**
     * @param value
     * @return {Buffer|void}
     */

    function encode(value) {
      if (isRunning || !startEncode) {
        startEncode = makeEncode(options);
      }

      // re-entering to startEncode is not allowed.
      isRunning = YES;
      let buffer = startEncode(value);
      isRunning = NO;

      return buffer;
    }
  }

  function makeEncode(options) {
    let buffer;
    let offset;
    let start;
    let nextSize;
    return startEncode;

    function startEncode(value) {
      // reset size
      nextSize = defaultSize;

      // remember offset before started
      start = offset;

      // start encoding
      writeAny(value);

      // something wrong
      if (!buffer) return;

      // return buffer fragment
      return buffer.slice(start, offset);
    }

    function writeAny(value) {
      let type = typeof value;
      if (type === "number") {
        writeNumber(value);
      } else if (type === "string") {
        writeString(value);
      }
    }

    function writeString(value) {
      let max = value.length * 3;
      let size = max;
      let orig = reserve(5 + max);
      let pos = checkSize(NO);
      size = buffer.write(value, pos, max);
      let newPos = checkSize(YES);

      if (newPos < pos) {
        buffer.copy(buffer, newPos, pos, pos + size);
      }

      offset = newPos + size;

      function checkSize(write) {
        let head;
        let start = orig + 1;
        if (size < 32) {
          head = 0xa0 + size;
        } else if (size < 256) {
          head = 0xd9;
          if (write) buffer[start] = size;
          start++;
        } else if (size < UINT16_MAX) {
          head = 0xda;
          if (write) writeUInt16BE(size, start);
          start += 2;
        } else {
          head = 0xdb;
          if (write) writeUInt32BE(size, start);
          start += 4;
        }
        if (write) buffer[orig] = head;
        return start;
      }
    }

    function writeNumber(value) {
      let pos;
      let isInteger = (value | 0 === value) || (0 < value && value < UINT48_MAX && !(value % 1));

      if (!isInteger) {
        pos = reserve(9);
        buffer[pos] = 0xcb;
        buffer.writeDoubleBE(value, pos + 1);
      } else if (-33 < value && value < 128) {
        pos = reserve(1);
        buffer[pos] = value;
      } else if (value > 0) {
        if (value < 256) {
          pos = reserve(2);
          buffer[pos] = 0xcc;
          buffer[pos + 1] = value & 255;
        } else if (value < UINT16_MAX) {
          pos = reserve(3);
          buffer[pos] = 0xcd;
          writeUInt16BE(value, pos + 1);
        } else if (value < UINT32_MAX) {
          pos = reserve(5);
          buffer[pos] = 0xce;
          writeUInt32BE(value, pos + 1);
        } else {
          pos = reserve(9);
          buffer[pos] = 0xcf;
          writeUInt32BE(Math.floor(value / UINT32_MAX), pos + 1);
          writeUInt32BE(value % UINT32_MAX, pos + 5);
        }
      } else if (value < 0) {
        if (-129 < value) {
          pos = reserve(2);
          buffer[pos] = 0xd0;
          buffer[pos + 1] = value & 255;
        } else if (-32769 < value) {
          pos = reserve(3);
          buffer[pos] = 0xd1;
          buffer[pos + 1] = (value >> 8) & 255;
          buffer[pos + 2] = value & 255;
        } else {
          pos = reserve(5);
          buffer[pos] = 0xd2;
          buffer.writeInt32BE(value, pos + 1)
        }
      }
    }

    function writeUInt16BE(value, pos) {
      buffer[pos] = (value >> 8) & 255;
      buffer[pos + 1] = value & 255;
    }

    function writeUInt32BE(value, pos) {
      buffer.writeUInt32BE(value, pos);
    }

    function reserve(size) {
      // create new buffer
      if (!buffer) {
        buffer = Buffer.alloc(nextSize);
        start = offset = 0;
      }

      let prevOffset = offset;
      offset += size;

      // buffer size shortage
      if (offset > nextSize) {
        let prevBuffer = buffer;
        let prevStart = start;
        let prevSize = prevOffset - start;

        // double size
        while (offset > nextSize) {
          nextSize *= 2;
        }

        // create larger buffer
        buffer = undef;
        offset = prevSize;
        reserve(size);

        // copy the current fragment
        if (prevSize) {
          prevBuffer.copy(buffer, 0, prevStart, prevOffset);
        }

        return prevSize;
      }

      return prevOffset;
    }
  }
})("undefined" !== typeof module && module);
