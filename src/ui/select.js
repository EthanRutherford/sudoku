const j = require("react-jenny");
const styles = require("../styles/select");

const selectedOption = `${styles.option} ${styles.selected}`;

module.exports = function Select({value, onChange, children: options}) {
	const values = value instanceof Array ? value : [value];
	const selected = options.filter((x) => values.includes(x.value));
	const display = selected.map((option) => option.display).join(", ");

	return j({div: styles.selectWrapper}, [
		j({input: {
			className: styles.selectInput,
			readOnly: true,
			value: display || "none",
		}}),
		j({div: styles.selectDropdown}, options.map((option) =>
			j({button: {
				className: selected.includes(option) ? selectedOption : styles.option,
				onMouseDown: () => onChange(option.value),
			}}, option.display),
		)),
	]);
};
