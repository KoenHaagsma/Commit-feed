const home = document.querySelector('nav ul li:first-of-type a')
const trophy = document.querySelector('nav ul li:nth-of-type(2) a')
const profile = document.querySelector('nav ul li:last-of-type a')

if (window.location.pathname == '/') {
	home.classList.add('active1')
} else if (window.location.pathname == '/score') {
	trophy.classList.add('active2')
}
