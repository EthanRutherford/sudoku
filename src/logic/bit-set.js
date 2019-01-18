class BitSet extends Number {
	add(bit) {
		return new BitSet(this | 1 << (bit - 1));
	}
	remove(bit) {
		return new BitSet(this & ~(1 << (bit - 1)));
	}
	toggle(bit) {
		return new BitSet(this ^ (1 << (bit - 1)));
	}
	has(bit) {
		return !!(this & (1 << (bit - 1)));
	}
	get values() {
		let field = this;
		const values = [];
		for (let i = 1; field; i++) {
			if (field & 1) {
				values.push(i);
			}

			field >>= 1;
		}

		return values;
	}
	get size() {
		let field = this;
		let count = 0;
		while (field) {
			field &= field - 1;
			count++;
		}

		return count;
	}
	toString() {
		return String.fromCharCode(this + 32);
	}
}

BitSet.fromString = function(string) {
	return new BitSet(string.charCodeAt(0) - 32);
};

module.exports = BitSet;
