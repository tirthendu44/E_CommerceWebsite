import React, { useState, useEffect, useRef } from "react";
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

  // Swipe tracking (mobile touch)
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);

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

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const SWIPE_THRESHOLD = 50; // px
    if (touchDeltaXRef.current <= -SWIPE_THRESHOLD) {
      nextSlide(); // swiped left
    } else if (touchDeltaXRef.current >= SWIPE_THRESHOLD) {
      prevSlide(); // swiped right
    }
    touchDeltaXRef.current = 0;
  };

  return (
    // CHANGED: fixed h-[68vh] -> responsive height, shorter on small screens
    <div
      className="relative w-full h-[40vh] sm:h-[55vh] lg:h-[68vh] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides wrapper */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* CHANGED: fixed bottom-10 left-10 p-4 text-2xl -> responsive sizing/positioning for mobile */}
            <div className="absolute bottom-4 left-4 sm:bottom-10 sm:left-10 bg-black/50 text-white p-2 sm:p-4 rounded max-w-[80%] sm:max-w-none">
              <h2 className="text-base sm:text-2xl font-bold">{img.alt}</h2>
              <p className="text-xs sm:text-base">
                {img.alt === "Electronics"
                  ? "Discover the latest gadgets and devices."
                  : `Shop the latest ${img.alt.toLowerCase()} styles.`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {/* CHANGED: fixed w-12 h-12 left-5/right-5 -> smaller buttons, closer to edge on mobile */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute top-1/2 left-2 sm:left-5 -translate-y-1/2 rounded-full flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12"
      >
        <img
          src={arrow}
          alt="Previous"
          className="w-full h-full invert scale-x-[-1] transition-transform duration-200 hover:scale-x-[-1] hover:scale-110"
        />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute top-1/2 right-2 sm:right-5 -translate-y-1/2 rounded-full flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12"
      >
        <img
          src={arrow}
          alt="Next"
          className="w-full h-full invert transition-transform duration-200 hover:scale-110"
        />
      </button>

      {/* Indicators */}
      {/* CHANGED: bottom-5 -> bottom-3 sm:bottom-5, w-3 h-3 -> w-2 h-2 sm:w-3 sm:h-3 (smaller dots on mobile) */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              index === current ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}