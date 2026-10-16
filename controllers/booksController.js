import { body, validationResult } from 'express-validator'
import * as db from '../db/queries.js'

const validateBook = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be 255 characters or fewer'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a number, 0 or more'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a whole number, 0 or more'),
  body('author_id').optional({ values: 'falsy' }).isInt().withMessage('Invalid author'),
]

// checkboxes arrive as undefined, a single string, or an array
function readBook(req) {
  return {
    title: req.body.title,
    price: req.body.price,
    quantity: req.body.quantity,
    author_id: req.body.author_id || null,
    genre_ids: [].concat(req.body.genre_ids ?? []).map(Number).filter(Number.isInteger),
  }
}

async function renderForm(res, { book, errors = [], action, heading, isEdit, status = 200 }) {
  const [authors, genres] = await Promise.all([db.getAllAuthors(), db.getAllGenres()])
  res.status(status).render('books/form', { title: heading, heading, action, isEdit, book, authors, genres, errors })
}

export async function list(req, res) {
  const books = await db.getAllBooks()
  res.render('books/list', { title: 'Books', books })
}

export async function show(req, res, next) {
  const book = await db.getBook(req.params.id)
  if (!book) return next()
  const genres = await db.getBookGenres(book.id)
  res.render('books/show', { title: book.title, book, genres })
}

export async function newForm(req, res) {
  const book = { title: '', price: '', quantity: 0, author_id: '', genre_ids: [] }
  await renderForm(res, { book, action: '/books/new', heading: 'Add a book', isEdit: false })
}

export const create = [
  ...validateBook,
  async (req, res) => {
    const book = readBook(req)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return renderForm(res, {
        book, errors: errors.array().map((e) => e.msg),
        action: '/books/new', heading: 'Add a book', isEdit: false, status: 422,
      })
    }
    const id = await db.insertBook(book)
    res.redirect(`/books/${id}`)
  },
]

export async function editForm(req, res, next) {
  const book = await db.getBook(req.params.id)
  if (!book) return next()
  book.genre_ids = (await db.getBookGenres(book.id)).map((g) => g.id)
  await renderForm(res, { book, action: `/books/${book.id}/edit`, heading: `Edit: ${book.title}`, isEdit: true })
}

export const update = [
  ...validateBook,
  async (req, res, next) => {
    const id = req.params.id
    const book = readBook(req)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return renderForm(res, {
        book, errors: errors.array().map((e) => e.msg),
        action: `/books/${id}/edit`, heading: 'Edit book', isEdit: true, status: 422,
      })
    }
    const updated = await db.updateBook(id, book)
    if (!updated) return next()
    res.redirect(`/books/${id}`)
  },
]

export async function remove(req, res) {
  await db.deleteBook(req.params.id)
  res.redirect('/books')
}