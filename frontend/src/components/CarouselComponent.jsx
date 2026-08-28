import React, { useState, useEffect } from "react";
import clothingImg from "../assets/clothing.png";
import electronicsImg from "../assets/electronics.png";
import fitnessImg from "../assets/fitness.png";
import arrow from "../assets/carouselArrow.svg";

const images = [
  { src: clothingImg, alt: "Clothing" },
  { src: electronicsImg, alt: "Electronics" },
  { src: fitnessImg, alt: "Fitness" },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000); // change slide every 4 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, [current]); // re-run when current changes

  return (
    <div className="relative w-full h-[68vh] overflow-hidden">
      {/* Slides wrapper */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, index) => (
          <div key={index} className="w-full flex-shrink-0 relative">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-[68vh] object-cover"
            />
            <div className="absolute bottom-10 left-10 bg-black/50 text-white p-4 rounded">
              <h2 className="text-2xl font-bold">{img.alt}</h2>
              <p>
                {img.alt === "Electronics"
                  ? "Discover the latest gadgets and devices."
                  : `Shop the latest ${img.alt.toLowerCase()} styles.`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-5 -translate-y-1/2 rounded-full flex items-center justify-center w-12 h-12"
      >
        <img
          src={arrow}
          alt="Previous"
          className="w-full h-full invert scale-x-[-1] transition-transform duration-200 hover:scale-x-[-1] hover:scale-110"
        />
      </button>

      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-5 -translate-y-1/2 rounded-full flex items-center justify-center w-12 h-12"
      >
        <img
          src={arrow}
          alt="Next"
          className="w-full h-full invert transition-transform duration-200 hover:scale-110"
        />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${
              index === current ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
