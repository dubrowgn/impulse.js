export enum Types {
	Array = 0,
	Binary = 1,
	Float32 = 2,
	Float64 = 3,
	Int8 = 4,
	Int16 = 5,
	Int32 = 6,
	String = 7,
	Uint8 = 8,
	Uint16 = 9,
	Uint32 = 10,
};

export class BinarySerializer {
	protected dv: DataView;
	protected offset: number = 0;

	constructor(size: number);
	constructor(buffer: ArrayBuffer);
	constructor(buffer: any) {
		if (typeof buffer === "number")
			buffer = new ArrayBuffer(buffer as number);

		this.dv = new DataView(buffer);
	}

	seek(offset: number): this {
		this.offset = offset === undefined ? 0 : offset;
		return this;
	}

	position(): number {
		return this.offset;
	}

	length(): number {
		return this.dv.buffer.byteLength;
	}

	buffer(): ArrayBuffer {
		return this.dv.buffer;
	}

	get(getFunction: () => any): any {
		return getFunction.call(this);
	}

	getInt8(): number {
		++this.offset;
		return this.dv.getInt8(this.offset - 1);
	}

	getUint8(): number {
		++this.offset;
		return this.dv.getUint8(this.offset - 1);
	}

	getInt16(): number {
		this.offset += 2;
		return this.dv.getInt16(this.offset - 2);
	}

	getUint16(): number {
		this.offset += 2;
		return this.dv.getUint16(this.offset - 2);
	}

	getInt32(): number {
		this.offset += 4;
		return this.dv.getInt32(this.offset - 4);
	}

	getUint32(): number {
		this.offset += 4;
		return this.dv.getUint32(this.offset - 4);
	}

	getFloat32(): number {
		this.offset += 4;
		return this.dv.getFloat32(this.offset - 4);
	}

	getFloat64(): number {
		this.offset += 8;
		return this.dv.getFloat64(this.offset - 8);
	}

	getString(): string {
		let utf8 = this.getBinary();

		return new TextDecoder().decode(utf8);
	}

	getBinary(): ArrayBuffer {
		// length of the binary string is stored as a Uint32
		let length = this.dv.getUint32(this.offset);
		this.offset += 4 + length;

		// return the array buffer slice
		return this.dv.buffer.slice(this.offset - length, this.offset);
	}

	// assumes array of only one type
	getArray(getFunction: () => any): any[] {
		// length of the array is stored as a Uint32
		let length = this.dv.getUint32(this.offset);
		this.offset += 4;

		// foreach item in length, read it from the buffer
		let items = [];
		for (let i = 0; i < length; ++i) {
			items[i] = getFunction.call(this);
		}

		// return the new array of items
		return items;
	}

	set(value: any, setFunction: (value: any) => void): this {
		setFunction.call(this, value);

		return this;
	}

	setInt8(value: number): this {
		this.dv.setInt8(this.offset, value);
		++this.offset;

		return this;
	}

	setUint8(value: number): this {
		this.dv.setUint8(this.offset, value);
		++this.offset;

		return this;
	}

	setInt16(value: number): this {
		this.dv.setInt16(this.offset, value);
		this.offset += 2;

		return this;
	}

	setUint16(value: number): this {
		this.dv.setUint16(this.offset, value);
		this.offset += 2;

		return this;
	}

	setInt32(value: number): this {
		this.dv.setInt32(this.offset, value);
		this.offset += 4;

		return this;
	}

	setUint32(value: number): this {
		this.dv.setUint32(this.offset, value);
		this.offset += 4;

		return this;
	}

	setFloat32(value: number): this {
		this.dv.setFloat32(this.offset, value);
		this.offset += 4;

		return this;
	}

	setFloat64(value: number): this {
		this.dv.setFloat64(this.offset, value);
		this.offset += 8;

		return this;
	}

	setString(value: string): this {
		let utf8 = new TextEncoder().encode(value);

		return this.setBinary(utf8);
	}

	setBinary(value: Uint8Array): this;
	setBinary(value: ArrayBuffer): this;
	setBinary(value: any): this {
		if (value instanceof ArrayBuffer)
			value = new Uint8Array(value);

		// cache the length for later use
		let length = value.byteLength;

		// store the length of the binary string as a Uint32
		this.dv.setUint32(this.offset, length);
		this.offset += 4;

		// foreach byte in value, write a Uint8
		for (let i = 0; i < length; ++i) {
			this.dv.setUint8(this.offset, value[i]);
			++this.offset;
		}

		return this;
	}

	// assumes array of only one type
	setArray(value: any, setFunction: (value: any) => void): this {
		// cache the length for later use
		let length = value.length;

		// store the length of the array as a Uint32
		this.dv.setUint32(this.offset, length);
		this.offset += 4;

		// foreach item in length, write it to the buffer
		for (let i = 0; i < length; ++i) {
			setFunction.call(this, value[i]);
		}

		return this;
	}
};
