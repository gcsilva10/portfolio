export const cvPath = "/cv/CV.pdf";

const cvImageModules = import.meta.glob("../public/cv/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});

export const cvImagePaths = Object.keys(cvImageModules)
  .map((path) => path.replace("../public", ""))
  .sort((left, right) => left.localeCompare(right));
