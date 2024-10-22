const socket = io();

// Actualizar la lista de productos en tiempo real
socket.on('updateProducts', (products) => {
  const productList = document.getElementById('productList');
  productList.innerHTML = ''; // Limpiar la lista antes de agregar los nuevos productos

  // Verificar si hay productos disponibles
  if (products.length === 0) {
    const noProductsMessage = document.createElement('li');
    noProductsMessage.textContent = 'No hay productos disponibles.';
    productList.appendChild(noProductsMessage);
    return;
  }

  // Agregar cada producto a la lista
  products.forEach((product) => {
    // Verificar que el producto tenga un nombre y un precio definidos
    if (product.name && product.price !== undefined) {
      const li = document.createElement('li');
      li.textContent = `${product.name} - $${product.price}`;
      productList.appendChild(li);
    } else {
      console.error('Producto sin nombre o precio:', product); // Registrar en consola si hay datos faltantes
    }
  });
});

