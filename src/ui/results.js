const j = require("react-jenny");
const ScoreList = require("./score-list");
const styles = require("../styles/results");

const congrats = [
	"Congratulations!",
	"Congrats!",
	"Congrts!",
	"Congroots!",
	"Wonderful!",
	"Fantastic!",
	"Well done!",
	"You did it!",
	"Success!",
	"Splendid!",
	"Splendiferous!",
	"Fantasmical!",
	"Great job!",
	"Good jorb!",
	"Fabulous!",
	"I am groot!",
	"Stupendous!",
	"Wondrous!",
	"You win!",
	"You deed it!",
	"Amazon!",
	"Amazing!",
	"You've won!",
	"Nice!",
	"Help! I'm trapped in a sudoku factory!",
];

function getRand(list) {
	const index = Math.floor(Math.random() * list.length);
	return list[index];
}

module.exports = function Results({difficulty, score, requestPuzzle}) {
	const message = getRand(congrats);

	return j({div: styles.results}, [
		j({h2: styles.title}, message),
		j([ScoreList, {difficulty, score}]),
		j({div: styles.buttons}, [
			j({button: {
				className: styles.button,
				onClick: () => requestPuzzle(difficulty),
			}}, "play again"),
			j({button: {
				className: styles.button,
				onClick: () => history.back(),
			}}, "main menu"),
		]),
	]);
};
