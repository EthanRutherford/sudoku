const j = require("react-jenny");
const styles = require("../styles/header");

module.exports = function Header(props) {
	return j({div: styles.header}, j({div: styles.content}, [
		props.goBack && j({button: {
			className: styles.back,
			onClick: props.goBack,
		}}),
		j({span: styles.title}, [
			"Sudoku",
			props.difficulty && ` - ${props.difficulty}`,
		]),
	]));
};
