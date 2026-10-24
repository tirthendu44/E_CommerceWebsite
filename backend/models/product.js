import mongoose from 'mongoose';

// A single customer review. `username` is stored directly on the review
// (not just looked up via userId) so it still displays even if the user
// later changes their name or deletes their account.
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true } // adds createdAt / updatedAt to each review
);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  breadcrumbs: [{ id: Number, name: String, href: String }],
  images: [{ src: String, alt: String }],
  colors: [{ id: String, name: String, classes: String }],
  sizes: [{ name: String, inStock: Boolean }],
  description: String,
  highlights: [String],
  details: String,
  reviews: {
    average: Number,
    totalCount: Number
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  userReviews: [reviewSchema],
  buyCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);