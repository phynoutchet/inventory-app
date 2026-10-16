import { Router } from 'express'
import { createSimpleController } from '../controllers/simpleController.js'

export function createSimpleRouter(config) {
  const c = createSimpleController(config)
  const router = Router()

  router.param('id', (req, res, next, id) => (/^\d+$/.test(id) ? next() : next('route')))

  router.get('/', c.list)
  router.get('/new', c.newForm)
  router.post('/new', c.create)
  router.get('/:id', c.show)
  router.get('/:id/edit', c.editForm)
  router.post('/:id/edit', c.update)
  router.post('/:id/delete', c.remove)

  return router
}