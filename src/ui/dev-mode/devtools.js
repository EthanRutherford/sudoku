const {useEffect, useState, useMemo} = require("react");
const j = require("react-jenny");
const DIFFICULTIES = require("../../logic/difficulties");
const {getStoredGame} = require("../../logic/game-store");
const {requestCounts} = require("../../generator/request-puzzle");
const styles = require("./styles");

module.exports = function Devtools() {
	const storedGame = useMemo(() => {
		const game = getStoredGame();
		return game ? {
			difficulty: game.difficulty,
			time: game.time / 1000,
			puzzle: game.puzzle.map((x) => x || "•"),
			answers: game.answers.map((x) => x || "•"),
			notes: game.notes.reduce((code, note) => code + note.toString(), ""),
		} : null;
	}, []);
	const [counts, setCounts] = useState([]);
	useEffect(() => {
		const timer = setInterval(async () => {
			setCounts(await requestCounts());
		}, 100);
		return () => clearInterval(timer);
	}, []);

	return j({div: styles.dev}, [
		j({h2: styles.header}, "Devtools"),
		j({h3: styles.heading}, "Puzzle counts"),
		j({div: styles.counts}, [
			...DIFFICULTIES.map((x) => j({div: styles.diff}, x)),
			...counts.map((x) => j({div: styles.count}, x)),
		]),
		...storedGame && [
			j({h3: styles.heading}, "Current saved game"),
			j({div: styles.savedGame}, [storedGame.difficulty, " - ", storedGame.time, "s"]),
			j({div: styles.savedGame}, ["puzzle: ", storedGame.puzzle]),
			j({div: styles.savedGame}, ["filled: ", storedGame.answers]),
			j({div: styles.savedGame}, ["notes: ", storedGame.notes]),
		],
	]);
};
