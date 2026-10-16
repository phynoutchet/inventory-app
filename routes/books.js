import { Router } from 'express'
import * as c from '../controllers/booksController.js'

const router = Router()

router.param('id', (req, res, next, id) => (/^\d+$/.test(id) ? next() : next('route')))

router.get('/', c.list)
router.get('/new', c.newForm) // must come before /:id
router.post('/new', c.create)
router.get('/:id', c.show)
router.get('/:id/edit', c.editForm)
router.post('/:id/edit', c.update)
router.post('/:id/delete', c.remove)

export default router