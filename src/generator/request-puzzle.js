const {
	DIFFICULTIES,
	openDatabase,
	getPuzzle,
	deletePuzzle,
	countPuzzles,
} = require("./puzzle-db");

// spawn generator worker, to generate puzzles in the background
const generator = new Worker("/dist/worker.js");
generator.onerror = console.error;

function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

// keep checking the puzzle list until there is one to return
async function tryGetPuzzle(db, difficulty) {
	while (true) {
		if (await countPuzzles(db, difficulty) > 0) {
			// return the puzzle as the list of cell values
			const {puzzle, id} = await getPuzzle(db, difficulty);
			await deletePuzzle(db, difficulty, id);
			return puzzle;
		}

		// if an array is empty, we should be generating new puzzles
		// pretty quickly, so we should have one pretty soon.
		sleep(100);
	}
}

async function requestPuzzle(difficulty) {
	// ignore any garbage requests
	if (DIFFICULTIES.includes(difficulty)) {
		return await tryGetPuzzle(await openDatabase(), difficulty);
	}

	return null;
}

module.exports = requestPuzzle;
