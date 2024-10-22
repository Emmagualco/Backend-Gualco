const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const PRODUCTS_FILE = './data/products.json';

// Obtener todos los productos con ?limit opcional
router.get('/', async (req, res) => {
  const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const limit = req.query.limit;
  res.json(limit ? products.slice(0, limit) : products);
});

// Obtener producto por ID
router.get('/:pid', async (req, res) => {
  const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const product = products.find(p => p.id == req.params.pid);
  product ? res.json(product) : res.status(404).send('Producto no encontrado');
});

// Crear un nuevo producto
router.post('/', async (req, res) => {
  const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const newProduct = { id: Date.now(), status: true, ...req.body };
  products.push(newProduct);
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products));
  res.status(201).json(newProduct);
});

// Actualizar un producto
router.put('/:pid', async (req, res) => {
  let products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const index = products.findIndex(p => p.id == req.params.pid);
  if (index === -1) return res.status(404).send('Producto no encontrado');
  products[index] = { ...products[index], ...req.body };
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products));
  res.json(products[index]);
});

// Eliminar un producto
router.delete('/:pid', async (req, res) => {
  let products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  products = products.filter(p => p.id != req.params.pid);
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products));
  res.status(204).send();
});

module.exports = router;
