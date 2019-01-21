const difficultyKeys = {
	easy: "easyHighScores",
	medium: "mediumHighScores",
	hard: "hardHighScores",
	expert: "expertHighScores",
};

function getHighScores(difficulty) {
	const highScores = localStorage.getItem(difficultyKeys[difficulty]);
	return highScores ? JSON.parse(highScores) : [];
}

const sortScoresMethod = (a, b) => a.score - b.score;

function saveHighScore(difficulty, score) {
	const scores = getHighScores(difficulty);
	scores.push({score, date: Date.now()});
	scores.sort(sortScoresMethod);
	scores.splice(100);
	localStorage.setItem(difficultyKeys[difficulty], JSON.stringify(scores));
}

function resetAllScores() {
	for (const key of Object.values(difficultyKeys)) {
		localStorage.removeItem(key);
	}
}

module.exports = {
	getHighScores,
	saveHighScore,
	resetAllScores,
};
