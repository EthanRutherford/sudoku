function chooseCore(array, remaining, offset, acc, results) {
	if (remaining === 0) {
		results.push(acc);
		return results;
	}

	for (let i = offset; i + remaining <= array.length; i++) {
		chooseCore(array, remaining - 1, i + 1, [...acc, array[i]], results);
	}

	return results;
}

function chooseK(array, k) {
	return chooseCore(array, k, 0, [], []);
}

module.exports = chooseK;
