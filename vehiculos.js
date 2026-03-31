const SUPABASE_URL = "https://fivedrrqmbxkimjdwvrs.supabase.co"
const SUPABASE_KEY = "sb_publishable_73v2ekG24yElZvLvdyKPbA_gA2Dmy5K"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const form = document.getElementById("gastoForm")

let grafico = null

// FORMATEO AUTOMÁTICO DE PESOS
const montoInput = document.getElementById("monto")

montoInput.addEventListener("input", function(e){

 let valor = e.target.value.replace(/\D/g,"")

 if(valor === ""){
  e.target.value = ""
  return
 }

 valor = (parseInt(valor)/100)

 const formatter = new Intl.NumberFormat("es-AR",{
  style:"currency",
  currency:"ARS",
  minimumFractionDigits:2
 })

 e.target.value = formatter.format(valor)

})

// POPUP PARA VER TICKETS
const popup = document.createElement("div")
popup.id = "popupTicket"
popup.style.position = "fixed"
popup.style.top = "0"
popup.style.left = "0"
popup.style.width = "100%"
popup.style.height = "100%"
popup.style.background = "rgba(0,0,0,0.8)"
popup.style.display = "none"
popup.style.alignItems = "center"
popup.style.justifyContent = "center"
popup.style.zIndex = "9999"

popup.innerHTML = `
<div style="position:relative; max-width:90%; max-height:90%;">
<button onclick="cerrarFoto()" style="position:absolute; top:-40px; right:0; font-size:22px; padding:6px 12px; cursor:pointer;">✖</button>
<img id="imagenTicket" style="max-width:100%; max-height:90vh; border-radius:8px;">
</div>
`

document.body.appendChild(popup)

function verFoto(url){
 document.getElementById("imagenTicket").src = url
 popup.style.display = "flex"
}

function cerrarFoto(){
 popup.style.display = "none"
}

// GUARDAR GASTO
form.addEventListener("submit", async (e)=>{

 e.preventDefault()

 const archivo = document.getElementById("foto").files[0]
 let urlFoto = null

 if(archivo){

  const nombreArchivo = Date.now() + "_" + archivo.name

  const { error } = await supabaseClient.storage
  .from("tickets")
  .upload(nombreArchivo, archivo, { upsert: false })

  if(error){
   console.error(error)
   alert("Error subiendo la imagen")
   return
  }

  const {data} = supabaseClient
  .storage
  .from("tickets")
  .getPublicUrl(nombreArchivo)

  urlFoto = data.publicUrl
 }

 // LIMPIAR MONTO
 let montoNumero = document.getElementById("monto").value
 .replace("$","")
 .replace(/\./g,"")
 .replace(",",".")
 .trim()

 montoNumero = parseFloat(montoNumero)

 const gasto = {
  fecha: document.getElementById("fecha").value,
  vehiculo: document.getElementById("vehiculo").value,
  tipo: document.getElementById("tipo").value,
  monto: montoNumero,
  km: document.getElementById("km").value || null,
  observaciones: document.getElementById("obs").value,
  foto: urlFoto
 }

 await supabaseClient
 .from("gastos")
 .insert([gasto])

 alert("Gasto guardado")

 form.reset()

 cargarGrafico()
 cargarGastos()

})

// DESCARGAR EXCEL
document.getElementById("descargar").addEventListener("click", descargarExcel)

async function descargarExcel(){

 const {data} = await supabaseClient
 .from("gastos")
 .select("*")

 const worksheet = XLSX.utils.json_to_sheet(data)
 const workbook = XLSX.utils.book_new()

 XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos")

 XLSX.writeFile(workbook,"gastos_vehiculos.xlsx")
}

// GRÁFICO
async function cargarGrafico(){

 const {data} = await supabaseClient
 .from("gastos")
 .select("vehiculo,monto")

 let totales = {}

 data.forEach(g=>{
  if(!totales[g.vehiculo]){
   totales[g.vehiculo]=0
  }
  totales[g.vehiculo]+=g.monto
 })

 const ctx = document.getElementById("grafico")

 if(grafico){
  grafico.destroy()
 }

 grafico = new Chart(ctx,{
  type:"bar",
  data:{
   labels:Object.keys(totales),
   datasets:[{
    label:"Gasto por vehículo",
    data:Object.values(totales),
    borderRadius:8
   }]
  },
  options:{
   responsive:true,
   plugins:{
    legend:{ display:false }
   }
  }
 })
}

// CARGAR GASTOS + DASHBOARD
async function cargarGastos(){

 const {data} = await supabaseClient
 .from("gastos")
 .select("*")
 .order("fecha",{ascending:false})

 const tbody = document.querySelector("#tablaGastos tbody")
 tbody.innerHTML=""

 let total = 0;

 data.forEach(gasto=>{

  total += gasto.monto;

  const fila = document.createElement("tr")

  fila.innerHTML = `
  <td>${gasto.fecha}</td>
  <td>${gasto.vehiculo}</td>
  <td>${gasto.tipo}</td>
  <td>$${gasto.monto}</td>
  <td>${gasto.foto ? `<button onclick="verFoto('${gasto.foto}')">📷</button>` : ""}</td>
  <td>
  <button class="borrar" onclick="borrarGasto(${gasto.id})">🗑</button>
  </td>
  `

  tbody.appendChild(fila)
 })

 const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS"
 })

 document.getElementById("totalVehiculosPantalla").textContent = formatter.format(total)
 document.getElementById("cantidadGastos").textContent = data.length

localStorage.setItem("gastosVehiculos", JSON.stringify(data));
}

// BORRAR
async function borrarGasto(id){

 if(!confirm("¿Seguro que querés borrar este gasto?")) return

 await supabaseClient
 .from("gastos")
 .delete()
 .eq("id",id)

 cargarGastos()
 cargarGrafico()
}

// FILTROS (AHORA TAMBIÉN ACTUALIZAN DASHBOARD)
async function aplicarFiltros(){

 const mes = document.getElementById("filtroMes").value
 const vehiculo = document.getElementById("filtroVehiculo").value

 let query = supabaseClient
 .from("gastos")
 .select("*")

 if(mes){

  const inicio = mes + "-01"

  const partes = mes.split("-")
  const anio = parseInt(partes[0])
  const mesNumero = parseInt(partes[1])

  const finFecha = new Date(anio, mesNumero, 0)
  const fin = finFecha.toLocaleDateString("sv-SE")

  query = query
  .gte("fecha", inicio)
  .lte("fecha", fin)
 }

 if(vehiculo){
  query = query.eq("vehiculo", vehiculo)
 }

 const {data} = await query

 const tbody = document.querySelector("#tablaGastos tbody")
 tbody.innerHTML=""

 let total = 0;

 data.forEach(gasto=>{

  total += gasto.monto;

  const fila = document.createElement("tr")

  fila.innerHTML = `
  <td>${gasto.fecha}</td>
  <td>${gasto.vehiculo}</td>
  <td>${gasto.tipo}</td>
  <td>$${gasto.monto}</td>
  <td>${gasto.foto ? `<button onclick="verFoto('${gasto.foto}')">📷</button>` : ""}</td>
  <td>
  <button class="borrar" onclick="borrarGasto(${gasto.id})">🗑</button>
  </td>
  `

  tbody.appendChild(fila)
 })

 const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS"
 })

 document.getElementById("totalVehiculosPantalla").textContent = formatter.format(total)
 document.getElementById("cantidadGastos").textContent = data.length

localStorage.setItem("gastosVehiculos", JSON.stringify(data || []));
}

// INICIO
cargarGrafico()
cargarGastos()

// BOTON VOLVER
function volver() {
  window.location.href = "index.html";
}
