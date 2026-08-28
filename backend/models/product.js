import mongoose from 'mongoose';
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
  buyCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);