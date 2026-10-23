// Control de gastos: guarda todo en el navegador con localStorage.

const $ = (id) => document.getElementById(id);

const inputPresupuesto = $("presupuesto");
const inputDescripcion = $("descripcion");
const inputMonto = $("monto");
const selectCategoria = $("categoria");
const botonAgregar = $("agregar");
const textoError = $("error");
const lista = $("lista");
const textoVacio = $("vacio");
const textoGastado = $("gastado");
const textoRestante = $("restante");
const relleno = $("relleno");
const barra = document.querySelector(".barra");

const grafico = $("grafico");
const dona = $("dona");
const leyenda = $("leyenda");
const sinDatos = $("sin-datos");

const COLORES = {
  Comida: "#ff9f43",
  Salidas: "#ee5a9b",
  Gym: "#1f8a5b",
  Juegos: "#7c5cff",
  Transporte: "#2f9bff",
  Otros: "#8a94a6",
};

let gastos = [];
let presupuesto = 0;

// ---------- Guardado ----------
function cargarDatos() {
  try {
    gastos = JSON.parse(localStorage.getItem("gastos")) || [];
    presupuesto = Number(localStorage.getItem("presupuesto")) || 0;
  } catch {
    gastos = [];
    presupuesto = 0;
  }
  inputPresupuesto.value = presupuesto || "";
}

function guardarDatos() {
  try {
    localStorage.setItem("gastos", JSON.stringify(gastos));
    localStorage.setItem("presupuesto", String(presupuesto));
  } catch {
    // Si el navegador bloquea el guardado, la app sigue andando sin persistir.
  }
}

// ---------- Utilidades ----------
function formatearPesos(numero) {
  return "$" + numero.toLocaleString("es-AR");
}

// ---------- Dibujar en pantalla ----------
function render() {
  lista.replaceChildren();

  gastos.forEach((gasto) => {
    const item = document.createElement("li");

    const info = document.createElement("div");
    info.className = "info";
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = gasto.descripcion; // textContent evita inyectar HTML
    const cat = document.createElement("p");
    cat.className = "cat";
    cat.textContent = gasto.categoria;
    info.append(desc, cat);

    const precio = document.createElement("span");
    precio.className = "precio";
    precio.textContent = formatearPesos(gasto.monto);

    const borrar = document.createElement("button");
    borrar.textContent = "Borrar";
    borrar.setAttribute("aria-label", "Borrar gasto: " + gasto.descripcion);
    borrar.addEventListener("click", () => eliminarGasto(gasto.id));

    item.append(info, precio, borrar);
    lista.append(item);
  });

  textoVacio.hidden = gastos.length > 0;

  const total = gastos.reduce((suma, g) => suma + g.monto, 0);
  const restante = presupuesto - total;
  const porcentaje = presupuesto > 0 ? Math.min((total / presupuesto) * 100, 100) : 0;

  textoGastado.textContent = formatearPesos(total);
  textoRestante.textContent = formatearPesos(restante);
  textoRestante.classList.toggle("negativo", restante < 0);

  relleno.style.width = porcentaje + "%";
  relleno.style.background = porcentaje >= 90 ? "var(--alerta)" : "var(--ok)";
  barra.setAttribute("aria-valuenow", Math.round(porcentaje));
    barra.setAttribute("aria-valuenow", Math.round(porcentaje));

  renderGrafico();

}


function renderGrafico() {
  leyenda.replaceChildren();
  grafico.hidden = gastos.length === 0;
  sinDatos.hidden = gastos.length > 0;
  if (gastos.length === 0) return;

  // 1. Sumar por categoría
  const totales = {};
  gastos.forEach((g) => {
    totales[g.categoria] = (totales[g.categoria] || 0) + g.monto;
  });
  const total = gastos.reduce((suma, g) => suma + g.monto, 0);

  // 2. Armar los tramos del degradado y la leyenda
  let acumulado = 0;
  const tramos = [];

  Object.entries(totales)
    .sort((a, b) => b[1] - a[1])
    .forEach(([categoria, suma]) => {
      const color = COLORES[categoria] || "#8a94a6";
      const inicio = acumulado;
      acumulado += (suma / total) * 100;
      tramos.push(`${color} ${inicio}% ${acumulado}%`);

      const fila = document.createElement("div");
      fila.className = "fila";

      const punto = document.createElement("span");
      punto.className = "punto";
      punto.style.background = color;

      const nombre = document.createElement("span");
      nombre.className = "nombre";
      nombre.textContent = categoria;

      const porcentaje = document.createElement("span");
      porcentaje.className = "porcentaje";
      porcentaje.textContent = Math.round((suma / total) * 100) + "%";

      const monto = document.createElement("span");
      monto.className = "suma";
      monto.textContent = formatearPesos(suma);

      fila.append(punto, nombre, porcentaje, monto);
      leyenda.append(fila);
    });

  dona.style.background = `conic-gradient(${tramos.join(", ")})`;
}

// ---------- Acciones ----------
function agregarGasto() {
  const descripcion = inputDescripcion.value.trim();
  const monto = Number(inputMonto.value);

  if (!descripcion) {
    textoError.textContent = "Escribí en qué gastaste.";
    inputDescripcion.focus();
    return;
  }
  if (!(monto > 0)) {
    textoError.textContent = "Ingresá un monto mayor a 0.";
    inputMonto.focus();
    return;
  }

  textoError.textContent = "";
  gastos.unshift({
    id: Date.now(),
    descripcion,
    monto,
    categoria: selectCategoria.value,
  });

  inputDescripcion.value = "";
  inputMonto.value = "";
  inputDescripcion.focus();

  guardarDatos();
  render();
}

function eliminarGasto(id) {
  gastos = gastos.filter((g) => g.id !== id);
  guardarDatos();
  render();
}

function exportarCSV() {
  if (gastos.length === 0) {
    alert("No hay gastos para exportar.");
    return;
  }

  const filas = gastos.map((g) => {
    // Las comillas dobles adentro del texto se escapan duplicándolas
    const descripcion = '"' + g.descripcion.replaceAll('"', '""') + '"';
    return [descripcion, g.monto, g.categoria].join(",");
  });

  const csv = ["descripcion,monto,categoria", ...filas].join("\n");

  // El \ufeff ayuda a que Excel muestre bien las tildes
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "gastos.csv";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

// ---------- Eventos ----------
botonAgregar.addEventListener("click", agregarGasto);

[inputDescripcion, inputMonto].forEach((campo) => {
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") agregarGasto();
  });
});
$("exportar").addEventListener("click", exportarCSV);

inputPresupuesto.addEventListener("input", () => {
  presupuesto = Number(inputPresupuesto.value) || 0;
  guardarDatos();
  render();
});

// ---------- Las manchas siguen al mouse ----------
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.addEventListener("pointermove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;  // de -1 a 1
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    document.documentElement.style.setProperty("--px", x);
    document.documentElement.style.setProperty("--py", y);
  });
}

// ---------- Intro ----------
const intro = $("intro");

$("entrar").addEventListener("click", () => {
  intro.classList.add("abriendo");
  document.body.classList.remove("intro-activa");
  setTimeout(() => intro.remove(), 1400);
});

// ---------- PWA: registrar el service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("No se pudo registrar el service worker:", err);
    });
  });
}

// ---------- Inicio ----------
cargarDatos();
render();
