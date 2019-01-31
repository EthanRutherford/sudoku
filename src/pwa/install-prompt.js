let deferredPrompt = null;
let listener = null;

window.addEventListener("beforeinstallprompt", (event) => {
	event.preventDefault();
	deferredPrompt = event;

	if (listener instanceof Function) {
		listener();
	}
});

module.exports = {
	notifyCanPrompt(func) {
		listener = func;
		if (listener && deferredPrompt) {
			listener();
		}
	},
	promptForInstall() {
		deferredPrompt.prompt();

		return deferredPrompt.userChoice.then((choiceResult) => {
			deferredPrompt = null;

			return choiceResult.outcome === "accepted";
		});
	},
};
