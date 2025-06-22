export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Handles image loading errors by providing a fallback
 * @param {Event} event - The error event from the image
 */
export const handleImageError = (event) => {
  const img = event.target;
  
  // Log the error
  console.warn(`Failed to load image: ${img.src}`);
  
  // Set a default placeholder image
  img.src = '/vite.svg'; // Using Vite's default SVG as a fallback
  
  // Add a CSS class to indicate it's a fallback
  img.classList.add('image-fallback');
  
  // Prevent further error events
  img.onerror = null;
};
