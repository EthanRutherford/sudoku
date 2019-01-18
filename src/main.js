const {Component} = require("react");
const {render} = require("react-dom");
const j = require("react-jenny");
const {storeDifficulty} = require("./logic/game-store");
const {saveHighScore} = require("./logic/high-scores");
const Header = require("./ui/header");
const Menu = require("./ui/menu");
const Game = require("./ui/game");
const Results = require("./ui/results");
const ComingSoon = require("./ui/coming-soon");
require("./styles/reset");
require("./styles/root");

const PAGES = {
	menu: 0,
	loading: 1,
	game: 2,
	results: 3,
	records: 4,
	options: 5,
};

const INITIAL_STATE = {
	page: PAGES.menu,
	difficulty: null,
	puzzle: null,
	initialAnswers: null,
	initialNotes: null,
	initialTime: null,
	score: null,
};

class App extends Component {
	constructor(...args) {
		super(...args);

		this.state = {...INITIAL_STATE};

		// set up the sudoku generator worker
		this.generator = new Worker("/dist/worker.js");
		this.generator.onmessage = (event) => {
			this.setState({
				page: PAGES.game,
				puzzle: event.data,
			});
		};

		this.requestPuzzle = this.requestPuzzle.bind(this);
		this.resumePuzzle = this.resumePuzzle.bind(this);
		this.winGame = this.winGame.bind(this);
		this.openRecords = this.openRecords.bind(this);
		this.openOptions = this.openOptions.bind(this);
		this.goBack = this.goBack.bind(this);
	}
	requestPuzzle(difficulty) {
		this.loadStartTime = Date.now();
		this.generator.postMessage(difficulty);
		this.setState({
			page: PAGES.loading,
			difficulty,
			puzzle: null,
		});

		storeDifficulty(difficulty);
	}
	resumePuzzle(difficulty, puzzle, initialAnswers, initialNotes, initialTime) {
		this.setState({
			page: PAGES.game,
			difficulty,
			puzzle,
			initialAnswers,
			initialNotes,
			initialTime,
		});
	}
	winGame(score) {
		saveHighScore(this.state.difficulty, score);
		this.setState({
			page: PAGES.results,
			score,
		});
	}
	openRecords() {
		this.setState({page: PAGES.records});
	}
	openOptions() {
		this.setState({page: PAGES.options});
	}
	goBack() {
		this.setState(INITIAL_STATE);
	}
	render() {
		const {
			page,
			difficulty,
			puzzle,
			initialAnswers,
			initialNotes,
			initialTime,
			score,
		} = this.state;

		if (
			page === PAGES.loading &&
			Date.now() - this.loadStartTime > 500
		) {
			// lol this is really dumb but kinda fun :)
			requestAnimationFrame(() => this.forceUpdate());

			const fakepuzzle = [];
			for (let i = 0; i < 81; i++) {
				fakepuzzle.push(Math.floor(Math.random() * 10) || null);
			}

			return [
				j([Header, {difficulty: difficulty, key: 1}]),
				j([Game, {puzzle: fakepuzzle, key: 2}]),
			];
		}

		if (page === PAGES.game) {
			return [
				j([Header, {
					goBack: this.goBack,
					difficulty: difficulty,
					key: 1,
				}]),
				j([Game, {
					puzzle,
					initialAnswers,
					initialNotes,
					initialTime,
					winGame: this.winGame,
					key: 2,
				}]),
			];
		}

		if (page === PAGES.results) {
			return [
				j([Header, {difficulty, goBack: this.goBack, key: 1}]),
				j([Results, {
					difficulty,
					score: score,
					requestPuzzle: this.requestPuzzle,
					goBack: this.goBack,
					key: 2,
				}]),
			];
		}

		if (page === PAGES.records) {
			return [
				j([Header, {goBack: this.goBack, key: 1}]),
				j([ComingSoon], "The records page is a work in progress"),
			];
		}

		if (page === PAGES.options) {
			return [
				j([Header, {goBack: this.goBack, key: 1}]),
				j([ComingSoon], "The options page is a work in progress"),
			];
		}

		return [
			j([Header, {key: 1}]),
			j([Menu, {
				requestPuzzle: this.requestPuzzle,
				resumePuzzle: this.resumePuzzle,
				openRecords: this.openRecords,
				openOptions: this.openOptions,
				key: 2,
			}]),
		];
	}
}

render(j(App), document.getElementById("react-root"));
