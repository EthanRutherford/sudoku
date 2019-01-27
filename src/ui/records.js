const {Component} = require("react");
const j = require("react-jenny");
const Select = require("./select");
const ScoreList = require("./score-list");
const styles = require("../styles/records");

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

module.exports = class Records extends Component {
	constructor(...args) {
		super(...args);

		this.state = {difficulty: "easy"};
	}
	render() {
		const {difficulty} = this.state;

		return j({div: styles.records}, [
			j({div: styles.selectWrapper},
				j([Select, {
					value: difficulty,
					onChange: (value) => this.setState({difficulty: value}),
				}], DIFFICULTIES.map((name) =>
					({value: name, display: `${name} high scores`}),
				)),
			),
			j([ScoreList, {difficulty}]),
		]);
	}
};
