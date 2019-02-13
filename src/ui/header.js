const {Component} = require("react");
const j = require("react-jenny");
const UpdateIcon = require("../../images/update");
const {getOptions} = require("../logic/options");
const {listenForUpdates} = require("../pwa/listen-for-updates");
const {watchTimer, prettifyTime} = require("./util");
const styles = require("../styles/header");

class Timer extends Component {
	constructor(...args) {
		super(...args);

		this.state = {time: 0};

		this.updateTime = this.updateTime.bind(this);
	}
	componentDidMount() {
		watchTimer(this.updateTime);
	}
	componentWillUnmount() {
		watchTimer(null);
	}
	updateTime(time) {
		if (Math.floor(time / 1000) > Math.floor(this.state.time / 1000)) {
			this.setState({time});
		}
	}
	render() {
		if (this.state.time === Infinity) {
			return "N/A";
		}

		return prettifyTime(this.state.time);
	}
}

class NeedsUpdate extends Component {
	constructor(...args) {
		super(...args);

		this.state = {showButton: false};

		listenForUpdates(() => this.setState({showButton: true}));
	}
	render() {
		return this.state.showButton && j({button: {
			className: styles.update,
			onClick: () => location.reload(),
			title: "click to install new version",
		}}, j([UpdateIcon]));
	}
}

module.exports = function Header(props) {
	const showTimer = props.showTimer && getOptions().timer;
	const titleParts = ["Sudoku"];
	if (showTimer) {
		titleParts[0] = `${props.difficulty} - `;
		titleParts.push(j([Timer]));
	} else if (props.difficulty) {
		titleParts.push(` - ${props.difficulty}`);
	}

	return j({div: styles.header}, j({div: styles.content}, [
		props.showBack && j({button: {
			className: styles.back,
			onClick: () => history.back(),
		}}),
		j({span: styles.title}, titleParts),
		j([NeedsUpdate]),
	]));
};
