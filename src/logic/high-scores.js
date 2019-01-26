const sortScoresMethod = (a, b) => a.score - b.score;

function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("saveData", 1);

		request.onupgradeneeded = function(event) {
			const database = event.target.result;
			const transaction = event.target.transaction;
			const oldStorageKeys = {
				easy: "easyHighScores",
				medium: "mediumHighScores",
				hard: "hardHighScores",
				expert: "expertHighScores",
			};

			// create a table for high scores
			database.createObjectStore("highScores");

			// check for any old versions of high scores
			for (const [difficulty, key] of Object.entries(oldStorageKeys)) {
				const stored = localStorage.getItem(key);
				if (stored == null) {
					continue;
				}

				const highScores = JSON.parse(stored);
				const objectStore = transaction.objectStore("highScores");
				const request = objectStore.add(highScores, difficulty);
				request.onsuccess = function() {
					localStorage.removeItem(key);
				};
			}
		};

		request.onerror = reject;
		request.onsuccess = function() {
			resolve(this.result);
		};
	});
}

function getHighScores(db, difficulty, transaction = null) {
	return new Promise((resolve, reject) => {
		transaction = transaction || db.transaction(["highScores"]);
		const objectStore = transaction.objectStore("highScores");

		const request = objectStore.get(difficulty);
		request.onerror = reject;
		request.onsuccess = function(event) {
			resolve(event.target.result || []);
		};
	});
}

function saveHighScore(db, difficulty, score) {
	return new Promise(async(resolve, reject) => {
		const transaction = db.transaction(["highScores"], "readwrite");
		const objectStore = transaction.objectStore("highScores");

		const highScores = await getHighScores(db, difficulty, transaction);
		highScores.push({score, date: Date.now()});
		highScores.sort(sortScoresMethod);
		highScores.splice(100);

		const request = objectStore.put(highScores, difficulty);
		request.onerror = reject;
		request.onsuccess = resolve;
	});
}

function resetAllScores(db) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(["highScores"], "readwrite");
		const objectStore = transaction.objectStore("highScores");

		const request = objectStore.clear();
		request.onerror = reject;
		request.onsuccess = resolve;
	});
}

module.exports = {
	getHighScores: async(difficulty) => await getHighScores(await openDatabase(), difficulty),
	saveHighScore: async(difficulty, score) => await saveHighScore(await openDatabase(), difficulty, score),
	resetAllScores: async() => await resetAllScores(await openDatabase()),
};
