import React from "react"
import { Link } from "react-router-dom"
import { useGetOrdersQuery } from "../utils/orderApi"
import { useAddToCartMutation } from "../utils/cartApi"

// order.status is per-order (pending/paid/shipped/delivered/cancelled), not
// per-item, since that's what the User schema tracks - so every item in an
// order shares the same badge rather than each having its own delivery date.
const STATUS_LABEL = {
  pending: "Payment pending",
  paid: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const STATUS_DOT = {
  pending: "bg-gray-400",
  paid: "bg-blue-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
}

function OrderHistory() {
  const { data: orders = [], isLoading, error } = useGetOrdersQuery()
  const [addToCart, { isLoading: isReordering }] = useAddToCartMutation()

  const handleBuyAgain = (item) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      color: item.color,
      size: item.size,
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order history</h1>
        <p className="mt-2 text-sm text-gray-500">
          Check the status of recent orders, manage returns, and discover similar products.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading your orders...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load order history.</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't placed any orders yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-gray-900">Order number</dt>
                    <dd className="mt-0.5 text-gray-500">{order.orderId.slice(-10).toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Date placed</dt>
                    <dd className="mt-0.5 text-gray-500">
                      {new Date(order.orderedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Total amount</dt>
                    <dd className="mt-0.5 text-gray-500">${order.totalAmount.toFixed(2)}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Link
                    to={`/orderSummary/${order.orderId}`}
                    className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Order
                  </Link>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block size-2 rounded-full ${STATUS_DOT[order.status]}`} />
                    <span className="font-medium text-gray-900">{STATUS_LABEL[order.status]}</span>
                  </span>
                </div>
              </div>

              <ul role="list" className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <li key={`${order.orderId}-${index}`} className="flex px-4 py-6 sm:px-6">
                    {/* CHANGED: photo is now a link to the product (mobile relies on this
                        since "View product" text is hidden below sm) */}
                    {item.productId ? (
                      <Link
                        to={`/productDetails/${item.productId}`}
                        className="size-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
                      >
                        {item.image && (
                          <img alt={item.name} src={item.image} className="size-full object-cover" />
                        )}
                      </Link>
                    ) : (
                      <div className="size-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {item.image && (
                          <img alt={item.name} src={item.image} className="size-full object-cover" />
                        )}
                      </div>
                    )}

                    <div className="ml-4 flex flex-1 flex-col">
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">${item.price.toFixed(2)}</p>
                      </div>

                      {/* CHANGED: color swatch + size, shown under the name/price row */}
                      {(item.color || item.size) && (
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          {item.color && (
                            <span className="flex items-center gap-1.5">
                              
                              {item.color}
                            </span>
                          )}
                          {item.size && <span className="uppercase">{item.size}</span>}
                        </div>
                      )}

                      <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>

                      <div className="mt-4 flex flex-1 items-end justify-between text-sm">
                        <span className="text-gray-500">
                          {STATUS_LABEL[order.status]}
                        </span>
                        <div className="flex gap-4">
                          {/* CHANGED: hidden below sm - the photo link covers this on mobile */}
                          {item.productId && (
                            <Link
                              to={`/productDetails/${item.productId}`}
                              className="hidden font-medium text-indigo-600 hover:text-indigo-500 sm:inline-block"
                            >
                              View product
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleBuyAgain(item)}
                            disabled={isReordering}
                            className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                          >
                            Add to cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderHistory