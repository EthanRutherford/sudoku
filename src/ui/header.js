const {Component} = require("react");
const j = require("react-jenny");
const {getOptions} = require("../logic/options");
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
		return prettifyTime(this.state.time);
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
	]));
};
