#!/usr/bin/env mocha -R spec

const assert = require("assert");
const Exam = require("msgpack-test-js").Exam;
const msgpack = require("../to-msgpack").encoder();
const TITLE = __filename.split("/").pop();

// set 1 for types to run test
const TEST_TYPES = {
  array: 0,
  bignum: 0,
  binary: 0,
  bool: 0,
  map: 0,
  nil: 0,
  number: 1,
  string: 1,
  timestamp: 0
};

describe(TITLE, function() {

  // find exams for types supported by the library
  Exam.getExams(TEST_TYPES).forEach(function(exam) {

    // test for encoding
    exam.getTypes(TEST_TYPES).forEach(function(type) {
      let title = type + ": " + exam.stringify(type);
      it(title, function() {
        let value = exam.getValue(type);
        let buffer = msgpack.encode(value);
        assert(exam.matchMsgpack(buffer), exam.stringify(0));
      });
    });
  });
});
