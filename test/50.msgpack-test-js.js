"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const _1 = require("../");
const msgpack_test_js_1 = require("msgpack-test-js");
const msgpack = _1.createEncoder();
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
    msgpack_test_js_1.Exam.getExams(TEST_TYPES).forEach((exam) => {
        // test for encoding
        exam.getTypes(TEST_TYPES).forEach((type) => {
            let title = type + ": " + exam.stringify(type);
            it(title, () => {
                let value = exam.getValue(type);
                let buffer = msgpack.encode(value);
                const hint = exam.stringify(0) + " != " + binaryToHex(buffer);
                assert(exam.matchMsgpack(buffer), hint);
            });
        });
    });
});
function binaryToHex(buffer) {
    return [].map.call(buffer, toHex).join("-");
}
function toHex(v) {
    return (v > 15 ? "" : "0") + v.toString(16);
}
