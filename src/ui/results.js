const j = require("react-jenny");
const {getHighScores} = require("../logic/high-scores");
const {prettifyTime, prettifyDate} = require("./util");
const styles = require("../styles/results");

const etc = `${styles.listItem} ${styles.etc}`;
const current = `${styles.listItem} ${styles.current}`;

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

module.exports = function Results(props) {
	const message = getRand(congrats);
	const highScores = getHighScores(props.difficulty);
	const found = highScores.findIndex((item) => item.score === props.score);
	const matchIndex = found === -1 ? 100 : found;

	const end = Math.max(10, Math.min(matchIndex + 5, highScores.length));
	const start = end - 10;
	const scoresToShow = highScores.map(
		({score, date}, index) => ({index, score, date}),
	).slice(start, end);

	console.log(start);

	return j({div: styles.results}, [
		j({h2: {className: styles.title}}, message),
		j({ul: styles.list}, [
			start > 0 && j({li: etc}, "•••"),
			scoresToShow.map(({index, score, date}) =>
				j({li: {
					className: matchIndex === index ? current : styles.listItem,
					key: score,
				}}, [
					j({div: styles.rank}, index + 1),
					j({div: styles.date}, prettifyDate(date)),
					j({div: styles.score}, prettifyTime(score)),
				]),
			),
			end < highScores.length - 1 && j({li: etc}, "•••"),
		]),
		j({div: styles.buttons}, [
			j({button: {
				className: styles.button,
				onClick: () => props.requestPuzzle(props.difficulty),
			}}, "Play again"),
			j({button: {
				className: styles.button,
				onClick: props.goBack,
			}}, "Main menu"),
		]),
	]);
};
