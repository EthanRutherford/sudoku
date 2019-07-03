const {performance} = require("perf_hooks");
const {makePuzzle} = require("./src/logic/sudoku");

function format(puzzle) {
	let string = "";
	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			string += (puzzle[i * 9 + j] || ".") + " ";
		}

		string += "\n";
	}

	return string.trim();
}

console.log("sampling 1000 generated puzzles...");

const sampleStart = performance.now();
let min = Infinity;
let max = 0;
let avg = 0;
const set = {};
for (let i = 0; i < 1000; i++) {
	const {difficulty} = makePuzzle();
	min = Math.min(min, difficulty);
	max = Math.max(max, difficulty);
	avg += difficulty / 1000;

	if (set[difficulty] == null) {
		set[difficulty] = 0;
	}

	set[difficulty]++;
}

const sampleEnd = performance.now();

console.log(`Sampling complete | took ${sampleEnd - sampleStart}ms`);
console.log("Difficulty results:");
console.log(`  - range  : ${min} to ${max}`);
console.log(`  - average: ${avg}`);
for (const key of Object.keys(set).sort((a, b) => a - b)) {
	const count = set[key];
	console.log(`  - ${key}: ${count} puzzle${count > 1 ? "s" : ""}`);
}
console.log("");

console.log("Generating sample puzzle...");

const start = performance.now();
const {puzzle, difficulty} = makePuzzle();
const end = performance.now();

console.log(`Generating complete | took ${end - start}ms`);
console.log("  - difficulty:", difficulty);
console.log(format(puzzle));
