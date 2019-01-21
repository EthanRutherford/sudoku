const BitSet = require("./bit-set");

const OPTIONS_STORAGE_KEY = "optionsState";

const OPTIONS_KEYS = [
	"timer",
	"guideMode",
	"hoverMode",
	"wrapMode",
	"buttonDefault",
	"autoCheck",
	"notePrefill",
];

const GUIDE_MODES = {
	neighbors: 1,
	values: 2,
	notes: 3,
};

const HOVER_MODES = {
	off: 0,
	hoverOnly: 1,
	sticky: 2,
	hybrid: 3,
};

const WRAP_MODES = {
	off: 0,
	sticky: 1,
	on: 2,
};

const BUTTON_DEFAULTS = {
	cellFirst: 0,
	valueFirst: 1,
	lastUsed: 2,
};

const AUTO_CHECK_MODES = {
	off: 0,
	invalid: 1,
	incorrect: 2,
};

const PREFILL_LEVELS = {
	easy: 0,
	medium: 1,
	hard: 2,
	expert: 3,
	off: 4,
};

const DEFAULT_OPTIONS = Object.freeze({
	timer: 0,
	guideMode: new BitSet(0b111),
	hoverMode: HOVER_MODES.hybrid,
	wrapMode: WRAP_MODES.sticky,
	buttonDefault: BUTTON_DEFAULTS.lastUsed,
	autoCheck: AUTO_CHECK_MODES.invalid,
	notePrefill: PREFILL_LEVELS.off,
});

function saveOptions(options) {
	const values = OPTIONS_KEYS.map((key) => options[key]);
	const compacted = values.join("");
	localStorage.setItem(OPTIONS_STORAGE_KEY, compacted);
}

function getOptions() {
	const compacted = localStorage.getItem(OPTIONS_STORAGE_KEY);

	// return default options if none are saved
	if (compacted === null) {
		return DEFAULT_OPTIONS;
	}

	// translate into options object
	const values = compacted.split("");
	const options = OPTIONS_KEYS.reduce((object, key, index) => {
		// guide mode is a bitset
		if (key === "guideMode") {
			object.guideMode = BitSet.fromString(values[index]);
		} else {
			object[key] = Number.parseInt(values[index], 10);
		}

		return object;
	}, {});

	return options;
}

module.exports = {
	GUIDE_MODES,
	HOVER_MODES,
	WRAP_MODES,
	BUTTON_DEFAULTS,
	AUTO_CHECK_MODES,
	PREFILL_LEVELS,
	DEFAULT_OPTIONS,
	getOptions,
	saveOptions,
};
