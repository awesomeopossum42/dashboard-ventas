// Cargar Google Charts y ejecutar init cuando esté lista
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(init);

function init() {
  const btn = document.getElementById("btn-actualizar");
  btn.addEventListener("click", actualizarTodo);

  // Primera carga al abrir la página
  actualizarTodo();

  // 🔄 Actualización automática cada 5 segundos (5000 ms)
  setInterval(actualizarTodo, 5000);
}

// -----------------------------
// 1. Cargar datos desde productos.json
// -----------------------------
async function cargarDatos() {
  const res = await fetch("productos.json");
  if (!res.ok) {
    console.error("No se pudo cargar productos.json");
    return [];
  }
  const datos = await res.json();
  return datos;
}

// -----------------------------
// 2. Función central: actualizar ambos gráficos
// -----------------------------
async function actualizarTodo() {
  const productosBase = await cargarDatos();
  if (!productosBase.length) {
    console.warn("No hay datos para mostrar.");
    return;
  }

  // Simulamos cambios aleatorios
  const productosSimulados = simularNuevosDatos(productosBase);

  dibujarGoogleChart(productosSimulados);
  dibujarGraficoD3(productosSimulados);
}

// -----------------------------
// 2.1 Simular cambios aleatorios realistas en ventas, precio e ingresos
// -----------------------------
function simularNuevosDatos(productos) {
  return productos.map((d) => {
    const factorVentas = 0.9 + Math.random() * 0.4; // ±20%
    const factorPrecio = 0.95 + Math.random() * 0.1; // ±5%

    const nuevasVentas = Math.round(d.ventas * factorVentas);
    const nuevoPrecio = Math.round(d.precio * factorPrecio);
    const nuevosIngresos = nuevasVentas * nuevoPrecio;

    return {
      ...d,
      ventas: nuevasVentas,
      precio: nuevoPrecio,
      ingresos: nuevosIngresos
    };
  });
}

// -----------------------------
// 3. GOOGLE CHARTS: gráfico de columnas
// -----------------------------
function dibujarGoogleChart(productos) {
  const meses = [...new Set(productos.map((d) => d.mes))];
  const productosUnicos = [...new Set(productos.map((d) => d.producto))];

  const data = new google.visualization.DataTable();
  data.addColumn("string", "Mes");

  productosUnicos.forEach((prod) => {
    data.addColumn("number", prod);
  });

  meses.forEach((mes) => {
    const fila = [mes];
    productosUnicos.forEach((prod) => {
      const registro = productos.find(
        (d) => d.mes === mes && d.producto === prod
      );
      fila.push(registro ? registro.ventas : 0);
    });
    data.addRow(fila);
  });

  const options = {
    title: "Ventas mensuales por producto (Google Charts)",
    legend: { position: "top" },
    hAxis: { title: "Mes" },
    vAxis: { title: "Ventas" },
    bar: { groupWidth: "60%" }
  };

  const contenedor = document.getElementById("google-chart-container");
  const chart = new google.visualization.ColumnChart(contenedor);
  chart.draw(data, options);
}

// -----------------------------
// 4. D3.js: gráfico de burbujas multidimensional
// -----------------------------
function dibujarGraficoD3(productos) {
  const contenedor = d3.select("#d3-chart-container");

  // Limpiar cualquier gráfico previo
  contenedor.selectAll("*").remove();

  const width = 600;
  const height = 350;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };

  const svg = contenedor
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3
    .scaleLinear()
    .domain([
      d3.min(productos, (d) => d.precio) - 20,
      d3.max(productos, (d) => d.precio) + 20
    ])
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(productos, (d) => d.ventas) + 20])
    .range([innerHeight, 0]);

  const r = d3
    .scaleSqrt()
    .domain([0, d3.max(productos, (d) => d.ingresos)])
    .range([5, 35]);

  const productosUnicos = [...new Set(productos.map((d) => d.producto))];
  const color = d3.scaleOrdinal()
    .domain(productosUnicos)
    .range(d3.schemeTableau10);

  // Ejes
  g.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  // Etiquetas
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .attr("text-anchor", "middle")
    .text("Precio");

  g.append("text")
    .attr("x", -innerHeight / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Ventas");

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Relación Precio - Ventas - Ingresos (D3.js)");

  // Tooltip
  const tooltip = contenedor
    .append("div")
    .attr("class", "tooltip");

  // Burbujas
  const bubbles = g
    .selectAll("circle")
    .data(productos, (d) => d.producto + "-" + d.mes);

  bubbles
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.precio))
    .attr("cy", (d) => y(d.ventas))
    .attr("r", 0)
    .attr("fill", (d) => color(d.producto))
    .attr("opacity", 0.8)
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.producto}</strong><br/>
           Mes: ${d.mes}<br/>
           Precio: $${d.precio}<br/>
           Ventas: ${d.ventas}<br/>
           Ingresos: $${d.ingresos}`
        );
    })
    .on("mousemove", function (event) {
      const [xPos, yPos] = d3.pointer(event, contenedor.node());
      tooltip
        .style("left", xPos + 10 + "px")
        .style("top", yPos + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    })
    .transition()
    .duration(600)
    .attr("r", (d) => r(d.ingresos));
}
