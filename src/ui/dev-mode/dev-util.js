const IS_DEVELOPER_KEY = "isDeveloperModeEnabled";
let isDev = null;

function initIsDeveloper() {
	if (isDev == null) {
		const storage = localStorage.getItem(IS_DEVELOPER_KEY);
		if (storage == null || JSON.parse(storage) !== 1) {
			isDev = false;
		} else {
			isDev = true;
		}
	}
}

function storeIsDeveloper(value) {
	localStorage.setItem(IS_DEVELOPER_KEY, JSON.stringify(value));
}

module.exports = {
	getIsDeveloper() {
		initIsDeveloper();
		return isDev;
	},
	setIsDeveloper(value) {
		storeIsDeveloper(value ? 1 : 0);
		isDev = !!value;
		return isDev;
	},
};
