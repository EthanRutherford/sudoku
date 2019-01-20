const {Component} = require("react");
const j = require("react-jenny");
const {getStoredGame} = require("../logic/game-store");
const styles = require("../styles/menu");

const DIFFICULTIES = [
	"easy",
	"medium",
	"hard",
	"expert",
];

class Menu extends Component {
	constructor(...args) {
		super(...args);

		this.state = getStoredGame();
	}
	render() {
		return j({div: styles.menu}, [
			j({div: styles.columns}, [
				j({div: styles.column},
					DIFFICULTIES.map((difficulty) =>
						j({button: {
							className: styles.button,
							onClick: () => this.props.requestPuzzle(difficulty),
							key: difficulty,
						}}, difficulty),
					),
				),
				j({div: styles.column}, [
					j({button: {
						className: styles.button,
						onClick: () => this.props.resumePuzzle(
							this.state.difficulty,
							this.state.puzzle,
							this.state.answers,
							this.state.notes,
							this.state.time,
						),
						disabled: this.state.puzzle == null,
					}}, "resume"),
					j({button: {
						className: styles.button,
						onClick: this.props.openRecords,
					}}, "records"),
					j({button: {
						className: styles.button,
						onClick: this.props.openOptions,
					}}, "options"),
					j({button: {
						className: styles.button,
						onClick: this.props.openAbout,
					}}, "about"),
				]),
			]),
		]);
	}
}

module.exports = Menu;
