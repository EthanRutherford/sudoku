const j = require("react-jenny");
const styles = require("../styles/coming-soon");

module.exports = function ComingSoon(props) {
	return j({div: styles.page}, [
		j({h2: styles.title}, "Coming Soon"),
		j({div: 0}, props.children),
	]);
};
