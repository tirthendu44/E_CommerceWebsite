import React, { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { StarIcon } from "@heroicons/react/20/solid"

function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Same name -> same avatar color every time, without storing avatar images.
const AVATAR_COLORS = [
  "bg-red-400", "bg-yellow-500", "bg-green-500",
  "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500",
]
function avatarColor(name) {
  return AVATAR_COLORS[((name || "?").charCodeAt(0) || 0) % AVATAR_COLORS.length]
}
function initials(name) {
  if (!name) return "?"
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

function formatDate(value) {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

function Stars({ rating, size = "size-5" }) {
  return (
    <div className="flex items-center" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon
          key={i}
          aria-hidden="true"
          className={classNames(size, "shrink-0", rating > i ? "text-yellow-400" : "text-gray-200")}
        />
      ))}
    </div>
  )
}

function ReviewsPage() {
  const { productId } = useParams() // route: /reviews/:productId
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [starFilter, setStarFilter] = useState(null) // null = show everything

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    setStarFilter(null)

    fetch(`${import.meta.env.VITE_BACKEND_URL}/products/${productId}/reviews`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.message || "Failed to load reviews")
        return json
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load reviews")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  if (loading) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-sm text-gray-500">Loading reviews...</p>
  }
  if (error || !data) {
    return <p className="mx-auto max-w-5xl px-4 py-12 text-sm text-red-600">{error || "Reviews not found."}</p>
  }

  const { product } = data
  const reviews = data.reviews || []

  // Summary worked out from the reviews themselves
  const totalCount = reviews.length
  const average = totalCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount : 0
  const writtenCount = reviews.filter((r) => r.comment && r.comment.trim()).length
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    return { star, count, percent: totalCount ? Math.round((count / totalCount) * 100) : 0 }
  })
  const visible = starFilter ? reviews.filter((r) => r.rating === starFilter) : reviews

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Product header */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        {product?.image && (
          <img
            src={product.image}
            alt={product.alt || product.name}
            className="size-16 shrink-0 rounded-md bg-gray-100 object-cover"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ratings &amp; reviews</h1>
          {product?.name && <p className="mt-1 truncate text-sm text-gray-500">{product.name}</p>}
          <Link
            to={`/productDetails/${productId}`}
            className="mt-1 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            &larr; Back to product
          </Link>
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12">
        {/* Summary + clickable star breakdown */}
        <div className="lg:sticky lg:top-6 lg:col-span-4">
          {totalCount === 0 ? (
            <p className="text-sm text-gray-500">No ratings yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold tracking-tight text-gray-900">
                  {average.toFixed(1)}
                </span>
                <div className="pb-1">
                  <Stars rating={Math.round(average)} />
                  <p className="mt-1 text-sm text-gray-500">
                    {totalCount} rating{totalCount === 1 ? "" : "s"} &middot; {writtenCount} written review
                    {writtenCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                {breakdown.map(({ star, count, percent }) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarFilter(starFilter === star ? null : star)}
                    aria-pressed={starFilter === star}
                    title={`${count} rating${count === 1 ? "" : "s"}`}
                    className={classNames(
                      "flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-gray-50",
                      starFilter === star && "bg-indigo-50 hover:bg-indigo-50"
                    )}
                  >
                    <span className="w-3 font-medium text-gray-900">{star}</span>
                    <StarIcon aria-hidden="true" className="ml-1 size-4 shrink-0 text-yellow-400" />
                    <span className="ml-3 h-2 flex-1 rounded-full bg-gray-200">
                      <span
                        className="block h-2 rounded-full bg-yellow-400"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="ml-3 w-10 text-right text-gray-500">{percent}%</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 px-2 text-xs text-gray-400">Click a row to filter by that rating.</p>
            </>
          )}
        </div>

        {/* Everyone who rated / reviewed, with their username */}
        <div className="mt-10 lg:col-span-8 lg:mt-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {starFilter
                ? `${visible.length} of ${totalCount} - ${starFilter}-star`
                : `${totalCount} ${totalCount === 1 ? "person has" : "people have"} rated this`}
            </h2>
            {starFilter && (
              <button
                type="button"
                onClick={() => setStarFilter(null)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Clear filter
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              {totalCount === 0 ? "No reviews yet." : "No ratings match this filter."}
            </p>
          ) : (
            <ul role="list" className="mt-2 divide-y divide-gray-200">
              {visible.map((review, index) => (
                <li key={review._id || index} className="py-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={classNames(
                        avatarColor(review.username),
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                      )}
                    >
                      {initials(review.username)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {review.username || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} size="size-4" />
                        {formatDate(review.createdAt) && (
                          <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {review.comment && review.comment.trim() ? (
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{review.comment}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-gray-400">Rated without a written review.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewsPage