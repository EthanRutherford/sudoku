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
	const rows = [[], [], [], [], [], [], [], [], []];
	const columns = [[], [], [], [], [], [], [], [], []];
	const boxes = [[], [], [], [], [], [], [], [], []];

	let cellCandidates = new Array(10);
	for (const index of remaining) {
		rows[indexToRow[index]].push(index);
		columns[indexToColumn[index]].push(index);
		boxes[indexToBox[index]].push(index);

		const potentials = board.potentials[index].values;
		if (potentials.length < cellCandidates.length) {
			// early out: a cell with no potentials means the board is invalid
			if (potentials.length === 0) {
				return null;
			}

			cellCandidates = potentials.map((value) => ({index, value}));

			// if score is already > 0 and we find a single, return early
			if (score > 0 && cellCandidates.length === 1) {
				return {candidates: cellCandidates, cost: 1};
			}
		}
	}

	const sets = rows.concat(columns, boxes).filter((x) => x.length);

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

function getNumberMap(board, remaining) {
	const numberMap = {
		1: new Set(),
		2: new Set(),
		3: new Set(),
		4: new Set(),
		5: new Set(),
		6: new Set(),
		7: new Set(),
		8: new Set(),
		9: new Set(),
	};

	for (const index of remaining) {
		for (const value of board.potentials[index].values) {
			numberMap[value].add(index);
		}
	}

	return numberMap;
}

function eliminateLineGhosts(board, numberMap) {
	let did = false;
	for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
		const box = boxMap[boxIndex];
		for (let number = 1; number <= 9; number++) {
			const map = numberMap[number];
			const indices = box.filter((index) => map.has(index));

			if (indices.length < 2 || indices.length > 3) {
				continue;
			}

			const rowIndex = indexToRow[indices[0]];
			const columnIndex = indexToColumn[indices[0]];
			let cells = null;

			if (indices.every((index) => indexToRow[index] === rowIndex)) {
				cells = rowMap[rowIndex].filter((index) =>
					map.has(index) && !indices.includes(index),
				);
			}
			if (indices.every((index) => indexToColumn[index] === columnIndex)) {
				cells = columnMap[columnIndex].filter((index) =>
					map.has(index) && !indices.includes(index),
				);
			}

			if (cells && cells.length > 0) {
				did = true;
				for (const index of cells) {
					board.potentials[index] = board.potentials[index].remove(number);
					numberMap[number].delete(index);
				}
			}
		}
	}

	return did;
}

function eliminateBoxGhosts(board, numberMap) {
	const lines = rowMap.concat(columnMap);

	let did = false;
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];
		for (let number = 1; number <= 9; number++) {
			const map = numberMap[number];
			const indices = line.filter((index) => map.has(index));

			if (indices.length < 2 || indices.length > 3) {
				continue;
			}

			const boxIndex = indexToBox[indices[0]];
			let cells = null;

			if (indices.every((index) => indexToBox[index] === boxIndex)) {
				cells = boxMap[boxIndex].filter((index) =>
					map.has(index) && !indices.includes(index),
				);
			}

			if (cells && cells.length > 0) {
				did = true;
				for (const index of cells) {
					board.potentials[index] = board.potentials[index].remove(number);
					numberMap[number].delete(index);
				}
			}
		}
	}

	return did;
}

function eliminateNakedPairs(board, remaining) {
	let did = false;
	const sets = rowMap.concat(columnMap, boxMap);

	for (const set of sets) {
		const empty = set.filter((index) => remaining.has(index));
		if (empty.length < 3) {
			continue;
		}

		for (let i = 0; i < empty.length; i++) {
			for (let j = i + 1; j < empty.length; j++) {
				const potentialsA = board.potentials[empty[i]];
				const potentialsB = board.potentials[empty[j]];
				const potentialValues = potentialsA.values;
				if (
					potentialsA === potentialsB &&
					potentialValues.length === 2
				) {
					for (const indexC of empty) {
						const potentialsC = board.potentials[indexC];
						if (indexC !== empty[i] && indexC !== empty[j]) {
							board.potentials[indexC] = potentialsC.remove(potentialValues[0]).remove(potentialValues[1]);
							did = did || !potentialsC.eq(board.potentials[indexC]);
						}
					}
				}
			}
		}
	}

	return did;
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

	// keep searching for a single logical answer, trying increasingly
	// advanced techniques until a best candidate is found,
	// or all techniques are exhausted.
	let searchResult = null;
	while (true) {
		searchResult = findBestCandidates(board, remaining, score);

		// board is not solvable from current position
		if (searchResult == null) {
			return false;
		}

		// if we're going fast, bail on advanced (expensive) techniques
		if (solveData.goFast) {
			break;
		}

		// we have a single candidate, go forward with it
		if (searchResult.candidates.length === 1) {
			break;
		}

		// set numbermap for evaluating ghosts
		const numberMap = getNumberMap(board, remaining);

		// clear out line ghosts and try again
		if (eliminateLineGhosts(board, numberMap)) {
			score = Math.max(score, 1);
			continue;
		}

		// clear out box ghosts and try again
		if (eliminateBoxGhosts(board, numberMap)) {
			score = Math.max(score, 1);
			continue;
		}

		// clear out naked pairs and try again
		if (eliminateNakedPairs(board, remaining)) {
			score = Math.max(score, 1);
			continue;
		}

		break;
	}

	const {candidates, cost} = searchResult;
	score = Math.max(score, cost);

	// if there's more than one branch, the score is at least a 2
	if (candidates.length > 1) {
		score = Math.max(score, 1) + candidates.length - 1;
	}

	// recursively attempt filling the board with possible values
	while (candidates.length !== 0) {
		// if there's only one candidate, there's no need to make copies
		// backtracking will skip past this anyway, so no need to waste
		// cycles allocating new memory and copying values
		const skipCopy = candidates.length === 1;

		// select a random candidate
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

function solveBoard(board, goFast = false, checkUnique = false) {
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
	const solveData = {
		checkUnique,
		goFast,
		score: null,
		board: null,
		isUnique: true,
	};
	solveRecursive(board.clone(), remaining, 0, solveData);

	// return relevant solve data
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
	return solveBoard(board, true).board;
}

function punchHoles(solution) {
	let board = solution.clone();

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

		const result = solveBoard(nextBoard, true, true);
		if (result.isUnique) {
			board = nextBoard;
		}
	}

	const difficulty = solveBoard(board.clone()).difficulty;

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
	solvePuzzle: (puzzle) => solveBoard(new Board(puzzle), true).board.values,
	fillNotes: (puzzle, notes) => {
		for (let i = 0; i < BOARD_SIZE; i++) {
			if (puzzle[i] == null) {
				notes[i] = getPotentials(puzzle, i);
			}
		}
	},
};
