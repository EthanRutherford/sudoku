const {storeTime} = require("../logic/game-store");

function startTimer(initialTime) {
	let time = initialTime || 0;
	let lastStamp;
	let frameId;
	function animationFrame(stamp) {
		frameId = requestAnimationFrame(animationFrame);
		const diff = stamp - lastStamp;
		lastStamp = stamp;

		// if the difference is large, then the user
		// must have tabbed away or locked their device
		if (diff < 1000) {
			time += diff;
		}

		storeTime(time);
	}

	requestAnimationFrame(animationFrame);

	return function endTimer() {
		cancelAnimationFrame(frameId);
		return Math.round(time);
	};
}

function prettifyTime(milliseconds) {
	const secondsTotal = Math.floor(milliseconds / 1000);
	const seconds = secondsTotal % 60;
	const minutesTotal = Math.floor(secondsTotal / 60);
	const minutes = minutesTotal % 60;
	const hours = Math.floor(minutesTotal / 60);

	// if someone needs more than just hours, god help them
	const hourString = hours === 0 ? "" : `${hours}h `;
	const secondsString = `:${seconds > 9 ? "" : "0"}${seconds}`;
	return `${hourString}${minutes}${secondsString}`;
}

function prettifyDate(timestamp) {
	const date = new Date(timestamp);
	return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

module.exports = {startTimer, prettifyTime, prettifyDate};
