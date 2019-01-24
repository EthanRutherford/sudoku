const j = require("react-jenny");
const styles = require("../styles/warning");

module.exports = function Warning(props) {
	return j({div: {
		className: styles.warningOverlay,
		onClick: props.onCancel,
	}}, j({div: styles.warningPopup}, [
		j({h2: styles.warningHeader}, props.header),
		j({div: styles.warningContent}, props.content),
		j({div: 0}, [
			j({button: {
				className: styles.button,
				onClick: props.onConfirm,
			}}, props.confirm),
			j({button: {
				className: styles.button,
				onClick: props.onCancel,
			}}, props.cancel),
		]),
	]));
}
