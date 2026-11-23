const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const isValid = require('./auth_users.js').isValid;
const users = require('./auth_users.js').users;

const public_users = express.Router();
const BASE_URL = 'http://localhost:5000';

// Register a new user
public_users.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  users.push({ username, password });
  return res.status(201).json({ message: 'User successfully registered. You can now login.' });
});

// Get all books (Promise)
public_users.get('/', (req, res) => {
  new Promise((resolve) => resolve(books))
    .then((data) => res.status(200).json(data));
});

// Get book by ISBN (Promise)
public_users.get('/isbn/:isbn', (req, res) => {
  new Promise((resolve, reject) => {
    const book = books[req.params.isbn];
    book ? resolve(book) : reject('Book not found');
  })
    .then((book) => res.status(200).json(book))
    .catch((msg) => res.status(404).json({ message: msg }));
});

// Get books by author (async/await)
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = await Promise.resolve(
    Object.keys(books)
      .filter((isbn) => books[isbn].author.toLowerCase().includes(author))
      .reduce((acc, isbn) => { acc[isbn] = books[isbn]; return acc; }, {})
  );
  return res.status(200).json(result);
});

// Get books by title (async/await)
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = await Promise.resolve(
    Object.keys(books)
      .filter((isbn) => books[isbn].title.toLowerCase().includes(title))
      .reduce((acc, isbn) => { acc[isbn] = books[isbn]; return acc; }, {})
  );
  return res.status(200).json(result);
});

// Get reviews for a book
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found' });
  return res.status(200).json(book.reviews);
});

// ---------- Axios client functions ----------

// All books - Promise callbacks
const getAllBooks = () =>
  axios.get(`${BASE_URL}/`)
    .then((response) => response.data)
    .catch((err) => console.error('getAllBooks error:', err.message));

// By ISBN - Promise callbacks
const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((err) => console.error('getBookByISBN error:', err.message));

// By author - async/await
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (err) {
    console.error('getBooksByAuthor error:', err.message);
  }
};

// By title - async/await
const getBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (err) {
    console.error('getBooksByTitle error:', err.message);
  }
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
