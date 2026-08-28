import React from "react"
import { useParams } from "react-router-dom"
import { useGetOrderByIdQuery } from "../utils/orderApi"

// Your schema tracks status per order, not per item, so there is exactly
// one address block and one progress tracker per order - not one per item,
// since there's no per-item tracking data to differentiate them.
const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"]

const STEP_INDEX = {
  pending: 0,
  paid: 1,
  shipped: 2,
  delivered: 3,
};

const maskEmail = (email) => {
  if (!email) return ""
  const [name, domain] = email.split("@")
  return `${name.slice(0, 1)}${"•".repeat(Math.max(name.length - 1, 3))}@${domain}`
}

function OrderSummary() {
  const { id } = useParams()
  const { data, isLoading, error } = useGetOrderByIdQuery(id)

  if (isLoading) return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-gray-500">Loading order...</p>
  if (error || !data) return <p className="mx-auto max-w-4xl px-4 py-12 text-sm text-red-500">Order not found.</p>

  const { order, address, email } = data
  const currentStep = order.status === "cancelled" ? null : STEP_INDEX[order.status] ?? 0
  const progressPercent = currentStep === null ? 0 : (currentStep / (STEPS.length - 1)) * 100

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            Order number <span className="font-medium text-gray-900">{order.orderId.slice(-10).toUpperCase()}</span>
            {" · "}
            {new Date(order.orderedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* Not wired up - no invoice generation exists on the backend yet */}
        <span className="text-sm font-medium text-gray-400" title="Invoice generation isn't implemented yet">
          View invoice &rarr;
        </span>
      </div>

      {/* One row per item - image, name, price, qty only. Everything shared
          across the whole order (address, shipping, progress) lives once,
          below this list, instead of being repeated per item. */}
      <ul role="list" className="divide-y divide-gray-200">
        {order.items.map((item, index) => (
          <li key={index} className="flex gap-6 py-8">
            <div className="size-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {item.image && (
                <img src={item.image} alt={item.name} className="size-full object-cover" />
              )}
            </div>
            <div>
              <h2 className="text-base font-medium text-gray-900">{item.name}</h2>
              <p className="mt-1 text-sm text-gray-900">${item.price.toFixed(2)}</p>
              <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-1 gap-6 border-t border-gray-200 pt-8 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Delivery address</h3>
          <address className="mt-2 text-sm not-italic text-gray-500">
            {address.firstName} {address.lastName}
            <br />
            {address.streetAddress}
            <br />
            {address.city}, {address.region} {address.postalCode}
          </address>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">Shipping updates</h3>
          <p className="mt-2 text-sm text-gray-500">{maskEmail(email)}</p>
        </div>
      </div>

      {order.status === "cancelled" ? (
        <p className="mt-8 text-sm font-medium text-red-600">Order cancelled</p>
      ) : (
        <div className="mt-8">
          <p className="text-sm font-medium text-gray-900">
            {STEPS[currentStep]} on{" "}
            {new Date(order.orderedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs sm:text-sm">
            {STEPS.map((step, stepIndex) => (
              <span
                key={step}
                className={
                  stepIndex <= currentStep
                    ? "font-medium text-indigo-600"
                    : "text-gray-500"
                }
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderSummary