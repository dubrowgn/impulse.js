/**
 * @namespace
 */
Impulse.Networking = (function() {
	var Networking = {};

	Networking.Types = {
		Array:0,
		Binary:1,
		Float32:2,
		Float64:3,
		Int8:4,
		Int16:5,
		Int32:6,
		String:7,
		Uint8:8,
		Uint16:9,
		Uint32:10
	}; // enum

	Networking.BinarySerializer = (function() {
		var BinarySerializer = function(arrayBuffer) {
			if (typeof(arrayBuffer) === "number")
				this._dv = new DataView(new ArrayBuffer(arrayBuffer));
			else
				this._dv = new DataView(arrayBuffer);
		}; // class BinarySerializer

		BinarySerializer.prototype._dv = undefined;
		BinarySerializer.prototype._offset = 0;

		// POSITION ====================================================================

		BinarySerializer.prototype.seek = function(offset) {
			this._offset = offset === undefined ? 0 : offset;
			return this;
		};

		BinarySerializer.prototype.position = function() {
			return this._offset;
		};

		BinarySerializer.prototype.length = function() {
			return this._dv.buffer.byteLength;
		};

		// BUFFER ======================================================================

		BinarySerializer.prototype.buffer = function() {
			return this._dv.buffer;
		};

		// READ FUNCTIONS ==============================================================

		BinarySerializer.prototype.get = function(getFunction) {
			getFunction.call(this);
		};

		BinarySerializer.prototype.getInt8 = function() {
			++this._offset;
			return this._dv.getInt8(this._offset - 1);
		};

		BinarySerializer.prototype.getUint8 = function() {
			++this._offset;
			return this._dv.getUint8(this._offset - 1);
		};

		BinarySerializer.prototype.getInt16 = function() {
			this._offset += 2;
			return this._dv.getInt16(this._offset - 2);
		};

		BinarySerializer.prototype.getUint16 = function() {
			this._offset += 2;
			return this._dv.getUint16(this._offset - 2);
		};

		BinarySerializer.prototype.getInt32 = function() {
			this._offset += 4;
			return this._dv.getInt32(this._offset - 4);
		};

		BinarySerializer.prototype.getUint32 = function() {
			this._offset += 4;
			return this._dv.getUint32(this._offset - 4);
		};

		BinarySerializer.prototype.getFloat32 = function() {
			this._offset += 4;
			return this._dv.getFloat32(this._offset - 4);
		};

		BinarySerializer.prototype.getFloat64 = function() {
			this._offset += 8;
			return this._dv.getFloat64(this._offset - 8);
		};

		BinarySerializer.prototype.getString = function() {
			// length of the string is stored as a Uint32
			var length = this._dv.getUint32(this._offset);
			this._offset += 4;

			// foreach char in length, read a Uint16 and convert to character
			var str = "";
			for (var i = 0; i < length; ++i) {
				str += String.fromCharCode(this._dv.getUint16(this._offset));
				this._offset += 2;
			} // for( i )

			// join all the characters and return new string
			return str;
		};

		BinarySerializer.prototype.getBinary = function() {
			// length of the binary string is stored as a Uint32
			var length = this._dv.getUint32(this._offset);
			this._offset += 4 + length;

			// return the array buffer slice
			return this._dv.buffer.slice(this._offset - length, this._offset);
		};

		// assumes array of only one type
		BinarySerializer.prototype.getArray = function(getFunction) {
			// length of the array is stored as a Uint32
			var length = this._dv.getUint32(this._offset);
			this._offset += 4;

			// foreach item in length, read it from the buffer
			var items = [];
			for (var i = 0; i < length; ++i) {
				items[i] = getFunction.call(this);
			} // for( i )

			// return the new array of items
			return items;
		};

		// WRITE FUNCTIONS =============================================================

		BinarySerializer.prototype.set = function(value, setFunction) {
			setFunction.call(this, value);

			return this;
		};

		BinarySerializer.prototype.setInt8 = function(value) {
			this._dv.setInt8(this._offset, value);
			++this._offset;

			return this;
		};

		BinarySerializer.prototype.setUint8 = function(value) {
			this._dv.setUint8(this._offset, value);
			++this._offset;

			return this;
		};

		BinarySerializer.prototype.setInt16 = function(value) {
			this._dv.setInt16(this._offset, value);
			this._offset += 2;

			return this;
		};

		BinarySerializer.prototype.setUint16 = function(value) {
			this._dv.setUint16(this._offset, value);
			this._offset += 2;

			return this;
		};

		BinarySerializer.prototype.setInt32 = function(value) {
			this._dv.setInt32(this._offset, value);
			this._offset += 4;

			return this;
		};

		BinarySerializer.prototype.setUint32 = function(value) {
			this._dv.setUint32(this._offset, value);
			this._offset += 4;

			return this;
		};

		BinarySerializer.prototype.setFloat32 = function(value) {
			this._dv.setFloat32(this._offset, value);
			this._offset += 4;

			return this;
		};

		BinarySerializer.prototype.setFloat64 = function(value) {
			this._dv.setFloat64(this._offset, value);
			this._offset += 8;

			return this;
		};

		BinarySerializer.prototype.setString = function(value) {
			// cache the length for later use
			var length = value.length;

			// store the length of the string as a Uint32
			this._dv.setUint32(this._offset, length);
			this._offset += 4;

			// foreach char in value, write a Uint16 for that char
			for (var i = 0; i < length; ++i) {
				this._dv.setUint16(this._offset, value.charCodeAt(i));
				this._offset += 2;
			} // for( i )

			return this;
		};

		BinarySerializer.prototype.setBinary = function(value) {
			// cache the length for later use
			var length = value.byteLength;

			// store the length of the binary string as a Uint32
			this._dv.setUint32(this._offset, length);
			this._offset += 4;

			// foreach byte in value, write a Uint8
			var u8Value = new Uint8Array(value);
			for (var i = 0; i < length; ++i) {
				this._dv.setUint8(this._offset, u8Value[i]);
				++this._offset;
			} // for( i )

			return this;
		};

		// assumes array of only one type
		BinarySerializer.prototype.setArray = function(value, setFunction) {
			// cache the length for later use
			var length = value.length;

			// store the length of the array as a Uint32
			this._dv.setUint32(this._offset, length);
			this._offset += 4;

			// foreach item in length, write it to the buffer
			for (var i = 0; i < length; ++i) {
				setFunction.call(this, value[i]);
			} // for( i )

			return this;
		};

		return BinarySerializer;
	})();

	Networking.Sanitizer = (function() {
		var Sanitizer = {};

		// use to sanitize user content before attaching to the HTML DOM to prevent XSS attacks
		Sanitizer.sanitizeForDom = function(str) {
			str = str.replace(/&/g, "&amp;");
			str = str.replace(/</g, "&lt;");
			str = str.replace(/>/g, "&gt;");
			str = str.replace(/"/g, "&quot;");
			str = str.replace(/'/g, "&#x27;");
			str = str.replace(/\//g, "&#x2F;");

			return str;
		};

		return Sanitizer;
	})();

	return Networking;
});
