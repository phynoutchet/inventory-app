import { body, validationResult } from 'express-validator'

const validateName = body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer')

// Shared CRUD logic for "name only" entities (authors, genres).
// db = { getAll, getOne, getBooks, insert, update, remove }
export function createSimpleController({ label, plural, basePath, db }) {
  const formView = (res, { item, errors = [], action, heading, isEdit, status = 200 }) =>
    res.status(status).render('simple/form', {
      title: heading, heading, action, isEdit, item, errors, label, basePath,
    })

  const duplicateMsg = `${label} "NAME" already exists`

  return {
    async list(req, res) {
      const items = await db.getAll()
      res.render('simple/list', { title: plural, label, plural, basePath, items })
    },

    async show(req, res, next) {
      const item = await db.getOne(req.params.id)
      if (!item) return next()
      const books = await db.getBooks(item.id)
      res.render('simple/show', { title: item.name, label, basePath, item, books })
    },

    newForm(req, res) {
      return formView(res, { item: { name: '' }, action: `${basePath}/new`, heading: `Add ${label.toLowerCase()}`, isEdit: false })
    },

    create: [
      validateName,
      async (req, res) => {
        const item = { name: req.body.name }
        const errors = validationResult(req)
        const form = { item, action: `${basePath}/new`, heading: `Add ${label.toLowerCase()}`, isEdit: false, status: 422 }
        if (!errors.isEmpty()) return formView(res, { ...form, errors: errors.array().map((e) => e.msg) })
        try {
          const id = await db.insert(item.name)
          res.redirect(`${basePath}/${id}`)
        } catch (err) {
          if (err.code === '23505') return formView(res, { ...form, errors: [duplicateMsg.replace('NAME', item.name)] })
          throw err
        }
      },
    ],

    async editForm(req, res, next) {
      const item = await db.getOne(req.params.id)
      if (!item) return next()
      return formView(res, { item, action: `${basePath}/${item.id}/edit`, heading: `Edit ${label.toLowerCase()}`, isEdit: true })
    },

    update: [
      validateName,
      async (req, res, next) => {
        const id = req.params.id
        const item = { id, name: req.body.name }
        const errors = validationResult(req)
        const form = { item, action: `${basePath}/${id}/edit`, heading: `Edit ${label.toLowerCase()}`, isEdit: true, status: 422 }
        if (!errors.isEmpty()) return formView(res, { ...form, errors: errors.array().map((e) => e.msg) })
        try {
          const updated = await db.update(id, item.name)
          if (!updated) return next()
          res.redirect(`${basePath}/${id}`)
        } catch (err) {
          if (err.code === '23505') return formView(res, { ...form, errors: [duplicateMsg.replace('NAME', item.name)] })
          throw err
        }
      },
    ],

    async remove(req, res) {
      try {
        await db.remove(req.params.id)
        res.redirect(basePath)
      } catch (err) {
        // 23503 = foreign key violation (author still has books)
        if (err.code === '23503') {
          return res.status(409).render('error', {
            title: 'Cannot delete',
            status: 409,
            message: `This ${label.toLowerCase()} still has books. Remove or reassign them first.`,
          })
        }
        throw err
      }
    },
  }
}