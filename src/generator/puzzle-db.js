const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("sudoku", 4);

		request.onupgradeneeded = function(event) {
			const database = event.target.result;

			// drop existing tables
			for (const name of database.objectStoreNames) {
				database.deleteObjectStore(name);
			}

			// create a table for each difficulty
			for (const difficulty of DIFFICULTIES) {
				database.createObjectStore(difficulty, {autoIncrement: true});
			}
		};

		request.onerror = reject;
		request.onsuccess = function() {
			resolve(this.result);
		};
	});
}

function storePuzzle(db, difficulty, puzzle) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([difficulty], "readwrite");
		const objectStore = transaction.objectStore(difficulty);

		const request = objectStore.add(puzzle);
		request.onerror = reject;
		request.onsuccess = resolve;
	});
}

function getPuzzle(db, difficulty) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([difficulty]);
		const objectStore = transaction.objectStore(difficulty);

		const request = objectStore.openCursor();
		request.onerror = reject;
		request.onsuccess = function(event) {
			const result = {
				id: event.target.result.key,
				puzzle: event.target.result.value,
			};
			resolve(result);
		};
	});
}

function deletePuzzle(db, difficulty, id) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([difficulty], "readwrite");
		const objectStore = transaction.objectStore(difficulty);

		const request = objectStore.delete(id);
		request.onerror = reject;
		request.onsuccess = resolve;
	});
}

function countPuzzles(db, difficulty) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([difficulty]);
		const objectStore = transaction.objectStore(difficulty);

		const request = objectStore.getAllKeys();
		request.onerror = reject;
		request.onsuccess = function(event) {
			resolve(event.target.result.length);
		};
	});
}

module.exports = {
	DIFFICULTIES,
	openDatabase,
	storePuzzle,
	getPuzzle,
	deletePuzzle,
	countPuzzles,
};
