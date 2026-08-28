import React from "react"
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import { XMarkIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline"
import {
  useGetCartQuery,
  useIncrementQuantityMutation,
  useDecrementQuantityMutation,
  useRemoveProductMutation,
  cartApi,
} from "../utils/cartApi"
import { useCreateOrderMutation, useVerifyPaymentMutation } from "../utils/paymentApi"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

// Loads the Razorpay Checkout script once and reuses it on later calls,
// rather than injecting a duplicate <script> tag every time Checkout is clicked.
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

function Cart({ open, onClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // skip: !open means RTK Query won't fire the request until the panel opens.
  // refetchOnMountOrArgChange: true forces a fresh fetch each time it opens,
  // instead of silently serving whatever was cached from the last time.
  const { data: products = [], isLoading, error } = useGetCartQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  })
  const [incrementQuantity] = useIncrementQuantityMutation()
  const [decrementQuantity] = useDecrementQuantityMutation()
  const [removeProduct] = useRemoveProductMutation()
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation()
  const [verifyPayment] = useVerifyPaymentMutation()

  const subtotal = products.reduce(
    (sum, p) => sum + parseFloat(p.price.replace("$", "")) * p.quantity,
    0
  )

  const handleCheckout = async () => {
    if (products.length === 0) return

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      alert("Unable to load payment gateway. Check your connection and try again.")
      return
    }

    try {
      const order = await createOrder(subtotal).unwrap()

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Your Store",
        description: "Cart checkout",
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap()

            if (result.verified) {
              // The backend already emptied cartItems - tell cartApi its
              // cached data is stale so getCart refetches and shows the
              // now-empty cart, rather than the products.length === 0 UI
              // waiting for the next unrelated cache refresh.
              dispatch(cartApi.util.invalidateTags(["Cart"]))
              navigate(`/orderSummary/${result.orderId}`) // or wherever you want to go after successful payment
              onClose()
            } else {
              alert("Payment could not be verified. Please contact support.")
            }
          } catch (err) {
            alert("Payment verification failed.")
          }
        },
        modal: {
          confirm_close: true,
        },
        theme: { color: "#4f46e5" },
      })

      razorpay.on("payment.failed", () => {
        alert("Payment failed. Please try again.")
      })

      razorpay.open()
    } catch (err) {
      alert("Could not start checkout. Please try again.")
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-lg font-medium text-gray-900">Shopping cart</DialogTitle>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        onClick={onClose}
                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                      >
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    {isLoading ? (
                      <p>Loading cart...</p>
                    ) : error ? (
                      <p className="text-red-500">Failed to load cart.</p>
                    ) : products.length === 0 ? (
                      <p>No items in cart.</p>
                    ) : (
                      <div className="flow-root">
                        <ul role="list" className="-my-6 divide-y divide-gray-200">
                          {products.map((product) => (
                            <li key={product.id} className="flex py-6">
                              <div className="size-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
                                <img
                                  alt={product.imageAlt}
                                  src={product.imageSrc}
                                  className="size-full object-cover"
                                />
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>
                                      <a href={product.href}>{product.name}</a>
                                    </h3>
                                    <p className="ml-4">{product.price}</p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">{product.color}</p>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => decrementQuantity(product.id)}
                                      className="flex size-6 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                                    >
                                      <MinusIcon className="size-3" />
                                      <span className="sr-only">Decrease quantity</span>
                                    </button>
                                    <p className="text-gray-500">Qty {product.quantity}</p>
                                    <button
                                      type="button"
                                      onClick={() => incrementQuantity(product.id)}
                                      className="flex size-6 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                                    >
                                      <PlusIcon className="size-3" />
                                      <span className="sr-only">Increase quantity</span>
                                    </button>
                                  </div>
                                  <div className="flex">
                                    <button
                                      type="button"
                                      onClick={() => removeProduct(product.id)}
                                      className="font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Subtotal</p>
                    <p>${subtotal.toFixed(2)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={isCreatingOrder || products.length === 0}
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreatingOrder ? "Starting checkout..." : "Checkout"}
                    </button>
                  </div>
                  <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                    <p>
                      or{" "}
                      <button
                        type="button"
                        onClick={onClose}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Continue Shopping
                        <span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default Cart