import * as q from '../db/queries.js'
import { createSimpleRouter } from './simpleRouter.js'

export default createSimpleRouter({
  label: 'Genre',
  plural: 'Genres',
  basePath: '/genres',
  db: {
    getAll: q.getAllGenres,
    getOne: q.getGenre,
    getBooks: q.getBooksByGenre,
    insert: q.insertGenre,
    update: q.updateGenre,
    remove: q.deleteGenre,
  },
})