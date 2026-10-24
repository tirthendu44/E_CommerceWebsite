import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { StarIcon } from "@heroicons/react/20/solid"

function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"]

function RateAndReview() {
  const { productId } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Fetch the product just so we can show its name and image at the top.
  // If this fails the form still works, it just shows no product header.
  useEffect(() => {
    let cancelled = false

    fetch(`${import.meta.env.VITE_BACKEND_URL}/products/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setProduct(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (rating === 0) {
      setError("Please select a star rating.")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/products/${productId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, comment }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        navigate("/login")
        return
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Thanks for your review!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your rating and review have been saved to {product?.name || "this product"}.
        </p>
        <div className="mt-8 flex justify-center gap-4 text-sm font-medium">
          <Link
            to={`/productDetails/${productId}`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
          >
            View product
          </Link>
          <Link
            to="/orders"
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const activeRating = hovered || rating

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rate and review</h1>

      {product && (
        <div className="mt-6 flex items-center gap-4 rounded-lg border border-gray-200 p-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {product.images?.[0]?.src && (
              <img
                src={product.images[0].src}
                alt={product.images[0].alt || product.name}
                className="size-full object-cover"
              />
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{product.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <p className="text-sm font-medium text-gray-900">Your rating</p>
          <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                aria-pressed={rating === value}
                className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <StarIcon
                  aria-hidden="true"
                  className={classNames(
                    activeRating >= value ? "text-yellow-400" : "text-gray-300",
                    "size-10 transition-colors"
                  )}
                />
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-500">{RATING_LABELS[activeRating]}</span>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-900">
            Your review <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="comment"
            rows={5}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike? How was the fit and quality?"
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default RateAndReview