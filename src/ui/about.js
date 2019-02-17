const j = require("react-jenny");
const styles = require("../styles/about");

module.exports = function About() {
	return j({div: styles.about}, [
		j({h2: styles.title}, "Sudoku ver 1.4.5"),
		j({div: styles.separator}),
		j({div: styles.description}, [
			j("p", `
				This sudoku app creates puzzles ranked by how advanced the
				techniques required to complete them are. For example, easy puzzles
				will never require the use of pencil marks, while medium puzzles
				involve spotting ghosts and naked pairs.
			`),
			j("p", [
				`For anyone curious, all of the code is available on `,
				j({a: {href: "https://github.com/EthanRutherford/sudoku", target: "_blank"}}, "github"),
				`.`,
			]),
		]),
		j({h2: styles.title}, "Version changelog"),
		j({div: styles.separator}),
		j({div: styles.description}, `
			This app is hosted on github pages, so any time I push a change
			or bugfix, that code goes live immediately. As such, these version
			numbers are somewhat arbitrary. I bump the minor version any time
			a significant feature or improvement ships, but I won't bother keeping
			track of more than the most recent patch number. Each change is simply
			listed in reverse-chronological order.
		`),
		j({div: styles.number}, "ver 1.4.5"),
		j({div: styles.change}, `add undo and redo buttons`),
		j({div: styles.change}, `respect auto-check option for notes as well as values`),
		j({div: styles.change}, `prevent saving high scores when using auto-check`),
		j({div: styles.change}, `fix bug preventing naked pair detection`),
		j({div: styles.change}, `fix bug where easier puzzles can trickle into the wrong difficulty`),
		j({div: styles.number}, "ver 1.4.0"),
		j({div: styles.change}, `improve ranking of hard puzzles`),
		j({div: styles.change}, `optimize puzzle generation`),
		j({div: styles.change}, `start games with prefilled notes at 3 minutes`),
		j({div: styles.change}, `Improve some issues with timers`),
		j({div: styles.change}, `made improvements to keyboard shortcuts`),
		j({div: styles.change}, `fixed a bug with discarding ongoing game`),
		j({div: styles.change}, `implemented the about page and changelog`),
		j({div: styles.change}, `added refresh button when new version available`),
		j({div: styles.number}, "ver 1.3.0"),
		j({div: styles.change}, `improved ranking of medium puzzles`),
		j({div: styles.change}, `optimized puzzle generator`),
		j({div: styles.change}, `fixed a few display bugs and typos`),
		j({div: styles.change}, `implemented the "show timer" option`),
		j({div: styles.change}, `implemented records page`),
		j({div: styles.number}, "ver 1.2.0"),
		j({div: styles.change}, `implemented PWA, enabling offline play and save to homescreen`),
		j({div: styles.change}, `fixed a bug when refreshing on the results screen`),
		j({div: styles.change}, `migrated high scores to indexedDB`),
		j({div: styles.change}, `add warning when a user has an existing game`),
		j({div: styles.change}, `add hash routing to enable better navigation`),
		j({div: styles.number}, "ver 1.1.0"),
		j({div: styles.change}, `implemented options page`),
		j({div: styles.change}, `improved keyboard controls`),
		j({div: styles.change}, `added a custom font from google fonts`),
		j({div: styles.change}, `added "coming soon" about page`),
		j({div: styles.change}, `made various improvements to notes and guides`),
		j({div: styles.change}, `fixed a bug with displaying clear times`),
		j({div: styles.change}, `minor tweaks to difficulty ranking`),
		j({div: styles.change}, `fixed layout issues on mobile`),
		j({div: styles.number}, "ver 1.0.0"),
		j({div: styles.change},
			`Initial release: very simple difficulty ranking mechanism.
			Many pages and a few features were yet to be created.`,
		),
	]);
};
