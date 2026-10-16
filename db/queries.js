import pool from './pool.js'

async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ---------- BOOKS ----------
export async function getAllBooks() {
  const { rows } = await pool.query(`
    SELECT b.id, b.title, b.price, b.quantity, a.name AS author
    FROM books b
    LEFT JOIN authors a ON a.id = b.author_id
    ORDER BY b.title`)
  return rows
}

export async function getBook(id) {
  const { rows } = await pool.query(
    `SELECT b.*, a.name AS author
     FROM books b
     LEFT JOIN authors a ON a.id = b.author_id
     WHERE b.id = $1`,
    [id]
  )
  return rows[0]
}

export async function getBookGenres(bookId) {
  const { rows } = await pool.query(
    `SELECT g.id, g.name
     FROM genres g
     JOIN book_genres bg ON bg.genre_id = g.id
     WHERE bg.book_id = $1
     ORDER BY g.name`,
    [bookId]
  )
  return rows
}

async function setBookGenres(client, bookId, genreIds) {
  await client.query('DELETE FROM book_genres WHERE book_id = $1', [bookId])
  if (genreIds.length) {
    await client.query(
      'INSERT INTO book_genres (book_id, genre_id) SELECT $1, unnest($2::int[])',
      [bookId, genreIds]
    )
  }
}

export async function insertBook({ title, price, quantity, author_id, genre_ids }) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO books (title, price, quantity, author_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [title, price, quantity, author_id]
    )
    await setBookGenres(client, rows[0].id, genre_ids)
    return rows[0].id
  })
}

export async function updateBook(id, { title, price, quantity, author_id, genre_ids }) {
  return withTransaction(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE books SET title = $1, price = $2, quantity = $3, author_id = $4
       WHERE id = $5`,
      [title, price, quantity, author_id, id]
    )
    if (rowCount) await setBookGenres(client, id, genre_ids)
    return rowCount
  })
}

export async function deleteBook(id) {
  await pool.query('DELETE FROM books WHERE id = $1', [id])
}

// ---------- AUTHORS ----------
export async function getAllAuthors() {
  const { rows } = await pool.query('SELECT id, name FROM authors ORDER BY name')
  return rows
}

export async function getAuthor(id) {
  const { rows } = await pool.query('SELECT id, name FROM authors WHERE id = $1', [id])
  return rows[0]
}

export async function getBooksByAuthor(authorId) {
  const { rows } = await pool.query(
    'SELECT id, title, price, quantity FROM books WHERE author_id = $1 ORDER BY title',
    [authorId]
  )
  return rows
}

export async function insertAuthor(name) {
  const { rows } = await pool.query('INSERT INTO authors (name) VALUES ($1) RETURNING id', [name])
  return rows[0].id
}

export async function updateAuthor(id, name) {
  const { rowCount } = await pool.query('UPDATE authors SET name = $1 WHERE id = $2', [name, id])
  return rowCount
}

// Throws a foreign-key error (23503) if the author still has books
export async function deleteAuthor(id) {
  await pool.query('DELETE FROM authors WHERE id = $1', [id])
}

// ---------- GENRES ----------
export async function getAllGenres() {
  const { rows } = await pool.query('SELECT id, name FROM genres ORDER BY name')
  return rows
}

export async function getGenre(id) {
  const { rows } = await pool.query('SELECT id, name FROM genres WHERE id = $1', [id])
  return rows[0]
}

export async function getBooksByGenre(genreId) {
  const { rows } = await pool.query(
    `SELECT b.id, b.title, b.price, b.quantity
     FROM books b
     JOIN book_genres bg ON bg.book_id = b.id
     WHERE bg.genre_id = $1
     ORDER BY b.title`,
    [genreId]
  )
  return rows
}

export async function insertGenre(name) {
  const { rows } = await pool.query('INSERT INTO genres (name) VALUES ($1) RETURNING id', [name])
  return rows[0].id
}

export async function updateGenre(id, name) {
  const { rowCount } = await pool.query('UPDATE genres SET name = $1 WHERE id = $2', [name, id])
  return rowCount
}

// Cascades to book_genres: books stay, they just lose this genre
export async function deleteGenre(id) {
  await pool.query('DELETE FROM genres WHERE id = $1', [id])
}