"use strict";

const assert = require("assert");
// const Exam = require("msgpack-test-js").Exam;
const Exam = require("msgpack-test-js").Exam;
const msgpack = require("../").toMsgpack();
const TITLE = __filename.split("/").pop();

// set 1 for types to run test
const TEST_TYPES = {
  array: 1,
  bignum: 0,
  binary: 1,
  bool: 1,
  ext: 1,
  map: 1,
  nil: 1,
  number: 1,
  string: 1,
  timestamp: 0
};

describe(TITLE, () => {

  // find exams for types supported by the library
  Exam.getExams(TEST_TYPES).forEach((exam) => {

    // test for encoding
    exam.getTypes(TEST_TYPES).forEach((type) => {
      let title = type + ": " + exam.stringify(type);
      it(title, () => {
        let value = exam.getValue(type);
        let buffer = msgpack.encode(value);
        // console.warn("actual:   " + binaryToHex(buffer));
        // console.warn("expected: " + exam.stringify(0));
        assert(exam.matchMsgpack(buffer), exam.stringify(0));
      });
    });
  });
});

function binaryToHex(buffer) {
  return [].map.call(buffer, toHex).join("-");
}

function toHex(v) {
  return (v > 15 ? "" : "0") + v.toString(16)
}