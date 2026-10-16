import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import booksRouter from './routes/books.js'
import authorsRouter from './routes/authors.js'
import genresRouter from './routes/genres.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => res.redirect('/books'))
app.use('/books', booksRouter)
app.use('/authors', authorsRouter)
app.use('/genres', genresRouter)

app.use((req, res) => {
  res.status(404).render('error', { title: 'Not found', status: 404, message: 'Page not found.' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).render('error', { title: 'Error', status: 500, message: 'Something went wrong.' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Inventory app running on http://localhost:${PORT}`))