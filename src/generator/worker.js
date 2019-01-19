const {makePuzzle} = require("../logic/sudoku");
const {
	difficulties,
	openDatabase,
	storePuzzle,
	countPuzzles,
} = require("./db");

// create a puzzle, and place it in the appropriate difficulty list
async function createPuzzle(db, counts) {
	const difficultyLevels = [0, 2, 5, Infinity];

	// use high number of iterations if we're only lacking expert,
	// or on random occassions otherwise
	const expertBehind = counts[0] > 10 && counts[1] > 10 && counts[2] > 10;
	const iterations = expertBehind || Math.random() > .75 ? 200 : 25;
	const {puzzle, difficulty} = makePuzzle(iterations);

	for (let i = 0; i < difficulties.length; i++) {
		const level = difficultyLevels[i];
		const name = difficulties[i];
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
	const counts = await Promise.all(difficulties.map(
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
