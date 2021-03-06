const {Component, createRef} = require("react");
const j = require("react-jenny");
const BitSet = require("../logic/bit-set");
const {
	indexToRow,
	indexToColumn,
	indexToBox,
	getNeighbors,
	solvePuzzle,
	fillNotes,
} = require("../logic/sudoku");
const {
	storePuzzle,
	storeAnswers,
	storeNotes,
	clearStoredGame,
} = require("../logic/game-store");
const {
	GUIDE_MODES,
	HOVER_MODES,
	WRAP_MODES,
	BUTTON_DEFAULTS,
	AUTO_CHECK_MODES,
	PREFILL_LEVELS,
	getOptions,
} = require("../logic/options");
const {ACTIONS, parseAction} = require("./keyboard-controls");
const {startTimer} = require("./util");
const styles = require("../styles/game");

const noteClass = (n, hovered) => `${styles[`note${n}`]} ` + (hovered ? styles.hoveredNote : "");
const buttonActive = `${styles.button} ${styles.active}`;
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const BUTTON_MODE_KEY = "lastUsedButtonMode";

function getHovered(options, props) {
	const {puzzle, answers, hoveredIndex, hoveredValue, selectedIndex} = props;
	const selectedValue = props.selectedValue || puzzle[selectedIndex] || answers[selectedIndex];

	if (options.hoverMode === HOVER_MODES.hoverOnly) {
		return {hoveredIndex, hoveredValue};
	} else if (options.hoverMode === HOVER_MODES.sticky) {
		return {
			hoveredIndex: selectedIndex || hoveredIndex,
			hoveredValue: selectedValue || hoveredValue,
		};
	} else if (options.hoverMode === HOVER_MODES.hybrid) {
		return {
			hoveredIndex: hoveredIndex || selectedIndex,
			hoveredValue: hoveredValue || selectedValue,
		};
	}

	// else off, show guide for selected index/value
	return {hoveredIndex: selectedIndex, hoveredValue: selectedValue};
}

function Board(props) {
	const {
		options,
		puzzle,
		answers,
		notes,
		selectedIndex,
		invalidIndices,
		setSelectedIndex,
		setHoveredIndex,
	} = props;
	const {hoveredIndex, hoveredValue} = getHovered(options, props);

	const guideNeighbors = options.guideMode.has(GUIDE_MODES.neighbors);
	const guideValues = options.guideMode.has(GUIDE_MODES.values);
	const guideNotes = options.guideMode.has(GUIDE_MODES.notes);

	return j({div: {
		className: styles.board,
		onMouseOut: () => setHoveredIndex(null, null),
	}}, [
		j({div: styles.grid}, puzzle.map((value, index) => {
			const note = notes[index];

			let className = styles.cell;
			if (value) {
				className += ` ${styles.initialValue}`;
			} else {
				value = answers[index];
			}
			if (invalidIndices && invalidIndices.has(index)) {
				className += ` ${styles.error}`;
			}
			if (guideValues && value && value === hoveredValue) {
				className += ` ${styles.hoveredValue}`;
			}
			if (
				guideNeighbors && (
					indexToRow[index] === indexToRow[hoveredIndex] ||
					indexToColumn[index] === indexToColumn[hoveredIndex] ||
					indexToBox[index] === indexToBox[hoveredIndex]
				)
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
					className: noteClass(
						number,
						guideNotes && number === hoveredValue,
					),
					key: number,
				}}, number)),
			]);
		})),
		j({div: styles.overlayGrid}, puzzle.map((_, index) => {
			let className = styles.overlayCell;
			if (index === selectedIndex) {
				className += ` ${styles.selectedIndex}`;
			}

			return j({div: className});
		})),
	]);
}

function Controls(props) {
	const deleteOn = props.valueFirst && props.selectedValue == null;
	return j({div: styles.controls}, [
		numbers.map((number) => j({button: {
			className: number === props.selectedValue ? buttonActive : styles.button,
			disabled: props.counts[number] === 9,
			onClick: () => props.setSelectedValue(number),
			key: number,
		}}, [
			number,
			j({div: styles.remainingCount}, [props.counts[number]]),
		])),
		j({button: {
			className: deleteOn ? buttonActive : styles.button,
			onClick: () => props.setSelectedValue(null),
		}}, "⌫"),
		j({button: {
			className: props.noteMode ? buttonActive : styles.button,
			onClick: props.toggleNoteMode,
		}}, "✎"),
		j({button: {
			className: `${styles.button} ${styles.modeButton}`,
			onClick: props.toggleButtonMode,
		}}, props.valueFirst ? "value first" : "cell first"),
	]);
}

function checkValidity(options, puzzle, answers, solution, index, value) {
	if (options.autoCheck === AUTO_CHECK_MODES.off) {
		return new Set();
	}
	if (
		options.autoCheck === AUTO_CHECK_MODES.incorrect &&
		solution[index] !== value
	) {
		return new Set([index]);
	}

	const invalidIndices = new Set();
	for (const neighbor of getNeighbors(index)) {
		// check for conflicts in all neighbors
		const cellValue = puzzle[neighbor] || answers[neighbor];
		if (cellValue === value) {
			invalidIndices.add(neighbor);
		}
	}

	if (invalidIndices.size > 0) {
		invalidIndices.add(index);
	}

	return invalidIndices;
}

function updateNotes(notes, changes, index, value) {
	for (const neighbor of getNeighbors(index)) {
		// remove value from notes in all neighbors
		const prevNotes = notes[neighbor];
		notes[neighbor] = prevNotes.remove(value);

		if (!prevNotes.eq(notes[neighbor])) {
			changes[neighbor] = prevNotes;
		}
	}

	// clear notes for the given cell
	changes[index] = notes[index];
	notes[index] = new BitSet();
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

function applyChange(answers, notes, stack) {
	const change = stack.pop();
	const unChange = {};
	for (const [index, value] of Object.entries(change)) {
		if (value instanceof BitSet) {
			unChange[index] = answers[index] || notes[index];
			answers[index] = null;
			notes[index] = value;
		} else {
			unChange[index] = answers[index] || notes[index];
			answers[index] = value;
			notes[index] = new BitSet();
		}
	}

	return unChange;
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
			selectedValue: null,
			invalidIndices: null,
			noteMode: false,
			undoStack: [],
			redoStack: [],
		};

		// key holding state
		this.held = {};
		// load options
		this.options = getOptions();
		// check options for prefill
		const prefill = PREFILL_LEVELS[this.props.difficulty] >= this.options.notePrefill;
		if (this.props.initialAnswers == null && prefill) {
			fillNotes(this.props.puzzle, this.state.notes);
		}
		// initialize button mode
		if (this.options.buttonDefault === BUTTON_DEFAULTS.cellFirst) {
			this.state.valueFirst = false;
		} else if (this.options.buttonDefault === BUTTON_DEFAULTS.valueFirst) {
			this.state.valueFirst = true;
		} else {
			this.state.valueFirst = Number.parseInt(
				localStorage.getItem(BUTTON_MODE_KEY), 10,
			);
		}

		if (!this.props.fake) {
			// using auto-check disables high score saving
			const cheating = this.options.autoCheck === AUTO_CHECK_MODES.incorrect;
			const initialTime = cheating ? Infinity : this.props.initialTime;
			// set up timer
			this.endTimer = startTimer(
				initialTime || (prefill ? 3 * 60 * 1000 : 0),
			);

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
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.toggleNoteMode = this.toggleNoteMode.bind(this);
		this.toggleButtonMode = this.toggleButtonMode.bind(this);
		this.setHoveredIndex = this.setHoveredIndex.bind(this);
		this.setSelectedIndex = this.setSelectedIndex.bind(this);
		this.setSelectedValue = this.setSelectedValue.bind(this);
		this.undo = this.undo.bind(this);
		this.redo = this.redo.bind(this);
	}
	componentDidMount() {
		document.addEventListener("click", this.handleDocClick);
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}
	componentWillUnmount() {
		if (this.endTimer instanceof Function) {
			this.endTimer();
		}
		document.removeEventListener("click", this.handleDocClick);
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);
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
		const canWrap = this.options.wrapMode === WRAP_MODES.on;
		const sticky = this.options.wrapMode === WRAP_MODES.sticky;

		const action = parseAction(event);
		if (action == null) {
			return;
		}

		if (action === ACTIONS.noteMode) {
			this.toggleNoteMode();
		} else if (action === ACTIONS.buttonMode) {
			this.toggleButtonMode();
		} else if (action === ACTIONS.undo) {
			this.undo();
		} else if (action === ACTIONS.redo) {
			this.redo();
		} else if (action > 0 && action < 10) {
			event.preventDefault();
			this.setSelectedValue(action, event.ctrlKey);
		} else if (selectedIndex != null) {
			if (action === ACTIONS.delete) {
				this.setSelectedValue(null);
			} else if (action === ACTIONS.prev) {
				event.preventDefault();
				if (selectedIndex > 0) {
					this.setSelectedIndex(selectedIndex - 1, true);
				} else if (canWrap || (sticky && !this.held.prev)) {
					this.setSelectedIndex(80);
				}

				this.held.prev = true;
			} else if (action === ACTIONS.next) {
				event.preventDefault();
				if (selectedIndex < 80) {
					this.setSelectedIndex(selectedIndex + 1, true);
				} else if (canWrap || (sticky && !this.held.next)) {
					this.setSelectedIndex(0);
				}

				this.held.next = true;
			} else if (action === ACTIONS.left) {
				if (selectedIndex % 9 > 0) {
					this.setSelectedIndex(selectedIndex - 1, true);
				} else if (canWrap || (sticky && !this.held.left)) {
					this.setSelectedIndex(selectedIndex + 8, true);
				}

				this.held.left = true;
			} else if (action === ACTIONS.right) {
				if (selectedIndex % 9 < 8) {
					this.setSelectedIndex(selectedIndex + 1, true);
				} else if (canWrap || (sticky && !this.held.right)) {
					this.setSelectedIndex(selectedIndex - 8, true);
				}

				this.held.right = true;
			} else if (action === ACTIONS.up) {
				if (selectedIndex > 8) {
					this.setSelectedIndex(selectedIndex - 9, true);
				} else if (canWrap || (sticky && !this.held.up)) {
					this.setSelectedIndex(selectedIndex + 72, true);
				}

				this.held.up = true;
			} else if (action === ACTIONS.down) {
				if (selectedIndex < 72) {
					this.setSelectedIndex(selectedIndex + 9, true);
				} else if (canWrap || (sticky && !this.held.down)) {
					this.setSelectedIndex(selectedIndex - 72, true);
				}

				this.held.down = true;
			} else if (action === ACTIONS.set) {
				event.preventDefault();
				if (this.state.valueFirst) {
					this.setValue(
						this.state.selectedIndex,
						this.state.selectedValue,
					);
				} else {
					this.setSelectedIndex(this.state.selectedIndex);
				}
			}
		} else if ([
			ACTIONS.next, ACTIONS.prev,
			ACTIONS.left, ACTIONS.right, ACTIONS.up, ACTIONS.down,
		].includes(action)) {
			event.preventDefault();
			this.setSelectedIndex(0, true);
		}
	}
	handleKeyUp(event) {
		const action = parseAction(event);
		if (action == null) {
			return;
		}

		if (action === ACTIONS.left) {
			this.held.left = false;
		} else if (action === ACTIONS.right) {
			this.held.right = false;
		} else if (action === ACTIONS.up) {
			this.held.up = false;
		} else if (action === ACTIONS.down) {
			this.held.down = false;
		} else if (action === ACTIONS.prev) {
			this.held.prev = false;
		} else if (action === ACTIONS.next) {
			this.held.next = false;
		}
	}
	toggleNoteMode() {
		this.setState((state) => ({noteMode: !state.noteMode}));
	}
	toggleButtonMode() {
		this.setState((state) => ({
			valueFirst: !state.valueFirst,
			selectedValue: null,
		}), () =>
			localStorage.setItem(BUTTON_MODE_KEY, Number(this.state.valueFirst)),
		);
	}
	setHoveredIndex(hoveredIndex, hoveredValue) {
		this.setState({hoveredIndex, hoveredValue});
	}
	setSelectedIndex(selectedIndex, fromKeyboard = false) {
		if (this.state.valueFirst && !fromKeyboard) {
			this.setState({selectedIndex});
			this.setValue(selectedIndex, this.state.selectedValue);
		} else {
			this.setState({selectedIndex, invalidIndices: null});
			const selectedValue = this.props.puzzle[selectedIndex] || this.state.answers[selectedIndex];
			if (!fromKeyboard && (selectedIndex == null || selectedValue)) {
				this.setState({selectedValue});
			}
		}
	}
	setSelectedValue(selectedValue, noteOverride = false) {
		if (this.state.valueFirst) {
			this.setState({selectedValue, invalidIndices: null});
		} else if (this.state.selectedIndex != null) {
			this.setValue(this.state.selectedIndex, selectedValue, noteOverride);
		}
	}
	setValue(index, value, noteOverride = false) {
		const puzzle = this.props.puzzle;
		const answers = [...this.state.answers];
		const notes = [...this.state.notes];
		const counts = this.state.counts;

		if (this.state.noteMode || noteOverride) {
			if (puzzle[index] != null || answers[index] != null) {
				return;
			}

			const prevNotes = notes[index];
			if (value != null) {
				if (!notes[index].has(value)) {
					const invalidIndices = checkValidity(
						this.options,
						puzzle,
						answers,
						this.solution,
						index,
						value,
					);

					if (invalidIndices.size > 0) {
						this.setState({invalidIndices});
						return;
					}
				}

				notes[index] = notes[index].toggle(value);
			} else {
				notes[index] = new BitSet();
			}

			let undoStack = this.state.undoStack;
			if (!prevNotes.eq(notes[index])) {
				undoStack = undoStack.concat({[index]: prevNotes});
			}

			this.setState({
				notes,
				invalidIndices: null,
				undoStack,
				redoStack: [],
			});

			storeNotes(notes);
		} else if (
			index != null &&
			puzzle[index] == null &&
			answers[index] !== value &&
			(value == null || counts[value] < 9)
		) {
			const changes = {};
			if (value != null) {
				const invalidIndices = checkValidity(
					this.options,
					puzzle,
					answers,
					this.solution,
					index,
					value,
				);

				if (invalidIndices.size > 0) {
					this.setState({invalidIndices});
					return;
				}

				updateNotes(notes, changes, index, value);
				if (answers[index] != null) {
					changes[index] = answers[index];
				}
			} else {
				changes[index] = answers[index];
			}

			answers[index] = value;
			this.setState({
				selectedValue: value,
				answers,
				notes,
				counts: countValues(puzzle, answers),
				invalidIndices: null,
				undoStack: this.state.undoStack.concat(changes),
				redoStack: [],
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
	undo() {
		this.setState((state) => {
			if (state.undoStack.length === 0) {
				return null;
			}

			const answers = [...this.state.answers];
			const notes = [...this.state.notes];
			const undoStack = [...state.undoStack];
			const unChange = applyChange(answers, notes, undoStack);
			
			storeAnswers(answers);
			storeNotes(notes);

			return {
				answers,
				notes,
				counts: countValues(this.props.puzzle, answers),
				invalidIndices: null,
				undoStack,
				redoStack: state.redoStack.concat(unChange),
			};
		});
	}
	redo() {
		this.setState((state) => {
			if (state.redoStack.length === 0) {
				return null;
			}

			const answers = [...this.state.answers];
			const notes = [...this.state.notes];
			const redoStack = [...state.redoStack];
			const unChange = applyChange(answers, notes, redoStack);
			
			storeAnswers(answers);
			storeNotes(notes);

			return {
				answers,
				notes,
				counts: countValues(this.props.puzzle, answers),
				invalidIndices: null,
				undoStack: state.undoStack.concat(unChange),
				redoStack,
			};
		});
	}
	render() {
		return j({div: {
			className: styles.game,
			ref: this.gameRef,
		}}, [
			j([Board, {
				options: this.options,
				puzzle: this.props.puzzle,
				answers: this.state.answers,
				notes: this.state.notes,
				hoveredIndex: this.state.hoveredIndex,
				hoveredValue: this.state.hoveredValue,
				selectedIndex: this.state.selectedIndex,
				selectedValue: this.state.selectedValue,
				invalidIndices: this.state.invalidIndices,
				setHoveredIndex: this.setHoveredIndex,
				setSelectedIndex: this.setSelectedIndex,
			}]),
			j([Controls, {
				counts: this.state.counts,
				selectedValue: this.state.valueFirst && this.state.selectedValue,
				noteMode: this.state.noteMode,
				valueFirst: this.state.valueFirst,
				setSelectedValue: this.setSelectedValue,
				toggleNoteMode: this.toggleNoteMode,
				toggleButtonMode: this.toggleButtonMode,
			}]),
		]);
	}
};
