function irA(pagina) {
  window.location.href = pagina;
}

function formatearDinero(valor) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS"
  });
}

// FILTRAR POR MES
function filtrarPorMes(gastos, mesSeleccionado) {
  if (!mesSeleccionado) return gastos;
  return gastos.filter(g => g.fecha.startsWith(mesSeleccionado));
}

// OBTENER TOTAL
function obtenerTotal(keyGastos, mes) {
  let gastos = JSON.parse(localStorage.getItem(keyGastos)) || [];
  gastos = filtrarPorMes(gastos, mes);
  return gastos.reduce((acc, g) => acc + g.monto, 0);
}

// DASHBOARD
function cargarDashboard() {

  let mes = document.getElementById("filtroMes").value;

  let vehiculos = obtenerTotal("gastosVehiculos", mes);
  let oficina = obtenerTotal("gastosOficina", mes);
  let obras = obtenerTotal("gastosObras", mes);

  let total = vehiculos + oficina + obras;

  document.getElementById("totalVehiculos").textContent = formatearDinero(vehiculos);
  document.getElementById("totalOficina").textContent = formatearDinero(oficina);
  document.getElementById("totalObras").textContent = formatearDinero(obras);
  document.getElementById("totalGeneral").textContent = formatearDinero(total);

  cargarGrafico(vehiculos, oficina, obras);
}

// GRÁFICO TORTA
let grafico;

function cargarGrafico(v, o, ob) {

  const ctx = document.getElementById("graficoGeneral");

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Vehículos", "Oficina", "Obras"],
      datasets: [{
        data: [v, o, ob],
        backgroundColor: ["#4e79a7", "#59a14f", "#f28e2b"]
      }]
    },
    options: {
      animation: {
        animateScale: true,
        duration: 1200
      },
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// AGRUPAR POR MES (TOTAL)
function agruparPorMes(gastos) {
  const resultado = {};

  gastos.forEach(g => {
    const mes = g.fecha.slice(0, 7);

    if (!resultado[mes]) {
      resultado[mes] = 0;
    }

    resultado[mes] += g.monto;
  });

  return resultado;
}

// AGRUPAR INDIVIDUAL
function agruparPorMesIndividual(gastos) {
  const resultado = {};

  gastos.forEach(g => {
    const mes = g.fecha.slice(0, 7);

    if (!resultado[mes]) {
      resultado[mes] = 0;
    }

    resultado[mes] += g.monto;
  });

  return resultado;
}

// GRÁFICO EVOLUCIÓN
let graficoEvolucion;

function cargarGraficoEvolucion() {

  let vehiculos = JSON.parse(localStorage.getItem("gastosVehiculos")) || [];
  let oficina = JSON.parse(localStorage.getItem("gastosOficina")) || [];
  let obras = JSON.parse(localStorage.getItem("gastosObras")) || [];

  const v = agruparPorMesIndividual(vehiculos);
  const o = agruparPorMesIndividual(oficina);
  const ob = agruparPorMesIndividual(obras);

  const meses = Array.from(new Set([
    ...Object.keys(v),
    ...Object.keys(o),
    ...Object.keys(ob)
  ])).sort();

  const dataVehiculos = meses.map(m => v[m] || 0);
  const dataOficina = meses.map(m => o[m] || 0);
  const dataObras = meses.map(m => ob[m] || 0);

  const ctx = document.getElementById("graficoEvolucion");

  if (graficoEvolucion) graficoEvolucion.destroy();

  graficoEvolucion = new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Vehículos",
          data: dataVehiculos,
          borderColor: "#4e79a7",
          tension: 0.3
        },
        {
          label: "Oficina",
          data: dataOficina,
          borderColor: "#59a14f",
          tension: 0.3
        },
        {
          label: "Obras",
          data: dataObras,
          borderColor: "#f28e2b",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// INICIO
window.onload = () => {

  // 👉 SETEAR MES ACTUAL
  const hoy = new Date().toISOString().slice(0,7);
  document.getElementById("filtroMes").value = hoy;

  cargarDashboard();
  cargarGraficoEvolucion();

  document.getElementById("filtroMes")
    .addEventListener("change", cargarDashboard);
};