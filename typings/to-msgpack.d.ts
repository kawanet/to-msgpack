/**
 * @see https://github.com/kawanet/to-msgpack
 */

import {WritableBuffer} from "liberal-buffer";

export declare function toMsgpack(options?: object): ToMsgpack;

declare class ToMsgpack {
    encode(value: any): Buffer;

    createWritable(): MsgpackWritable;
}

declare class MsgpackWritable extends WritableBuffer {
    writeMsgpack(value: any): this;
}