const j = require("react-jenny");
const {getStoredGame} = require("../logic/game-store");
const styles = require("../styles/menu");

const DIFFICULTIES = [
	"easy",
	"medium",
	"hard",
	"expert",
];

module.exports = function Menu(props) {
	const {difficulty, puzzle, answers, notes, time} = getStoredGame();

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
					onClick: () => props.resumePuzzle(
						difficulty,
						puzzle,
						answers,
						notes,
						time,
					),
					disabled: puzzle == null,
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
