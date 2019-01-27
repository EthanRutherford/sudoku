const {Component} = require("react");
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
			scoresToShow: mappedScores,
			etcStart: false,
			etcEnd: false,
		};
	}

	const found = highScores.findIndex((item) => item.score === score);
	const matchIndex = found === -1 ? 100 : found;
	const end = Math.max(10, Math.min(matchIndex + 5, highScores.length));
	const start = end - 10;
	const scoresToShow = mappedScores.slice(start, end);

	return {
		loading: false,
		scoresToShow,
		matchIndex,
		etcStart: start > 0,
		etcEnd: end < highScores.length,
	};
}

module.exports = class ScoreList extends Component {
	constructor(...args) {
		super(...args);

		this.state = {
			loading: true,
			scoresToShow: [],
		};

		getFormattedScores(this.props.difficulty, this.props.score).then(
			(state) => this.setState(state),
		);
	}
	async componentWillReceiveProps(nextProps) {
		this.setState(await getFormattedScores(
			nextProps.difficulty,
			nextProps.score,
		));
	}
	render() {
		const {
			loading,
			scoresToShow,
			matchIndex,
			etcStart,
			etcEnd,
		} = this.state;

		return j({ul: styles.list}, [
			etcStart && j({li: etc}, "•••"),
			scoresToShow.map(({index, score, date}) =>
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
			scoresToShow.length === 0 && j({div: loading || none}),
		]);
	}
};
