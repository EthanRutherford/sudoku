const {useState, useEffect} = require("react");
const j = require("react-jenny");
const {getHighScores} = require("../logic/high-scores");
const {prettifyTime, prettifyDate} = require("./util");
const styles = require("../styles/score-list");

const etc = `${styles.listItem} ${styles.etc}`;
const none = `${styles.listItem} ${styles.none}`;
const current = `${styles.listItem} ${styles.current}`;

async function getFormattedScores(difficulty, score) {
	const highScores = await getHighScores(difficulty);
	const mappedScores = highScores.map(
		(entry, index) => ({index, ...entry}),
	);

	if (score == null) {
		return {
			loading: false,
			scores: mappedScores,
			etcStart: false,
			etcEnd: false,
		};
	}

	const found = highScores.findIndex((item) => item.score === score);
	const matchIndex = found === -1 ? 100 : found;
	const end = Math.max(10, Math.min(matchIndex + 5, highScores.length));
	const start = end - 10;
	const scores = mappedScores.slice(start, end);

	return {
		loading: false,
		scores,
		matchIndex,
		etcStart: start > 0,
		etcEnd: end < highScores.length,
	};
}

module.exports = function ScoreList(props) {
	const [state, setState] = useState({loading: true, scores: []});
	useEffect(() => {
		getFormattedScores(props.difficulty, props.score).then(setState);
	}, [props.difficulty]);

	const {
		loading,
		scores,
		matchIndex,
		etcStart,
		etcEnd,
	} = state;

	return j({ul: styles.list}, [
		etcStart && j({li: etc}, "•••"),
		scores.map(({index, score, date}) =>
			j({
				li: {
					className: matchIndex === index ? current : styles.listItem,
					key: score,
				},
			}, [
				j({div: styles.rank}, index + 1),
				j({div: styles.date}, prettifyDate(date)),
				j({div: styles.score}, prettifyTime(score)),
			]),
		),
		etcEnd && j({li: etc}, "•••"),
		scores.length === 0 && j({div: loading || none}),
	]);
};
