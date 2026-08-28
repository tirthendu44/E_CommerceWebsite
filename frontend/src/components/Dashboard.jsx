import React from "react";
import Trending from "./Trending";
import ProductList from "./ProductList";
import CarouselComponent from "./CarouselComponent";
import BuyAgain from "./BuyAgain";

function Dashboard() {
  const isSignedIn = !!localStorage.getItem("token");

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>

      <CarouselComponent/>
      <Trending />
      {isSignedIn && <BuyAgain />}
      

    </div>
  );
}

export default Dashboard;