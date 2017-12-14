/**
 * @see https://github.com/kawanet/to-msgpack
 */

import {WritableBuffer} from "liberal-buffer";

export declare function createEncoder(options?: object): MsgpackEncoder;

declare class MsgpackEncoder {
    encode(value: any): Buffer;

    createWritable(): MsgpackWritable;
}

declare class MsgpackWritable extends WritableBuffer {
    writeMsgpack(value: any): this;
}