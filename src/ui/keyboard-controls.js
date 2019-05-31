const ACTIONS = {
	delete: 0,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	noteMode: 10,
	buttonMode: 11,
	undo: 12,
	redo: 13,
	prev: 14,
	next: 15,
	left: 16,
	right: 17,
	up: 18,
	down: 19,
	set: 20,
};

function parseAction(event) {
	const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
	const code = event.code;

	if (code.startsWith("Digit") || code.startsWith("Numpad")) {
		const reg = /(Digit)|(Numpad)/;
		return Number.parseInt(code.replace(reg, ""), 10);
	}
	if (["0", " ", "Backspace", "Delete"].includes(key)) {
		return ACTIONS.delete;
	}

	if (key === "p") {
		return ACTIONS.noteMode;
	}
	if (key === "b") {
		return ACTIONS.buttonMode;
	}

	if (key === "z" && event.ctrlKey) {
		return ACTIONS.undo;
	}
	if (key === "y" && event.ctrlKey) {
		return ACTIONS.redo;
	}

	if (key === "Tab") {
		return event.shiftKey ? ACTIONS.prev : ACTIONS.next;
	}
	if (["ArrowLeft", "a"].includes(key)) {
		return ACTIONS.left;
	}
	if (["ArrowRight", "d"].includes(key)) {
		return ACTIONS.right;
	}
	if (["ArrowUp", "w"].includes(key)) {
		return ACTIONS.up;
	}
	if (["ArrowDown", "s"].includes(key)) {
		return ACTIONS.down;
	}

	if (event.key === "Enter") {
		return ACTIONS.set;
	}

	return null;
}

module.exports = {ACTIONS, parseAction};
