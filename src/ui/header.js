const {Component} = require("react");
const j = require("react-jenny");
const styles = require("../styles/header");

module.exports = class Header extends Component {
	render() {
		return j({div: styles.header}, j({div: styles.content}, [
			this.props.goBack && j({button: {
				className: styles.back,
				onClick: this.props.goBack,
			}}),
			j({span: styles.title}, [
				"Sudoku",
				this.props.difficulty && `: ${this.props.difficulty}`,
			]),
		]));
	}
};
