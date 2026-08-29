import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
 
    fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/buy-again`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => setProducts(Array.isArray(data.products) ? data.products : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Buy Again</h3>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product._id} className="group relative">
            <img
              alt={product.images?.[0]?.alt || product.name}
              src={product.images?.[0]?.src}
              className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:h-80"
            />
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-sm text-gray-700">
                  <Link to={`/productDetails/${product._id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
                {product.colors?.[0]?.name && (
                  <p className="mt-1 text-sm text-gray-500">{product.colors[0].name}</p>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900">${product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;