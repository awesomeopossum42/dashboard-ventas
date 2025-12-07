// server.js
// Servidor Node.js para el dashboard de visualización
// Autor: Isaac Rodríguez Marroquín

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Servir archivos estáticos (index.html, script.js, productos.json, etc.)
app.use(express.static(path.join(__dirname)));

// 2) Función para leer el archivo productos.json
function leerProductosBase() {
  return new Promise((resolve, reject) => {
    const ruta = path.join(__dirname, "productos.json");
    fs.readFile(ruta, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// 3) Simular cambios aleatorios realistas
function simularNuevosDatos(productos) {
  return productos.map((d) => {
    const factorVentas = 0.9 + Math.random() * 0.4;
    const factorPrecio = 0.95 + Math.random() * 0.1;

    const nuevasVentas = Math.round(d.ventas * factorVentas);
    const nuevoPrecio = Math.round(d.precio * factorPrecio);
    const nuevosIngresos = nuevasVentas * nuevoPrecio;

    return {
      ...d,
      ventas: nuevasVentas,
      precio: nuevoPrecio,
      ingresos: nuevosIngresos,
    };
  });
}

// 4) API dinámica
app.get("/api/productos", async (req, res) => {
  try {
    const productosBase = await leerProductosBase();
    const productosSimulados = simularNuevosDatos(productosBase);

    res.json({
      fuente: "productos.json",
      actualizado: new Date().toISOString(),
      datos: productosSimulados,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// 6) Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
