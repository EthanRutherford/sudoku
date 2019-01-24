const j = require("react-jenny");
const styles = require("../styles/header");

module.exports = function Header(props) {
	return j({div: styles.header}, j({div: styles.content}, [
		props.showBack && j({button: {
			className: styles.back,
			onClick: () => history.back(),
		}}),
		j({span: styles.title}, [
			"Sudoku",
			props.difficulty && ` - ${props.difficulty}`,
		]),
	]));
};
