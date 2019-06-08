const {useState, useEffect} = require("react");
const j = require("react-jenny");
const UpdateIcon = require("../../images/update");
const UndoIcon = require("../../images/undo");
const RedoIcon = require("../../images/redo");
const {getOptions} = require("../logic/options");
const {listenForUpdates} = require("../pwa/listen-for-updates");
const {watchTimer, prettifyTime} = require("./util");
const styles = require("../styles/header");

function Timer() {
	const [time, setTime] = useState(0);
	useEffect(() => {
		watchTimer(setTime);
		return () => watchTimer(null);
	}, []);

	return time === Infinity ? "N/A" : prettifyTime(time);
}

function NeedsUpdate() {
	const [showButton, setShowButton] = useState(false);
	useEffect(() => {
		listenForUpdates(() => setShowButton(true));
		return () => listenForUpdates(null);
	}, []);

	return showButton && j({button: {
		className: styles.update,
		onClick: () => location.reload(),
		title: "click to install new version",
	}}, j([UpdateIcon]));
}

function UndoRedoButtons(props) {
	return j({div: styles.undoRedo}, [
		j({button: {onClick: () => props.game.current.undo()}}, j([UndoIcon])),
		j({button: {onClick: () => props.game.current.redo()}}, j([RedoIcon])),
	]);
}

module.exports = function Header(props) {
	const showTimer = props.showTimer && getOptions().timer;
	const titleParts = ["Sudoku"];
	if (showTimer) {
		titleParts[0] = `${props.difficulty} - `;
		titleParts.push(j([Timer]));
	} else if (props.difficulty) {
		titleParts.push(` - ${props.difficulty}`);
	}

	return j({div: styles.header}, j({div: styles.content}, [
		props.showBack && j({button: {
			className: styles.back,
			onClick: () => history.back(),
		}}),
		j({span: styles.title}, titleParts),
		props.game ? j([UndoRedoButtons, props]) : j([NeedsUpdate]),
	]));
};
