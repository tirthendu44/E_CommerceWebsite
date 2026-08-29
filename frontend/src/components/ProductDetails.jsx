import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StarIcon } from '@heroicons/react/20/solid'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Loads the Razorpay checkout script once, reusing it on subsequent calls.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [buyNowMessage, setBuyNowMessage] = useState('')
  const [buyingNow, setBuyingNow] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchProduct() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/products/${id}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load product')
        }

        if (!cancelled) setProduct(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProduct()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleAddToCart = async (e) => {
    e.preventDefault()
    setCartMessage('')

    const token = localStorage.getItem('token')
    if (!token) {
      setCartMessage('Please sign in to add items to your cart.')
      navigate('/login')
      return
    }

    const formData = new FormData(e.target)
    const selectedColor = formData.get('color')
    const selectedSize = formData.get('size')

    setAdding(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images?.[0]?.src,
          color: selectedColor,
          size: selectedSize,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to cart')
      }

      setCartMessage('Added to your cart.')
    } catch (err) {
      setCartMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = async () => {
    setBuyNowMessage('')

    const token = localStorage.getItem('token')
    if (!token) {
      setBuyNowMessage('Please sign in to buy this item.')
      navigate('/login')
      return
    }

    const formData = new FormData(formRef.current)
    const selectedColor = formData.get('color')
    const selectedSize = formData.get('size')

    setBuyingNow(true)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Check your connection.')
      }

      // 1. Create a Razorpay order for just this product
      const orderRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: product.price }),
      })

      const orderData = await orderRes.json().catch(() => ({}))
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to start checkout')
      }

      // 2. Open Razorpay's checkout popup
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: product.name,
        description: `${selectedColor || ''} ${selectedSize || ''}`.trim(),
        image: product.images?.[0]?.src,
        order_id: orderData.orderId,
        handler: async (response) => {
          // 3. On successful payment, verify server-side and record the order
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/verify-buy-now`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.images?.[0]?.src,
              }),
            })

            const verifyData = await verifyRes.json().catch(() => ({}))
            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.message || 'Payment verification failed')
            }

            setBuyNowMessage('Payment successful! Your order has been placed.')
            navigate(`/orderSummary/${verifyData.orderId}`)
          } catch (err) {
            setBuyNowMessage(err.message || 'Payment verification failed. Please contact support.')
          } finally {
            setBuyingNow(false)
          }
        },
        modal: {
          ondismiss: () => {
            setBuyingNow(false)
          },
        },
        theme: { color: '#4f46e5' },
      }

      const razorpayCheckout = new window.Razorpay(options)
      razorpayCheckout.open()
    } catch (err) {
      setBuyNowMessage(err.message || 'Something went wrong. Please try again.')
      setBuyingNow(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-sm text-gray-500">Loading product...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!product) return null

  const reviews = product.reviews || { href: '#', average: 0, totalCount: 0 }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <nav aria-label="Breadcrumb">
          <ol role="list" className="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            {(product.breadcrumbs || []).map((breadcrumb) => (
              <li key={breadcrumb.id}>
                <div className="flex items-center">
                  <a href={breadcrumb.href} className="mr-2 text-sm font-medium text-gray-900">
                    {breadcrumb.name}
                  </a>
                  <svg
                    fill="currentColor"
                    width={16}
                    height={20}
                    viewBox="0 0 16 20"
                    aria-hidden="true"
                    className="h-5 w-4 text-gray-300"
                  >
                    <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                  </svg>
                </div>
              </li>
            ))}
            <li className="text-sm">
              <a href="#" aria-current="page" className="font-medium text-gray-500 hover:text-gray-600">
                {product.name}
              </a>
            </li>
          </ol>
        </nav>

        {/* Image gallery */}
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
          {(product.images || []).slice(0, 4).map((image, index) => (
            <img
              key={index}
              alt={image.alt}
              src={image.src}
              className={classNames(
                index === 0 && 'row-span-2 aspect-3/4 size-full rounded-lg object-cover max-lg:hidden',
                index === 1 && 'col-start-2 aspect-3/2 size-full rounded-lg object-cover max-lg:hidden',
                index === 2 && 'col-start-2 row-start-2 aspect-3/2 size-full rounded-lg object-cover max-lg:hidden',
                index === 3 && 'row-span-2 aspect-4/5 size-full object-cover sm:rounded-lg lg:aspect-3/4'
              )}
            />
          ))}
        </div>

        {/* Product info */}
        <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{product.name}</h1>
          </div>

          {/* Options */}
          <div className="mt-4 lg:row-span-3 lg:mt-0">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-gray-900">${product.price}</p>

            {/* Reviews */}
            <div className="mt-6">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <StarIcon
                      key={rating}
                      aria-hidden="true"
                      className={classNames(
                        reviews.average > rating ? 'text-gray-900' : 'text-gray-200',
                        'size-5 shrink-0',
                      )}
                    />
                  ))}
                </div>
                <p className="sr-only">{reviews.average} out of 5 stars</p>
                <a href={reviews.href} className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  {reviews.totalCount} reviews
                </a>
              </div>
            </div>

            <form ref={formRef} className="mt-10" onSubmit={handleAddToCart}>
              {/* Colors */}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Color</h3>

                <fieldset aria-label="Choose a color" className="mt-4">
                  <div className="flex items-center gap-x-3">
                    {(product.colors || []).map((color, index) => (
                      <div key={color.id} className="flex rounded-full outline -outline-offset-1 outline-black/10">
                        <input
                          defaultValue={color.id}
                          defaultChecked={index === 0}
                          name="color"
                          type="radio"
                          aria-label={color.name}
                          className={classNames(
                            color.classes,
                            'size-8 appearance-none rounded-full forced-color-adjust-none checked:outline-2 checked:outline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-3',
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Sizes */}
              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Size</h3>
                  <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Size guide
                  </a>
                </div>

                <fieldset aria-label="Choose a size" className="mt-4">
                  <div className="grid grid-cols-4 gap-3">
                    {(product.sizes || []).map((size, index) => (
                      <label
                        key={size.name}
                        aria-label={size.name}
                        className="group relative flex items-center justify-center rounded-md border border-gray-300 bg-white p-3 has-checked:border-indigo-600 has-checked:bg-indigo-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-600 has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25"
                      >
                        <input
                          defaultValue={size.name}
                          defaultChecked={index === 2}
                          name="size"
                          type="radio"
                          disabled={!size.inStock}
                          className="absolute inset-0 appearance-none focus:outline-none disabled:cursor-not-allowed"
                        />
                        <span className="text-sm font-medium text-gray-900 uppercase group-has-checked:text-white">
                          {size.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {cartMessage && (
                <p
                  className={`mt-4 text-sm ${
                    cartMessage === 'Added to your cart.' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {cartMessage}
                </p>
              )}

              {buyNowMessage && (
                <p
                  className={`mt-4 text-sm ${
                    buyNowMessage.startsWith('Payment successful') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {buyNowMessage}
                </p>
              )}

              <div className="mt-10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={buyingNow}
                  className="flex w-full items-center justify-center rounded-md border-2 border-indigo-600 bg-white px-8 py-3 text-base font-semibold text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
                >
                  {buyingNow ? 'Processing...' : 'Buy Now'}
                </button>

                <button
                  type="submit"
                  disabled={adding}
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </form>
          </div>

          <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
            {/* Description and details */}
            <div>
              <h3 className="sr-only">Description</h3>

              <div className="space-y-6">
                <p className="text-base text-gray-900">{product.description}</p>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-medium text-gray-900">Highlights</h3>

              <div className="mt-4">
                <ul role="list" className="list-disc space-y-2 pl-4 text-sm">
                  {(product.highlights || []).map((highlight) => (
                    <li key={highlight} className="text-gray-400">
                      <span className="text-gray-600">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-sm font-medium text-gray-900">Details</h2>

              <div className="mt-4 space-y-6">
                <p className="text-sm text-gray-600">{product.details}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProductDetails