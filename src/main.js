const {Component} = require("react");
const {render} = require("react-dom");
const j = require("react-jenny");
const requestPuzzle = require("./generator/request-puzzle");
const {storeDifficulty} = require("./logic/game-store");
const {saveHighScore} = require("./logic/high-scores");
const Header = require("./ui/header");
const Menu = require("./ui/menu");
const Game = require("./ui/game");
const Results = require("./ui/results");
const Options = require("./ui/options");
const ComingSoon = require("./ui/coming-soon");
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

		this.requestPuzzle = this.requestPuzzle.bind(this);
		this.resumePuzzle = this.resumePuzzle.bind(this);
		this.winGame = this.winGame.bind(this);
		this.openRecords = this.openRecords.bind(this);
		this.openOptions = this.openOptions.bind(this);
		this.openAbout = this.openAbout.bind(this);
		this.goBack = this.goBack.bind(this);
	}
	requestPuzzle(difficulty) {
		requestPuzzle(difficulty).then((puzzle) => this.setState({
			page: PAGES.game,
			difficulty,
			puzzle,
		}));

		storeDifficulty(difficulty);

		// show loading screen if we don't get a puzzle quick enough
		setTimeout(() => {
			if (this.state.page !== PAGES.game) {
				this.setState({page: PAGES.loading, difficulty});
			}
		}, 400);
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
			puzzle: null,
			initialAnswers: null,
			initialNotes: null,
			initialTime: null,
			score,
		});
	}
	openRecords() {
		this.setState({page: PAGES.records});
	}
	openOptions() {
		this.setState({page: PAGES.options});
	}
	openAbout() {
		this.setState({page: PAGES.about});
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
					goBack: this.goBack,
					difficulty: difficulty,
					key: 1,
				}]),
				j([Game, {
					difficulty,
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
				j([ComingSoon, {key: 2}], "The records page is coming soon."),
			];
		}

		if (page === PAGES.options) {
			return [
				j([Header, {goBack: this.goBack, key: 1}]),
				j([Options, {key: 2}]),
			];
		}

		if (page === PAGES.about) {
			return [
				j([Header, {goBack: this.goBack, key: 1}]),
				j([ComingSoon, {key: 2}], "The about page is coming soon."),
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
				key: 2,
			}]),
		];
	}
}

render(j(App), document.getElementById("react-root"));
