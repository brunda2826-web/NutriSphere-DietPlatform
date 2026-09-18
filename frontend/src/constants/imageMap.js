// Centralized image resolver.
// Drop your real .webp/.png/.jpg files into src/assets/images/ using the
// filenames referenced in the backend (e.g. "almonds.webp", "fruits.webp").
// This uses import.meta.glob so the app keeps working even if some files
// are missing yet — it just falls back to whatever `fallback` you pass in.

const modules = import.meta.glob("../assets/images/*.{webp,png,jpg,jpeg,svg}", { eager: true });

export const imageMap = {};
for (const path in modules) {
  const filename = path.split("/").pop();
  imageMap[filename] = modules[path].default;
}

export const resolveImage = (imageName, fallback = null) => {
  if (!imageName) return fallback;
  return imageMap[imageName] || fallback;
};
