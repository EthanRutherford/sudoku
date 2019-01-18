const {makePuzzle} = require("./logic/sudoku");

const difficulties = ["easy", "medium", "hard", "expert"];

function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("sudoku", 1);

		request.onupgradeneeded = function(event) {
			const database = event.target.result;

			// drop existing tables
			for (const name of database.objectStoreNames) {
				database.deleteObjectStore(name);
			}

			// create a table for each difficulty
			for (const difficulty of difficulties) {
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

// create a puzzle, and place it in the appropriate difficulty list
async function createPuzzle(db) {
	const difficultyLevels = [0, 3, 7, Infinity];
	const {puzzle, difficulty} = makePuzzle();

	for (let i = 0; i < difficulties.length; i++) {
		const level = difficultyLevels[i];
		const name = difficulties[i];
		if (difficulty <= level && await countPuzzles(db, name) < 100) {
			await storePuzzle(db, name, puzzle);
			break;
		}
	}
}

// periodically create more puzzles.
// initially, create puzzles as fast as possible until there is
// at least one puzzle in each difficulty,
// then periodically create more puzzles until there are at least 4
// per difficulty.
async function checkForEmptyDifficulty(db) {
	const counts = await Promise.all(difficulties.map(
		(difficulty) => countPuzzles(db, difficulty),
	));

	if (counts.some((count) => count < 10)) {
		await createPuzzle(db);
	}

	const aListWasEmpty = counts.includes(0);

	setTimeout(() => checkForEmptyDifficulty(db), aListWasEmpty ? 0 : 2000);
}

// check the puzzle list until a puzzle can be sent
async function tryGetPuzzle(db, difficulty) {
	if (await countPuzzles(db, difficulty) > 0) {
		// return the puzzle as the list of cell values
		const {puzzle, id} = await getPuzzle(db, difficulty);
		await deletePuzzle(db, difficulty, id);
		postMessage(puzzle);
	} else {
		// quick and dirty retry.
		// if an array is empty, we should be generating new puzzles
		// pretty quickly, so we should have one pretty soon.
		setTimeout(() => tryGetPuzzle(db, difficulty), 100);
	}
}

(async function start() {
	const db = await openDatabase();

	// start creating puzzles
	checkForEmptyDifficulty(db);

	// listen for requests for puzzles
	self.onmessage = function(event) {
		// ignore any garbage events
		if (difficulties.includes(event.data)) {
			tryGetPuzzle(db, event.data);
		}
	};
})();
