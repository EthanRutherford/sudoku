const j = require("react-jenny");
const DIFFICULTIES = require("../logic/difficulties");
const {getStoredGame} = require("../logic/game-store");
const styles = require("../styles/menu");

module.exports = function Menu(props) {
	const canResume = getStoredGame().puzzle != null;

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
			]),
		]),
	]);
};
