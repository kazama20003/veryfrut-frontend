import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veryfrut",
    short_name: "Veryfrut",
    description:
      "Plataforma Veryfrut para gestion de pedidos, productos y operaciones comerciales.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8CC63F",
    lang: "es-PE",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
