const {useRef} = require("react");
const j = require("react-jenny");
const DIFFICULTIES = require("../logic/difficulties");
const {getStoredGame} = require("../logic/game-store");
const {getIsDeveloper, setIsDeveloper} = require("./dev-mode/dev-util");
const styles = require("../styles/menu");

module.exports = function Menu(props) {
	const canResume = getStoredGame().puzzle != null;
	const {current: devClicks} = useRef({count: 0, timer: null});

	return j({div: styles.menu}, [
		j({div: styles.columns}, [
			j({div: styles.column},
				DIFFICULTIES.map((difficulty) =>
					j({button: {
						className: styles.button,
						onClick: () => props.requestPuzzle(difficulty),
						key: difficulty,
					}}, difficulty),
				),
			),
			j({div: styles.column}, [
				j({button: {
					className: styles.button,
					onClick: props.resumePuzzle,
					disabled: !canResume,
				}}, "resume"),
				j({button: {
					className: styles.button,
					onClick: props.openRecords,
				}}, "records"),
				j({button: {
					className: styles.button,
					onClick: props.openOptions,
				}}, "options"),
				j({button: {
					className: styles.button,
					onClick: props.openAbout,
				}}, "about"),
				j({div: {
					className: styles.copyright,
					onClick: () => {
						if (getIsDeveloper()) {
							props.openDevtools();
							return;
						}

						if (++devClicks.count === 10) {
							setIsDeveloper(true);
						}

						clearTimeout(devClicks.timer);
						devClicks.timer = setTimeout(() => devClicks.count = 0, 200);
					},
				}}, [
					"© " + new Date().getFullYear(), j("br"), "Ethan Rutherford",
				]),
			]),
		]),
	]);
};
