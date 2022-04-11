require('dotenv').config()
const express = require('express')
const PORT = 4000

const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', './views')

app.get('/', (req, res) => {
	res.render('index')
})

app.get('/profile', (req, res) => {
	res.render('profile')
})

app.get('/scores', (req, res) => {
	res.render('scores')
})

app.use((req, res) => {
	res.status(404).render('error404')
})

app.listen(PORT, () => {
	console.log(`Application started on port: http://localhost:${PORT}`)
})
