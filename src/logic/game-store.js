const BitSet = require("./bit-set");

const DIFFICULTY_KEY = "difficultyResumeState";
const PUZZLE_KEY = "puzzleResumeState";
const ANSWERS_KEY = "answersResumeState";
const NOTES_KEY = "notesResumeState";
const TIME_KEY = "timeResumeState";

const encode = (array) => array.reduce((code, value) => code + (value || " "), "");
const decode = (code) => code.split("").map((value) => Number.parseInt(value, 10) || null);
const compact = (notes) => notes.reduce((code, note) => code + note.toString(), "");
const expand = (code) => code.split("").map(BitSet.fromString);

function storeDifficulty(difficulty) {
	localStorage.setItem(DIFFICULTY_KEY, difficulty);
}

function storePuzzle(puzzle) {
	localStorage.setItem(PUZZLE_KEY, encode(puzzle));
}

function storeAnswers(answers) {
	localStorage.setItem(ANSWERS_KEY, encode(answers));
}

function storeNotes(notes) {
	localStorage.setItem(NOTES_KEY, compact(notes));
}

function storeTime(time) {
	localStorage.setItem(TIME_KEY, time.toString());
}

function getStoredGame() {
	const difficulty = localStorage.getItem(DIFFICULTY_KEY);
	const puzzle = localStorage.getItem(PUZZLE_KEY);
	if (puzzle == null) {
		return {};
	}

	const answers = localStorage.getItem(ANSWERS_KEY);
	const notes = localStorage.getItem(NOTES_KEY);
	const time = localStorage.getItem(TIME_KEY);

	return {
		difficulty,
		puzzle: decode(localStorage.getItem(PUZZLE_KEY)),
		answers: answers ? decode(answers) : null,
		notes: notes ? expand(notes) : null,
		time: time ? Number.parseFloat(time) : 0,
	};
}

function clearStoredGame() {
	localStorage.removeItem(DIFFICULTY_KEY);
	localStorage.removeItem(PUZZLE_KEY);
	localStorage.removeItem(ANSWERS_KEY);
	localStorage.removeItem(NOTES_KEY);
	localStorage.removeItem(TIME_KEY);
}

module.exports = {
	storeDifficulty,
	storePuzzle,
	storeAnswers,
	storeNotes,
	storeTime,
	getStoredGame,
	clearStoredGame,
};
