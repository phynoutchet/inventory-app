import * as q from '../db/queries.js'
import { createSimpleRouter } from './simpleRouter.js'

export default createSimpleRouter({
  label: 'Author',
  plural: 'Authors',
  basePath: '/authors',
  db: {
    getAll: q.getAllAuthors,
    getOne: q.getAuthor,
    getBooks: q.getBooksByAuthor,
    insert: q.insertAuthor,
    update: q.updateAuthor,
    remove: q.deleteAuthor,
  },
})
