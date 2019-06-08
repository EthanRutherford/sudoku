const {useState} = require("react");
const j = require("react-jenny");
const Select = require("./select");
const ScoreList = require("./score-list");
const styles = require("../styles/records");

const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

module.exports = function Records() {
	const [difficulty, setDifficulty] = useState("easy");
	return j({div: styles.records}, [
		j({div: styles.selectWrapper},
			j([Select, {
				value: difficulty,
				onChange: setDifficulty,
			}], DIFFICULTIES.map((name) =>
				({value: name, display: `${name} high scores`}),
			)),
		),
		j([ScoreList, {difficulty}]),
	]);
};
