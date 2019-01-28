const {makePuzzle} = require("../logic/sudoku");
const {
	DIFFICULTIES,
	openDatabase,
	storePuzzle,
	countPuzzles,
} = require("./puzzle-db");

// create a puzzle, and place it in the appropriate difficulty list
async function createPuzzle(db, counts) {
	const difficultyLevels = [0, 1, 5, Infinity];
	const {puzzle, difficulty} = makePuzzle();

	for (let i = 0; i < DIFFICULTIES.length; i++) {
		const level = difficultyLevels[i];
		const name = DIFFICULTIES[i];
		if (difficulty <= level && counts[i] < 100) {
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
	const counts = await Promise.all(DIFFICULTIES.map(
		(difficulty) => countPuzzles(db, difficulty),
	));

	if (counts.some((count) => count < 10)) {
		await createPuzzle(db, counts);
	}

	const aListWasEmpty = counts.includes(0);

	setTimeout(() => checkForEmptyDifficulty(db), aListWasEmpty ? 0 : 2000);
}

(async function start() {
	const db = await openDatabase();

	// start creating puzzles
	checkForEmptyDifficulty(db);
})();
