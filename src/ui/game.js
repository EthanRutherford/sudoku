const {Component, createRef} = require("react");
const j = require("react-jenny");
const BitSet = require("../logic/bit-set");
const {
	indexToRow,
	indexToColumn,
	indexToBox,
	getNeighbors,
	solvePuzzle,
} = require("../logic/sudoku");
const {
	storePuzzle,
	storeAnswers,
	storeNotes,
	clearStoredGame,
} = require("../logic/game-store");
const {startTimer} = require("./util");
const styles = require("../styles/game");

const pencilOn = `${styles.button} ${styles.pencilActive}`;
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function Board(props) {
	const {
		puzzle,
		answers,
		notes,
		selectedIndex,
		invalidIndices,
		setSelectedIndex,
		setHoveredIndex,
	} = props;
	const hoveredIndex = props.hoveredIndex || selectedIndex;
	const hoveredValue = props.hoveredValue || puzzle[selectedIndex] || answers[selectedIndex];

	return j({div: {
		className: styles.board,
		onMouseOut: () => setHoveredIndex(null, null),
	}}, puzzle.map((value, index) => {
		const note = notes[index];

		let className = styles.cell;
		if (value) {
			className += ` ${styles.initialValue}`;
		} else {
			value = answers[index];
		}
		if (value && value === hoveredValue) {
			className += ` ${styles.hoveredValue}`;
		}
		if (index === selectedIndex) {
			className += ` ${styles.selectedIndex}`;
		}
		if (invalidIndices && invalidIndices.has(index)) {
			className += ` ${styles.error}`;
		}
		if (
			indexToRow[index] === indexToRow[hoveredIndex] ||
			indexToColumn[index] === indexToColumn[hoveredIndex] ||
			indexToBox[index] === indexToBox[hoveredIndex]
		) {
			className += ` ${styles.hoveredNeighbors}`;
		}

		return j({div: {
			className,
			onMouseOver: () => setHoveredIndex(index, value),
			onClick: () => setSelectedIndex(index),
		}}, [
			value,
			numbers.map((number) => note.has(number) && j({div: {
				className: styles[`note${number}`],
				key: number,
			}}, number)),
		]);
	}));
}

function Controls(props) {
	return j({div: styles.controls}, [
		numbers.map((number) => j({button: {
			className: styles.button,
			disabled: props.counts[number] === 9,
			onClick: () => props.setValue(number),
			key: number,
		}}, [
			number,
			j({div: styles.remainingCount}, [props.counts[number]]),
		])),
		j({button: {
			className: styles.button,
			onClick: () => props.setValue(null),
		}}, "↩"),
		j({button: {
			className: props.noteMode ? pencilOn : styles.button,
			onClick: props.toggleNoteMode,
		}}, "✎"),
		j({button: {
			className: `${styles.button} ${styles.modeButton}`,
			title: "coming soon",
			disabled: true,
		}}, "cell first"),
	]);
}

function updateState(puzzle, answers, notes, solution, index, value) {
	// TODO: "disallow wrong answers" option
	// if (solution[index] !== value) {
	// 	return new Set([index]);
	// }

	const invalidIndices = new Set();
	for (const neighbor of getNeighbors(index)) {
		// check for conflicts in all neighbors
		const cellValue = puzzle[neighbor] || answers[neighbor];
		if (cellValue === value) {
			invalidIndices.add(neighbor);
		}

		// remove value from notes in all neighbors
		notes[neighbor] = notes[neighbor].remove(value);
	}

	// clear notes for the given cell
	notes[index] = new BitSet();

	if (invalidIndices.size > 0) {
		invalidIndices.add(index);
		return invalidIndices;
	}

	return null;
}

function checkIsSolved(puzzle, answers, solution) {
	for (let i = 0; i < 81; i++) {
		if (puzzle[i] == null && answers[i] !== solution[i]) {
			return false;
		}
	}

	return true;
}

function countValues(puzzle, answers) {
	return puzzle.reduce((map, value, index) => {
		const cellValue = value || answers[index];
		if (cellValue) map[cellValue]++;
		return map;
	}, {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0});
}

module.exports = class Game extends Component {
	constructor(...args) {
		super(...args);

		// init game state
		const answers = this.props.initialAnswers || new Array(81).fill(null);
		const notes = this.props.initialNotes || new Array(81).fill(new BitSet());
		const counts = countValues(this.props.puzzle, answers);

		this.state = {
			answers,
			notes,
			counts,
			hoveredIndex: null,
			hoveredValue: null,
			selectedIndex: null,
			invalidIndices: null,
			noteMode: false,
		};

		if (!this.props.fake) {
			// set up timer
			this.endTimer = startTimer(this.props.initialTime);

			// save current game board
			storePuzzle(this.props.puzzle);
			storeAnswers(answers);
			storeNotes(notes);

			// store solution
			this.solution = solvePuzzle(this.props.puzzle);
		}

		this.gameRef = createRef();
		this.handleDocClick = this.handleDocClick.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.toggleNoteMode = this.toggleNoteMode.bind(this);
		this.setHoveredIndex = this.setHoveredIndex.bind(this);
		this.setSelectedIndex = this.setSelectedIndex.bind(this);
		this.setValue = this.setValue.bind(this);
	}
	componentDidMount() {
		document.addEventListener("click", this.handleDocClick);
		document.addEventListener("keydown", this.handleKeyDown);
	}
	componentWillUnmount() {
		document.removeEventListener("click", this.handleDocClick);
		document.removeEventListener("keydown", this.handleKeyDown);
	}
	handleDocClick(event) {
		if (
			this.gameRef.current.children[0].contains(event.target) ||
			this.gameRef.current.children[1].contains(event.target)
		) {
			return;
		}

		this.setSelectedIndex(null);
	}
	handleKeyDown(event) {
		const {selectedIndex} = this.state;

		if (event.key > 0) {
			this.setValue(Number.parseInt(event.key, 10));
		} else if (
			event.key === "0" ||
			event.key === " " ||
			event.key === "Backspace" ||
			event.key === "Delete"
		) {
			this.setValue(null);
		} else if (selectedIndex != null) {
			event.preventDefault();

			if (
				event.key === "ArrowLeft" ||
				event.key.toLowerCase() === "a" ||
				(event.key === "Tab" && event.shiftKey)
			) {
				if (selectedIndex > 0) {
					this.setSelectedIndex(selectedIndex - 1);
				}
			} else if (
				event.key === "ArrowRight" ||
				event.key.toLowerCase() === "d" ||
				event.key === "Tab"
			) {
				if (selectedIndex < 80) {
					this.setSelectedIndex(selectedIndex + 1);
				}
			} else if (
				event.key === "ArrowUp" ||
				event.key.toLowerCase() === "w"
			) {
				if (selectedIndex > 8) {
					this.setSelectedIndex(selectedIndex - 9);
				}
			} else if (
				event.key === "ArrowDown" ||
				event.key.toLowerCase() === "s"
			) {
				if (selectedIndex < 72) {
					this.setSelectedIndex(selectedIndex + 9);
				}
			}
		}
	}
	toggleNoteMode() {
		this.setState((state) => ({noteMode: !state.noteMode}));
	}
	setHoveredIndex(hoveredIndex, hoveredValue) {
		this.setState({hoveredIndex, hoveredValue});
	}
	setSelectedIndex(selectedIndex) {
		this.setState({selectedIndex, invalidIndices: null});
	}
	setValue(value) {
		const puzzle = this.props.puzzle;
		const answers = [...this.state.answers];
		const notes = [...this.state.notes];
		const counts = this.state.counts;
		const selectedIndex = this.state.selectedIndex;

		if (this.state.noteMode) {
			if (puzzle[selectedIndex] != null && answers[selectedIndex] != null) {
				return;
			}

			if (value != null) {
				notes[selectedIndex] = notes[selectedIndex].toggle(value);
			} else {
				notes[selectedIndex] = new BitSet();
			}

			this.setState({notes});
			storeNotes(notes);
		} else if (
			selectedIndex != null &&
			puzzle[selectedIndex] == null &&
			answers[selectedIndex] !== value &&
			(value == null || counts[value] < 9)
		) {
			if (value != null) {
				const invalidIndices = updateState(
					puzzle,
					answers,
					notes,
					this.solution,
					selectedIndex,
					value,
				);

				if (invalidIndices != null) {
					this.setState({invalidIndices});
					return;
				}
			}

			answers[selectedIndex] = value;
			this.setState({
				answers,
				notes,
				counts: countValues(puzzle, answers),
				invalidIndices: null,
			});

			if (checkIsSolved(puzzle, answers, this.solution)) {
				clearStoredGame();
				this.props.winGame(this.endTimer());
			} else {
				storeAnswers(answers);
				storeNotes(notes);
			}
		}
	}
	render() {
		return j({div: {
			className: styles.game,
			ref: this.gameRef,
		}}, [
			j([Board, {
				puzzle: this.props.puzzle,
				answers: this.state.answers,
				notes: this.state.notes,
				hoveredIndex: this.state.hoveredIndex,
				hoveredValue: this.state.hoveredValue,
				selectedIndex: this.state.selectedIndex,
				invalidIndices: this.state.invalidIndices,
				setHoveredIndex: this.setHoveredIndex,
				setSelectedIndex: this.setSelectedIndex,
			}]),
			j([Controls, {
				setValue: this.setValue,
				counts: this.state.counts,
				noteMode: this.state.noteMode,
				toggleNoteMode: this.toggleNoteMode,
			}]),
		]);
	}
};
