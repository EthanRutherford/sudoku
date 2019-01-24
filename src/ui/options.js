const j = require("react-jenny");
const {Component} = require("react");
const {
	GUIDE_MODES,
	HOVER_MODES,
	WRAP_MODES,
	BUTTON_DEFAULTS,
	AUTO_CHECK_MODES,
	PREFILL_LEVELS,
	DEFAULT_OPTIONS,
	getOptions,
	saveOptions,
} = require("../logic/options");
const {resetAllScores} = require("../logic/high-scores");
const Warning = require("./warning");
const styles = require("../styles/options");

const HOVER_DESCRIPTIONS = {
	[HOVER_MODES.off]: "Hovering over cells will have no effect on the guide",
	[HOVER_MODES.hoverOnly]: "The guide will only be shown when hovering a cell",
	[HOVER_MODES.sticky]: "The guide will show for hovered cells, until a cell is selected. It will then \"stick\" to the selected cell.",
	[HOVER_MODES.hybrid]: "The guide will show for hovered cells, but will show for the selected cell when no cell is hovered.",
};

const WRAP_DESCRIPTIONS = {
	[WRAP_MODES.off]: "When using the keyboard to navigate, selection will not wrap at the edges of board.",
	[WRAP_MODES.sticky]: "When using the keyboard to navigate, selection will wrap at the edges of board, but will \"stick\" to the edges as long as the key is held.",
	[WRAP_MODES.on]: "When using the keyboard to navigate, selection will always wrap at the edges of board.",
};

const AUTO_CHECK_DESCRIPTIONS = {
	[AUTO_CHECK_MODES.off]: "The game will not inform you of any kind of error.",
	[AUTO_CHECK_MODES.invalid]: "The game will inform you when a selected value conflicts with the current board.",
	[AUTO_CHECK_MODES.incorrect]: "The game will inform you when a selected value does not match the solution.",
};

const selectedOption = `${styles.option} ${styles.selected}`;

function Select({value, onChange, children: options}) {
	const values = value instanceof Array ? value : [value];
	const selected = options.filter((x) => values.includes(x.value));
	const display = selected.map((option) => option.display).join(", ");

	return j({div: styles.selectWrapper}, [
		j({input: {
			className: styles.selectInput,
			readOnly: true,
			value: display || "none",
		}}),
		j({div: styles.selectDropdown}, options.map((option) =>
			j({button: {
				className: selected.includes(option) ? selectedOption : styles.option,
				onMouseDown: () => onChange(option.value),
			}}, option.display),
		)),
	]);
}

module.exports = class Options extends Component {
	constructor(...args) {
		super(...args);

		this.state = getOptions();
	}
	updateOptions(state) {
		this.setState(state, () => saveOptions(this.state));
	}
	render() {
		return j({div: styles.options}, [
			j({h2: styles.title}, "Options"),
			// TODO: timer will go here
			j({div: styles.section}, [
				j({h3: styles.label}, "guide mode"),
				j({div: styles.description}, [
					"Show a guide, highlighting the chosen items; ",
					"neighbors of the current cell, matching values, ",
					"and matching notes.",
				]),
				j([Select, {
					value: this.state.guideMode.values,
					onChange: (value) => this.updateOptions({
						guideMode: this.state.guideMode.toggle(value),
					}),
				}], [
					{value: GUIDE_MODES.neighbors, display: "neighbors"},
					{value: GUIDE_MODES.values, display: "values"},
					{value: GUIDE_MODES.notes, display: "pencil marks"},
				]),
			]),
			this.state.guideMode > 0 && j({div: styles.section}, [
				j({h3: styles.label}, "hover mode"),
				j({div: styles.description}, [
					HOVER_DESCRIPTIONS[this.state.hoverMode],
				]),
				j([Select, {
					value: this.state.hoverMode,
					onChange: (value) => this.updateOptions({
						hoverMode: value,
					}),
				}], [
					{value: HOVER_MODES.off, display: "off"},
					{value: HOVER_MODES.hoverOnly, display: "hover only"},
					{value: HOVER_MODES.sticky, display: "sticky"},
					{value: HOVER_MODES.hybrid, display: "hybrid"},
				]),
			]),
			j({div: styles.section}, [
				j({h3: styles.label}, "wrapping mode"),
				j({div: styles.description}, [
					WRAP_DESCRIPTIONS[this.state.wrapMode],
				]),
				j([Select, {
					value: this.state.wrapMode,
					onChange: (value) => this.updateOptions({
						wrapMode: value,
					}),
				}], [
					{value: WRAP_MODES.off, display: "off"},
					{value: WRAP_MODES.sticky, display: "sticky"},
					{value: WRAP_MODES.on, display: "on"},
				]),
			]),
			j({div: styles.section}, [
				j({h3: styles.label}, "default button mode"),
				j({div: styles.description}, [
					"Determines what mode the buttons default to.",
				]),
				j([Select, {
					value: this.state.buttonDefault,
					onChange: (value) => this.updateOptions({
						buttonDefault: value,
					}),
				}], [
					{value: BUTTON_DEFAULTS.cellFirst, display: "cell first"},
					{value: BUTTON_DEFAULTS.valueFirst, display: "value first"},
					{value: BUTTON_DEFAULTS.lastUsed, display: "last used"},
				]),
			]),
			j({div: styles.section}, [
				j({h3: styles.label}, "auto-check"),
				j({div: styles.description}, [
					AUTO_CHECK_DESCRIPTIONS[this.state.autoCheck],
				]),
				j([Select, {
					value: this.state.autoCheck,
					onChange: (value) => this.updateOptions({
						autoCheck: value,
					}),
				}], [
					{value: AUTO_CHECK_MODES.off, display: "off"},
					{value: AUTO_CHECK_MODES.invalid, display: "invalid cells"},
					{value: AUTO_CHECK_MODES.incorrect, display: "incorrect value"},
				]),
			]),
			j({div: styles.section}, [
				j({h3: styles.label}, "prefill pencil marks"),
				j({div: styles.description}, [
					"When enabled, pencil marks will automatically be filled at the start of a new game of the selected difficulties.",
				]),
				j([Select, {
					value: this.state.notePrefill,
					onChange: (value) => this.updateOptions({
						notePrefill: value,
					}),
				}], [
					{value: PREFILL_LEVELS.easy, display: "easy and higher"},
					{value: PREFILL_LEVELS.medium, display: "medium and higher"},
					{value: PREFILL_LEVELS.hard, display: "hard and higher"},
					{value: PREFILL_LEVELS.expert, display: "expert only"},
					{value: PREFILL_LEVELS.off, display: "none"},
				]),
			]),
			j({div: styles.separator}),
			j({div: styles.section}, [
				j({button: {
					className: styles.button,
					onClick: () => this.updateOptions(DEFAULT_OPTIONS),
				}}, "reset to defaults"),
			]),
			j({div: styles.section}, [
				j({button: {
					className: styles.button,
					onClick: () => this.setState({confirm: true}),
				}}, "reset scores"),
			]),
			this.state.confirm && j([Warning, {
				header: "Are you sure?",
				content: "This will wipe all your saves, and cannot be undone!",
				confirm: "delete anyway",
				cancel: "cancel",
				onConfirm: () => {
					resetAllScores();
					this.setState({confirm: false});
				},
				onCancel: () => this.setState({confirm: false}),
			}]),
		]);
	}
};
