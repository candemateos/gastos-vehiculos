// CLAVES DE LOCALSTORAGE
const KEY_GASTOS = "gastosOficina";
const KEY_TOTAL = "totalOficina";

// CARGAR GASTOS AL INICIAR
document.addEventListener("DOMContentLoaded", () => {
  mostrarGastos();
});

// FORM
document.getElementById("formGasto").addEventListener("submit", function(e) {
  e.preventDefault();

  const gasto = {
    fecha: document.getElementById("fecha").value,
    tipo: document.getElementById("tipo").value,
    detalle: document.getElementById("detalle").value,
    monto: parseFloat(document.getElementById("monto").value),
    observaciones: document.getElementById("observaciones").value
  };

  guardarGasto(gasto);
  this.reset();
  mostrarGastos();
});

// GUARDAR
function guardarGasto(gasto) {
  let gastos = JSON.parse(localStorage.getItem(KEY_GASTOS)) || [];
  gastos.push(gasto);
  localStorage.setItem(KEY_GASTOS, JSON.stringify(gastos));
}

// MOSTRAR EN TABLA
function mostrarGastos() {
  const tabla = document.querySelector("#tablaGastos tbody");
  tabla.innerHTML = "";

  let gastos = JSON.parse(localStorage.getItem(KEY_GASTOS)) || [];

  let total = 0;

  gastos.forEach((gasto, index) => {

    total += gasto.monto;

    let fila = `
      <tr>
        <td>${gasto.fecha}</td>
        <td>${gasto.tipo}</td>
        <td>${gasto.detalle}</td>
        <td>${formatearDinero(gasto.monto)}</td>
        <td>${gasto.observaciones || ""}</td>
        <td><button onclick="eliminarGasto(${index})">❌</button></td>
      </tr>
    `;

    tabla.innerHTML += fila;
  });

  // MOSTRAR TOTAL
  document.getElementById("total").textContent = formatearDinero(total);

  // GUARDAR TOTAL PARA EL INDEX
  localStorage.setItem(KEY_TOTAL, total);
}

// ELIMINAR
function eliminarGasto(index) {
  let gastos = JSON.parse(localStorage.getItem(KEY_GASTOS)) || [];
  gastos.splice(index, 1);
  localStorage.setItem(KEY_GASTOS, JSON.stringify(gastos));
  mostrarGastos();
}

// FORMATO DINERO
function formatearDinero(valor) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS"
  });
}


// BOTON VOLVER
function volver() {
  window.location.href = "index.html";
}