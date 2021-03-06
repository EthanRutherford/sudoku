const {Component, createRef} = require("react");
const {render} = require("react-dom");
const j = require("react-jenny");
const {requestPuzzle} = require("./generator/request-puzzle");
const {storeDifficulty} = require("./logic/game-store");
const {saveHighScore} = require("./logic/high-scores");
const {getStoredGame} = require("./logic/game-store");
const Header = require("./ui/header");
const Menu = require("./ui/menu");
const Game = require("./ui/game");
const Records = require("./ui/records");
const Results = require("./ui/results");
const Options = require("./ui/options");
const About = require("./ui/about");
const Devtools = require("./ui/dev-mode/devtools");
const Warning = require("./ui/warning");
require("./pwa/init-service-worker");
require("./view-height");
require("./styles/reset");
require("./styles/root");

const PAGES = {
	menu: 0,
	loading: 1,
	game: 2,
	results: 3,
	records: 4,
	options: 5,
	about: 6,
	devtools: 7,
};

const INITIAL_STATE = {
	page: PAGES.menu,
	difficulty: null,
	puzzle: null,
	initialAnswers: null,
	initialNotes: null,
	initialTime: null,
	score: null,
	warning: false,
};

function computeState(state) {
	if (state != null) {
		if (state.page === PAGES.game) {
			const {puzzle, answers, notes, time} = getStoredGame();

			return {
				...state,
				puzzle,
				initialAnswers: answers,
				initialNotes: notes,
				initialTime: time,
				score: null,
				warning: false,
			};
		}

		return {
			...INITIAL_STATE,
			...state,
		};
	}

	const page = PAGES[location.hash.slice(1)];

	if (page != null && page > PAGES.results) {
		return {...INITIAL_STATE, page};
	}

	history.replaceState({page: PAGES.menu}, null, "/");
	return {...INITIAL_STATE};
}

class App extends Component {
	constructor(...args) {
		super(...args);

		this.state = computeState(history.state);

		window.onpopstate = (event) => {
			this.setState(computeState(event.state));
		};

		this.gameRef = createRef();

		this.requestPuzzle = this.requestPuzzle.bind(this);
		this.resumePuzzle = this.resumePuzzle.bind(this);
		this.winGame = this.winGame.bind(this);
		this.openRecords = this.openRecords.bind(this);
		this.openOptions = this.openOptions.bind(this);
		this.openAbout = this.openAbout.bind(this);
		this.openDevtools = this.openDevtools.bind(this);
	}
	requestPuzzle(difficulty) {
		if (this.loading) return;

		if (!this.state.warning) {
			const existingGame = getStoredGame();

			if (existingGame.puzzle != null) {
				this.setState({
					difficulty,
					existingDifficulty: existingGame.difficulty,
					warning: true,
				});

				return;
			}
		}

		const prevPage = this.state.page;
		requestPuzzle(difficulty).then((puzzle) => this.setState({
			page: PAGES.game,
			difficulty,
			puzzle,
		}, () => {
			const method = `${prevPage === PAGES.menu ? "push" : "replace"}State`;

			history[method]({page: PAGES.game, difficulty}, null, `#${difficulty}`);
			this.loading = false;
		}));

		storeDifficulty(difficulty);

		// show loading screen if we don't get a puzzle quick enough
		setTimeout(() => {
			if (this.state.page !== PAGES.game) {
				this.setState({page: PAGES.loading, difficulty});
			}
		}, 400);

		this.loading = true;
	}
	resumePuzzle() {
		const {difficulty, puzzle, answers, notes, time} = getStoredGame();
		this.setState({
			page: PAGES.game,
			difficulty,
			puzzle,
			initialAnswers: answers,
			initialNotes: notes,
			initialTime: time,
		}, () => {
			history.pushState({page: PAGES.game, difficulty}, null, `#${difficulty}`);
		});
	}
	async winGame(score) {
		if (score !== Infinity) {
			await saveHighScore(this.state.difficulty, score);
		}

		this.setState({
			page: PAGES.results,
			puzzle: null,
			initialAnswers: null,
			initialNotes: null,
			initialTime: null,
			score,
		}, () => {
			history.replaceState({
				page: PAGES.results,
				difficulty: this.state.difficulty,
				score,
			}, null, "#results");
		});
	}
	openRecords() {
		this.setState({page: PAGES.records}, () => {
			history.pushState({page: PAGES.records}, null, "#records");
		});
	}
	openOptions() {
		this.setState({page: PAGES.options}, () => {
			history.pushState({page: PAGES.options}, null, "#options");
		});
	}
	openAbout() {
		this.setState({page: PAGES.about}, () => {
			history.pushState({page: PAGES.about}, null, "#about");
		});
	}
	openDevtools() {
		this.setState({page: PAGES.devtools}, () => {
			history.pushState({page: PAGES.devtools}, null, "#devtools");
		});
	}
	render() {
		const {
			page,
			difficulty,
			existingDifficulty,
			puzzle,
			initialAnswers,
			initialNotes,
			initialTime,
			score,
		} = this.state;

		if (page === PAGES.loading) {
			// lol this is really dumb but kinda fun :)
			requestAnimationFrame(() => this.forceUpdate());

			const fakepuzzle = [];
			for (let i = 0; i < 81; i++) {
				const value = Math.floor(Math.random() * 18);
				fakepuzzle.push(value > 8 ? null : value + 1);
			}

			return [
				j([Header, {difficulty: difficulty, key: 1}]),
				j([Game, {puzzle: fakepuzzle, fake: true, key: "fake"}]),
			];
		}

		if (page === PAGES.game) {
			return [
				j([Header, {
					difficulty,
					game: this.gameRef,
					showBack: true,
					showTimer: true,
					key: 1,
				}]),
				j([Game, {
					difficulty,
					puzzle,
					initialAnswers,
					initialNotes,
					initialTime,
					winGame: this.winGame,
					ref: this.gameRef,
					key: 2,
				}]),
			];
		}

		if (page === PAGES.results) {
			return [
				j([Header, {difficulty, showBack: true, key: 1}]),
				j([Results, {
					difficulty,
					score: score,
					requestPuzzle: this.requestPuzzle,
					key: 2,
				}]),
			];
		}

		if (page === PAGES.records) {
			return [
				j([Header, {showBack: true, key: 1}]),
				j([Records, {key: 2}]),
			];
		}

		if (page === PAGES.options) {
			return [
				j([Header, {showBack: true, key: 1}]),
				j([Options, {key: 2}]),
			];
		}

		if (page === PAGES.about) {
			return [
				j([Header, {showBack: true, key: 1}]),
				j([About, {key: 2}]),
			];
		}

		if (page === PAGES.devtools) {
			return [
				j([Header, {showBack: true, key: 1}]),
				j([Devtools, {key: 2}]),
			];
		}

		return [
			j([Header, {key: 1}]),
			j([Menu, {
				requestPuzzle: this.requestPuzzle,
				resumePuzzle: this.resumePuzzle,
				openRecords: this.openRecords,
				openOptions: this.openOptions,
				openAbout: this.openAbout,
				openDevtools: this.openDevtools,
				key: 2,
			}]),
			this.state.warning && j([Warning, {
				header: "Ongoing game",
				content: `You currently have an ongoing ${existingDifficulty} puzzle, do you want to abandon it?`,
				confirm: "start new game",
				cancel: "cancel",
				onConfirm: () => this.requestPuzzle(difficulty),
				onCancel: () => this.setState({warning: false}),
				key: 3,
			}]),
		];
	}
}

render(j(App), document.getElementById("react-root"));
