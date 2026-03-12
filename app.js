const SUPABASE_URL = "https://fivedrrqmbxkimjdwvrs.supabase.co"
const SUPABASE_KEY = "sb_publishable_73v2ekG24yElZvLvdyKPbA_gA2Dmy5K"

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const form = document.getElementById("gastoForm")

form.addEventListener("submit", async (e)=>{

e.preventDefault()

const gasto = {

fecha: document.getElementById("fecha").value,
vehiculo: document.getElementById("vehiculo").value,
tipo: document.getElementById("tipo").value,
monto: parseFloat(document.getElementById("monto").value),
km: document.getElementById("km").value || null,
observaciones: document.getElementById("obs").value

}

await supabaseClient
.from("gastos")
.insert([gasto])

alert("Gasto guardado")

form.reset()

cargarGrafico()

})

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

new Chart(ctx,{
type:"bar",
data:{
labels:Object.keys(totales),
datasets:[{
label:"Gasto por vehículo",
data:Object.values(totales)
}]
}
})

}

cargarGrafico()