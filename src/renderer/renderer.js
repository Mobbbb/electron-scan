document.addEventListener('keydown', function(event) {
	if (event.key === 'F12') {
		window.call.openDevTools()
	}
})

const closeButton = document.querySelector('.close-wrap')

closeButton.onclick = () => {
	window.call.quit()
}
