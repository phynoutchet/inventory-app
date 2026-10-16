// Usage: npm run populate
// WARNING: drops and recreates all tables, so it resets your data every time.
import pool from './pool.js'

const SCHEMA = `
DROP TABLE IF EXISTS book_genres, books, genres, authors CASCADE;

CREATE TABLE authors (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE genres (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE books (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(255) NOT NULL,
  price NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  author_id INTEGER REFERENCES authors(id) ON DELETE RESTRICT
);

CREATE TABLE book_genres (
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, genre_id)
);
`

const authors = [
  'Chinua Achebe',
  "Ngugi wa Thiong'o",
  'Chimamanda Ngozi Adichie',
  'George Orwell',
  'Frank Herbert',
  'Yuval Noah Harari',
]

const genres = ['Fiction', 'Non-fiction', 'Classics', 'Science Fiction', 'Historical Fiction', 'History']

const books = [
  { title: 'Things Fall Apart', author: 'Chinua Achebe', genres: ['Fiction', 'Classics'], price: 12.99, quantity: 8 },
  { title: 'Petals of Blood', author: "Ngugi wa Thiong'o", genres: ['Fiction', 'Classics'], price: 11.5, quantity: 5 },
  { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', genres: ['Fiction', 'Historical Fiction'], price: 14, quantity: 6 },
  { title: 'Nineteen Eighty-Four', author: 'George Orwell', genres: ['Fiction', 'Classics', 'Science Fiction'], price: 10.99, quantity: 12 },
  { title: 'Dune', author: 'Frank Herbert', genres: ['Fiction', 'Science Fiction'], price: 15.99, quantity: 7 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genres: ['Non-fiction', 'History'], price: 18.5, quantity: 4 },
]

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(SCHEMA)

    const authorIds = {}
    for (const name of authors) {
      const { rows } = await client.query('INSERT INTO authors (name) VALUES ($1) RETURNING id', [name])
      authorIds[name] = rows[0].id
    }

    const genreIds = {}
    for (const name of genres) {
      const { rows } = await client.query('INSERT INTO genres (name) VALUES ($1) RETURNING id', [name])
      genreIds[name] = rows[0].id
    }

    for (const b of books) {
      const { rows } = await client.query(
        'INSERT INTO books (title, price, quantity, author_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [b.title, b.price, b.quantity, authorIds[b.author]]
      )
      for (const g of b.genres) {
        await client.query('INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2)', [rows[0].id, genreIds[g]])
      }
    }

    await client.query('COMMIT')
    console.log('Database populated.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Populate failed:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()