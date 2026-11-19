import React, { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

function CategoryPage() {
  const { category } = useParams() // route: /category/:category
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const title = category ? category.charAt(0).toUpperCase() + category.slice(1) : ""

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")

    // Backend finds the products whose breadcrumbs include this category name
    fetch(`${import.meta.env.VITE_BACKEND_URL}/products/category/${encodeURIComponent(category)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.message || "Failed to load products")
        return data
      })
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load products")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [category])

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          &larr; Back to dashboard
        </Link>
        <h2 className="mt-3 text-2xl font-bold text-gray-800">{title}</h2>

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">Loading products...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">No products found in {title}.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
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
        )}
      </div>
    </div>
  )
}

export default CategoryPage