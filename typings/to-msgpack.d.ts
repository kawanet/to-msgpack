/**
 * @see https://github.com/kawanet/to-msgpack
 */

declare export class toMsgpack
{
	static encoder(options?: object): Encoder;
}

declare class Encoder
{
	encode(value: any): Buffer;
}