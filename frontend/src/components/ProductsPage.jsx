import react from 'react';
import Clothing from './Clothing';    
import Electronics from './Electronics';
import Fitness from './Fitness';
function ProductsPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Products</h2>
      <Clothing />
      <Electronics />
      <Fitness />
    </div>
  );
}
export default ProductsPage;