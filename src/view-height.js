function setViewHeight() {
	const viewHeight = window.innerHeight;
	document.documentElement.style.setProperty(
		"--view-height",
		`${viewHeight}px`,
	);
}

window.addEventListener("resize", setViewHeight);
setViewHeight();
