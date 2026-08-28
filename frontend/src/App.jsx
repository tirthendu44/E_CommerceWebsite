import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./utils/store";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import LoginForm from "./components/LoginForm";
import RegistrationForm from "./components/RegistrationForm";
import ProductDetails from "./components/ProductDetails";
import OrderHistory from "./components/OrderHistory";
import OrderSummary from "./components/OrderSummary";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./components/AdminDashboard";
import ProductsPage from "./components/ProductsPage";
function App() {
  
  return (
    <Provider store={store}>
      <Router>
        <div className="App min-h-screen bg-gray-white">
          {/* Navbar always visible */}
          <Navbar />

          {/* Define routes */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/productDetails/:id" element={<ProductDetails />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orderSummary/:id" element={<OrderSummary />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/products" element={<ProductsPage />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;