import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

function authHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

const emptyForm = {
  name: '',
  price: '',
  description: '',
  details: '',
  imageSrc1: '',
  imageAlt1: '',
  imageSrc2: '',
  imageAlt2: '',
  imageSrc3: '',
  imageAlt3: '',
  imageSrc4: '',
  imageAlt4: '',
  breadcrumbs: [], // { id, name, href }
  colors: [], // { id, name, classes }
  sizes: [], // { name, inStock }
  highlightsText: '', // one highlight per line, joined/split on submit
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('products')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Portal</h1>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('products')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${
            tab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${
            tab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
          }`}
        >
          Orders
        </button>
      </div>

      {tab === 'products' ? <ProductsPanel /> : <OrdersPanel />}
    </div>
  )
}

function ProductsPanel() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/products`)
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  // ---- Dynamic list helpers (breadcrumbs / colors / sizes) ----
  // Each follows the same shape: add an empty row, update one field on one
  // row by index, or remove a row entirely.
  const addRow = (field, emptyRow) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], emptyRow] }))
  }

  const updateRow = (field, index, key, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }))
  }

  const removeRow = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  // Colors are just a flat list of name strings now (not id/name/classes
  // objects), so they get their own simpler handlers instead of reusing
  // the object-row helpers above.
  const addColor = () => setForm((prev) => ({ ...prev, colors: [...prev.colors, ''] }))
  const updateColor = (index, value) =>
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((c, i) => (i === index ? value : c)),
    }))
  const removeColor = (index) =>
    setForm((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }))

  const startEdit = (product) => {
    setEditingId(product._id)
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      description: product.description || '',
      details: product.details || '',
      imageSrc1: product.images?.[0]?.src || '',
      imageAlt1: product.images?.[0]?.alt || '',
      imageSrc2: product.images?.[1]?.src || '',
      imageAlt2: product.images?.[1]?.alt || '',
      imageSrc3: product.images?.[2]?.src || '',
      imageAlt3: product.images?.[2]?.alt || '',
      imageSrc4: product.images?.[3]?.src || '',
      imageAlt4: product.images?.[3]?.alt || '',
      breadcrumbs: (product.breadcrumbs || []).map((b) => ({
        id: b.id ?? '',
        name: b.name || '',
        href: b.href || '',
      })),
      colors: (product.colors || []).map((c) => c.name || ''),
      sizes: (product.sizes || []).map((s) => ({
        name: s.name || '',
        inStock: s.inStock ?? true,
      })),
      highlightsText: (product.highlights || []).join('\n'),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      details: form.details,
      images: [
        { src: form.imageSrc1, alt: form.imageAlt1 },
        { src: form.imageSrc2, alt: form.imageAlt2 },
        { src: form.imageSrc3, alt: form.imageAlt3 },
        { src: form.imageSrc4, alt: form.imageAlt4 },
      ]
        .filter((img) => img.src.trim() !== '')
        .map((img) => ({ src: img.src, alt: img.alt || form.name })),
      breadcrumbs: form.breadcrumbs
        .filter((b) => b.name.trim() !== '')
        .map((b) => ({ id: Number(b.id) || 0, name: b.name, href: b.href })),
      colors: form.colors
        .filter((name) => name.trim() !== '')
        .map((name) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, classes: '' })),
      sizes: form.sizes
        .filter((s) => s.name.trim() !== '')
        .map((s) => ({ name: s.name, inStock: !!s.inStock })),
      highlights: form.highlightsText
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
    }

    try {
      const url = editingId ? `${API}/admin/products/${editingId}` : `${API}/admin/products`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to save product')

      resetForm()
      loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    setError('')
    try {
      const res = await fetch(`${API}/admin/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to delete product')
      loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-6 mb-8 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingId ? 'Edit product' : 'Add a new product'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* ---- Images (unchanged - 4 fixed slots) ---- */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Images</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image URL 1 <span className="text-red-500">*</span>
              </label>
              <input
                name="imageSrc1"
                value={form.imageSrc1}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alt text 1</label>
              <input
                name="imageAlt1"
                value={form.imageAlt1}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL 2 (optional)</label>
              <input
                name="imageSrc2"
                value={form.imageSrc2}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alt text 2</label>
              <input
                name="imageAlt2"
                value={form.imageAlt2}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL 3 (optional)</label>
              <input
                name="imageSrc3"
                value={form.imageSrc3}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alt text 3</label>
              <input
                name="imageAlt3"
                value={form.imageAlt3}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL 4 (optional)</label>
              <input
                name="imageSrc4"
                value={form.imageSrc4}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alt text 4</label>
              <input
                name="imageAlt4"
                value={form.imageAlt4}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* ---- Breadcrumbs (dynamic rows) ---- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Breadcrumbs</h3>
            <button
              type="button"
              onClick={() => addRow('breadcrumbs', { id: form.breadcrumbs.length + 1, name: '', href: '' })}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add breadcrumb
            </button>
          </div>
          {form.breadcrumbs.length === 0 && (
            <p className="text-sm text-gray-400">No breadcrumbs added.</p>
          )}
          {form.breadcrumbs.map((b, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700">ID</label>
                <input
                  type="number"
                  value={b.id}
                  onChange={(e) => updateRow('breadcrumbs', i, 'id', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  value={b.name}
                  onChange={(e) => updateRow('breadcrumbs', i, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Href</label>
                <input
                  value={b.href}
                  onChange={(e) => updateRow('breadcrumbs', i, 'href', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow('breadcrumbs', i)}
                className="text-sm font-medium text-red-600 hover:text-red-500 pb-1.5"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* ---- Colors (one text box per color) ---- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Colors</h3>
            <button
              type="button"
              onClick={addColor}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add color
            </button>
          </div>
          {form.colors.length === 0 && <p className="text-sm text-gray-400">No colors added.</p>}
          {form.colors.map((color, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input
                value={color}
                onChange={(e) => updateColor(i, e.target.value)}
                placeholder="e.g. Black"
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="text-sm font-medium text-red-600 hover:text-red-500 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* ---- Sizes (dynamic rows) ---- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Sizes</h3>
            <button
              type="button"
              onClick={() => addRow('sizes', { name: '', inStock: true })}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add size
            </button>
          </div>
          {form.sizes.length === 0 && <p className="text-sm text-gray-400">No sizes added.</p>}
          {form.sizes.map((s, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  value={s.name}
                  onChange={(e) => updateRow('sizes', i, 'name', e.target.value)}
                  placeholder="e.g. Medium"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 pt-4">
                <input
                  type="checkbox"
                  checked={!!s.inStock}
                  onChange={(e) => updateRow('sizes', i, 'inStock', e.target.checked)}
                  className="rounded border-gray-300"
                />
                In stock
              </label>
              <button
                type="button"
                onClick={() => removeRow('sizes', i)}
                className="text-sm font-medium text-red-600 hover:text-red-500 pt-4"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* ---- Highlights (one per line) ---- */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Highlights (one per line)</label>
          <textarea
            value={form.highlightsText}
            onChange={(e) => setForm((prev) => ({ ...prev, highlightsText: e.target.value }))}
            rows={4}
            placeholder={'Hand cut and sewn locally\nDyed with a sustainable process'}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Details</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">All products</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">No products yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {products.map((product) => (
            <li key={product._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">${product.price}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(product)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrdersPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/admin/orders`, { headers: authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to load orders')
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleStatusChange = async (order, status) => {
    setUpdatingId(order.orderId)
    setError('')
    try {
      const res = await fetch(`${API}/admin/orders/${order.userId}/${order.orderId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to update order')
      loadOrders()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading orders...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (orders.length === 0) return <p className="text-sm text-gray-500">No orders yet.</p>

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-md">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Items</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Placed</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.orderId}>
              <td className="px-4 py-2">
                <div className="font-medium text-gray-900">{order.username}</div>
                <div className="text-gray-500">{order.email}</div>
              </td>
              <td className="px-4 py-2 text-gray-700">
                {order.items?.map((i) => `${i.name} x${i.quantity}`).join(', ')}
              </td>
              <td className="px-4 py-2 text-gray-700">${order.totalAmount}</td>
              <td className="px-4 py-2 text-gray-500">
                {new Date(order.orderedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <select
                  value={order.status}
                  disabled={updatingId === order.orderId}
                  onChange={(e) => handleStatusChange(order, e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}