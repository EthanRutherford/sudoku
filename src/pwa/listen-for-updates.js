const updatesChannel = new BroadcastChannel("code-updates");

module.exports = {
	listenForUpdates(func) {
		updatesChannel.addEventListener("message", (event) => {
			func(event.data.payload);
		});
	},
};
