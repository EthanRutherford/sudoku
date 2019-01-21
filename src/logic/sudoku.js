const BitSet = require("./bit-set");

const ROW_SIZE = 9;
const BOARD_SIZE = 81;

// helpers for getting rows/columns/boxes etc.
const rowMap = new Array(ROW_SIZE).fill(0).map(() => []);
const columnMap = new Array(ROW_SIZE).fill(0).map(() => []);
const boxMap = new Array(ROW_SIZE).fill(0).map(() => []);

const indexToRow = new Array(BOARD_SIZE);
const indexToColumn = new Array(BOARD_SIZE);
const indexToBox = new Array(BOARD_SIZE);
for (let i = 0; i < ROW_SIZE; i++) {
	for (let j = 0; j < ROW_SIZE; j++) {
		const index = i * ROW_SIZE + j;
		rowMap[i][j] = index;
		columnMap[j][i] = index;
		indexToRow[index] = i;
		indexToColumn[index] = j;

		const di = Math.floor(i / 3);
		const dj = Math.floor(j / 3);
		const ri = i % 3;
		const rj = j % 3;
		boxMap[di * 3 + dj][ri * 3 + rj] = index;
		indexToBox[index] = di * 3 + dj;
	}
}

// freeze arrays
for (let i = 0; i < ROW_SIZE; i++) {
	Object.freeze(rowMap[i]);
	Object.freeze(columnMap[i]);
	Object.freeze(boxMap[i]);
}

Object.freeze(rowMap);
Object.freeze(columnMap);
Object.freeze(boxMap);
Object.freeze(indexToRow);
Object.freeze(indexToColumn);
Object.freeze(indexToBox);

class Board {
	constructor(values = [], potentials = []) {
		this.values = new Array(BOARD_SIZE);
		this.potentials = new Array(BOARD_SIZE);

		for (let i = 0; i < values.length; i++) {
			this.values[i] = values[i];
		}
		for (let i = 0; i < potentials.length; i++) {
			this.potentials[i] = potentials[i];
		}
	}
	clone() {
		return new Board(this.values, this.potentials);
	}
}

function popRand(list) {
	const index = Math.floor(Math.random() * list.length);
	return list.splice(index, 1)[0];
}

function getNeighbors(index) {
	const row = rowMap[indexToRow[index]];
	const column = columnMap[indexToColumn[index]];
	const box = boxMap[indexToBox[index]];

	// add indexes from row, column, and box
	const neighbors = new Set();
	for (let i = 0; i < ROW_SIZE; i++) {
		neighbors.add(row[i]);
		neighbors.add(column[i]);
		neighbors.add(box[i]);
	}

	// delete self index
	neighbors.delete(index);

	return neighbors;
}

function getPotentials(values, index) {
	const neighbors = getNeighbors(index);

	let potentials = new BitSet(0b111111111);
	for (const index of neighbors) {
		const value = values[index];
		if (value) {
			potentials = potentials.remove(value);
		}
	}

	return potentials;
}

function findBestCandidates(board, remaining, score) {
	let rows = [[], [], [], [], [], [], [], [], []];
	let columns = [[], [], [], [], [], [], [], [], []];
	let boxes = [[], [], [], [], [], [], [], [], []];

	let cellCandidates = new Array(10);
	for (const index of remaining) {
		rows[indexToRow[index]].push(index);
		columns[indexToColumn[index]].push(index);
		boxes[indexToBox[index]].push(index);

		const potentials = board.potentials[index];
		if (potentials.size < cellCandidates.length) {
			// early out: a cell with no potentials means the board is invalid
			if (potentials.size === 0) {
				return null;
			}

			cellCandidates = potentials.values.map((value) => ({index, value}));

			// if score is already > 0 and we find a single, return early
			if (score > 0 && cellCandidates.length === 1) {
				return {candidates: cellCandidates, cost: 1};
			}
		}
	}

	rows = rows.filter((x) => x.length);
	columns = columns.filter((x) => x.length);
	boxes = boxes.filter((x) => x.length);

	const sets = rows.concat(columns).concat(boxes);

	let setCandidates = new Array(10);
	for (const set of sets) {
		const valueMap = set.reduce((m, index) => {
			for (const value of board.potentials[index].values) {
				if (!m.has(value)) {
					m.set(value, []);
				}

				m.get(value).push(index);
			}

			return m;
		}, new Map());

		for (const [value, indices] of valueMap.entries()) {
			if (indices.length < setCandidates.length) {
				setCandidates = indices.map((index) => ({index, value}));

				if (setCandidates.length === 1) {
					return {candidates: setCandidates, cost: 0};
				}
			}
		}
	}

	return cellCandidates.length < setCandidates.length ? {
		candidates: cellCandidates,
		cost: 1,
	} : {
		candidates: setCandidates,
		cost: 0,
	};
}

function solveRecursive(board, remaining, score, solveData) {
	// if there are no more cells to solve, we've found a solution
	if (remaining.size === 0) {
		if (!solveData.foundOne) {
			solveData.foundOne = true;
			solveData.score = score;
			solveData.board = board;

			if (solveData.checkUnique) {
				return false;
			}
		} else if (solveData.checkUnique) {
			solveData.isUnique = false;
		}

		return true;
	}

	const searchResult = findBestCandidates(board, remaining, score);

	// board is not solvable from current position
	if (searchResult == null) {
		return false;
	}

	const {candidates, cost} = searchResult;
	score = Math.max(score, cost);

	// if there's more than one branch, the score is at least a 2
	if (candidates.length > 1) {
		score = (score === 0 ? 1 : score) + candidates.length - 1;
	}

	// if there's only one candidate, there's no need to make copies
	// backtracking will skip past this anyway, so no need to waste
	// cycles allocating new memory and copying values
	const skipCopy = candidates.length === 1;

	// recursively attempt filling the board with possible values
	while (candidates.length !== 0) {
		const {index, value} = popRand(candidates);

		// create new board with filled in value and updated potentials
		const nextBoard = skipCopy ? board : board.clone();
		nextBoard.values[index] = value;
		const nextRemaining = skipCopy ? remaining : new Set(remaining);
		nextRemaining.delete(index);

		for (const neighbor of getNeighbors(index)) {
			if (nextBoard.potentials[neighbor]) {
				nextBoard.potentials[neighbor] = nextBoard.potentials[neighbor].remove(value);
			}
		}

		const result = solveRecursive(
			nextBoard,
			nextRemaining,
			score,
			solveData,
		);

		if (result) {
			return result;
		}
	}

	return false;
}

function solveBoard(board, checkUnique = false) {
	// populate the potential sets for all empty cells
	// also create the list of unsolved cells
	const remaining = new Set();
	for (let i = 0; i < BOARD_SIZE; i++) {
		if (board.values[i] != null) {
			continue;
		}

		board.potentials[i] = getPotentials(board.values, i);
		remaining.add(i);
	}

	// begin solving
	const solveData = {checkUnique, score: null, board: null, isUnique: true};
	solveRecursive(board.clone(), remaining, 0, solveData);
	return {
		board: solveData.board,
		difficulty: solveData.score,
		isUnique: solveData.isUnique,
	};
}

function createSolution() {
	const board = new Board();

	// (optimization) prefill the first box, row, and column

	// make list of possible values for box
	const box = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	// fill first three values in first row/box
	board.values[0] = popRand(box);
	board.values[1] = popRand(box);
	board.values[2] = popRand(box);

	// copy remaining values, these are the same remaining for the row
	const row = [...box];

	// fill the next two values in the first column
	board.values[1 * ROW_SIZE] = popRand(box);
	board.values[2 * ROW_SIZE] = popRand(box);

	// copy remaining values plus second and third cell of first row
	// these are the remaining values for the first column
	const column = [...box, board.values[1], board.values[2]];

	// fill the rest of the first box using remaining possibles for box
	board.values[1 * ROW_SIZE + 1] = popRand(box);
	board.values[1 * ROW_SIZE + 2] = popRand(box);
	board.values[2 * ROW_SIZE + 1] = popRand(box);
	board.values[2 * ROW_SIZE + 2] = popRand(box);

	// fill the rest of row and column from the remaining possibles for each
	for (let i = 3; i < ROW_SIZE; i++) {
		board.values[i] = popRand(row);
		board.values[i * ROW_SIZE] = popRand(column);
	}

	// run the solver. Since the solver picks candidates randomly,
	// this will result in a random, but valid, full board.
	return solveBoard(board).board;
}

function punchHoles(solution) {
	let board = solution.clone();
	let difficulty = 0;

	// create pairs we can try to punch out.
	// pairs are defined as a cell index i, which is reflected
	// about the center as 80 - i. The center (40), is
	// therefore paired with itself.
	const pairs = new Array(41).fill(0).map((_, i) => i);

	// randomly pick pairs and punches them out.
	// if the solution is still unique, accept the change,
	// else discard the change and try another pair.
	while (pairs.length !== 0) {
		const index = popRand(pairs);
		const nextBoard = board.clone();
		nextBoard.values[index] = null;
		nextBoard.values[80 - index] = null;

		const result = solveBoard(nextBoard, true);
		if (result.isUnique) {
			board = nextBoard;
			difficulty = result.difficulty;
		}
	}

	return {board, difficulty};
}

function makePuzzle() {
	const solution = createSolution();
	const {board, difficulty} = punchHoles(solution);

	return {puzzle: board.values, difficulty};
}

module.exports = {
	rowMap,
	columnMap,
	boxMap,

	indexToRow,
	indexToColumn,
	indexToBox,

	getNeighbors,
	makePuzzle,
	solvePuzzle: (puzzle) => solveBoard(new Board(puzzle)).board.values,
	fillNotes: (puzzle, notes) => {
		for (let i = 0; i < BOARD_SIZE; i++) {
			if (puzzle[i] == null) {
				notes[i] = getPotentials(puzzle, i);
			}
		}
	},
};
