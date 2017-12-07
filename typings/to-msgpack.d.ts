/**
 * @see https://github.com/kawanet/to-msgpack
 */

export declare function toMsgpack(options?: object): ToMsgpack;

declare class ToMsgpack
{
	encode(value: any): Buffer;

	createEncoder(): Encoder;
}

declare class Encoder
{
	encode(value: any): Buffer;
}