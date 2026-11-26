import {
  buscarTicketPorId,
  eliminarTicketPorId,
  exportarTicketsJSON,
  generarIdTicket,
  guardarConfiguracion,
  guardarTicketEnHistorial,
  importarTicketsDesdeArchivo,
  leerConfiguracion,
  obtenerFechaHoraActual,
  obtenerTodosLosTickets,
} from "./ticketStorage.js";

import {
  ejecutarImpresionTermica,
  formatearMoneda,
  renderizarVistaPreviaTicket,
} from "./ticketRender.js";

let ticketActual = null;

function cargarEncabezadoEnFormulario() {
  const cfg = leerConfiguracion();
  document.getElementById("enc-negocio").value = cfg.negocio || "EDS ORQUÍDEAS";
  document.getElementById("enc-nit").value = cfg.nit || "";
  document.getElementById("enc-direccion").value = cfg.direccion || "Calle 161 # 18 - 30, Bogotá";
  document.getElementById("enc-telefono").value = cfg.telefono || "3208123125";
}

function guardarEncabezadoDesdeFormulario() {
  guardarConfiguracion({
    negocio: document.getElementById("enc-negocio").value.trim(),
    nit: document.getElementById("enc-nit").value.trim(),
    direccion: document.getElementById("enc-direccion").value.trim(),
    telefono: document.getElementById("enc-telefono").value.trim(),
  });
}

function agregarFilaItem(descripcion = "", cantidad = 1, precio = "") {
  const contenedor = document.getElementById("contenedor-items");
  const fila = document.createElement("div");
  fila.className = "item-row";

  const inpDesc = document.createElement("input");
  inpDesc.type = "text";
  inpDesc.className = "it-desc";
  inpDesc.placeholder = "Descripción (ej. Corriente / ACPM / Servicio)";
  inpDesc.value = descripcion;

  const inpCant = document.createElement("input");
  inpCant.type = "number";
  inpCant.className = "it-cant";
  inpCant.step = "any";
  inpCant.min = "0";
  inpCant.placeholder = "Cant.";
  inpCant.value = cantidad;

  const inpPrecio = document.createElement("input");
  inpPrecio.type = "number";
  inpPrecio.className = "it-precio";
  inpPrecio.step = "any";
  inpPrecio.min = "0";
  inpPrecio.placeholder = "Valor Unit.";
  inpPrecio.value = precio;

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "btn btn-danger";
  btnEliminar.title = "Quitar ítem";
  btnEliminar.textContent = "✕";

  btnEliminar.addEventListener("click", () => {
    fila.remove();
    if (contenedor.children.length === 0) {
      agregarFilaItem();
    }
    actualizarVistaPrevia();
  });

  [inpDesc, inpCant, inpPrecio].forEach((inp) => {
    inp.addEventListener("input", actualizarVistaPrevia);
  });

  fila.appendChild(inpDesc);
  fila.appendChild(inpCant);
  fila.appendChild(inpPrecio);
  fila.appendChild(btnEliminar);
  contenedor.appendChild(fila);

  actualizarVistaPrevia();
}

function leerItemsFormulario() {
  const filas = document.querySelectorAll("#contenedor-items .item-row");
  const items = [];

  filas.forEach((fila) => {
    const desc = fila.querySelector(".it-desc").value.trim();
    const cant = parseFloat(fila.querySelector(".it-cant").value) || 0;
    const precio = parseFloat(fila.querySelector(".it-precio").value) || 0;

    if (desc || precio > 0) {
      items.push({
        descripcion: desc || "Ítem sin descripción",
        cantidad: cant,
        precio_unitario: precio,
        subtotal: Math.round(cant * precio * 100) / 100,
      });
    }
  });

  return items;
}

function construirObjetoTicket(incrementarImpresion = false) {
  const items = leerItemsFormulario();
  const total = items.reduce((acc, it) => acc + it.subtotal, 0);
  const impresionesPrevias = ticketActual ? (ticketActual.veces_impreso || 0) : 0;

  return {
    id_ticket: document.getElementById("tck-id").value.trim() || generarIdTicket(),
    fecha_creacion: document.getElementById("tck-fecha").value.trim() || obtenerFechaHoraActual(),
    metodo_pago: document.getElementById("tck-pago").value,
    cliente: document.getElementById("tck-cliente").value.trim(),
    referencia: document.getElementById("tck-referencia").value.trim(),
    observaciones: document.getElementById("tck-obs").value.trim(),
    items,
    total: Math.round(total * 100) / 100,
    veces_impreso: incrementarImpresion ? impresionesPrevias + 1 : impresionesPrevias,
    encabezado: {
      negocio: document.getElementById("enc-negocio").value.trim() || "ESTACIÓN DE SERVICIO",
      nit: document.getElementById("enc-nit").value.trim(),
      direccion: document.getElementById("enc-direccion").value.trim(),
      telefono: document.getElementById("enc-telefono").value.trim(),
    },
  };
}

function actualizarVistaPrevia() {
  guardarEncabezadoDesdeFormulario();
  const tkt = construirObjetoTicket(false);
  const esReimpresion = Boolean(ticketActual && ticketActual.veces_impreso > 0);
  renderizarVistaPreviaTicket(tkt, esReimpresion);
}

function persistirTicket(incrementarImpresion = false) {
  const tkt = construirObjetoTicket(incrementarImpresion);
  guardarTicketEnHistorial(tkt);
  ticketActual = tkt;

  document.getElementById("estado-modo").textContent = `CARGADO (${tkt.id_ticket})`;
  actualizarVistaPrevia();
  renderizarListaTickets();
  return tkt;
}

function guardarSolo() {
  const tkt = persistirTicket(false);
  alert(`Ticket ${tkt.id_ticket} guardado. Puedes volver a cargarlo desde el historial cuando lo necesites.`);
}

function guardarYImprimir() {
  persistirTicket(true);
  ejecutarImpresionTermica();
}

function nuevoTicket() {
  ticketActual = null;
  document.getElementById("estado-modo").textContent = "NUEVO TICKET";
  document.getElementById("tck-id").value = generarIdTicket();
  document.getElementById("tck-fecha").value = obtenerFechaHoraActual();
  document.getElementById("tck-pago").value = "Efectivo";
  document.getElementById("tck-cliente").value = "";
  document.getElementById("tck-referencia").value = "";
  document.getElementById("tck-obs").value = "";

  const cont = document.getElementById("contenedor-items");
  cont.innerHTML = "";
  agregarFilaItem();
  renderizarListaTickets();
}

function cargarTicketEnFormulario(idTicket, imprimirDirecto = false) {
  const encontrado = buscarTicketPorId(idTicket);
  if (!encontrado) {
    alert("No se encontró el ticket seleccionado.");
    return;
  }

  ticketActual = { ...encontrado };
  document.getElementById("estado-modo").textContent = `RECARGADO (${encontrado.id_ticket})`;
  document.getElementById("tck-id").value = encontrado.id_ticket;
  document.getElementById("tck-fecha").value = encontrado.fecha_creacion;
  document.getElementById("tck-pago").value = encontrado.metodo_pago || "Efectivo";
  document.getElementById("tck-cliente").value = encontrado.cliente || "";
  document.getElementById("tck-referencia").value = encontrado.referencia || "";
  document.getElementById("tck-obs").value = encontrado.observaciones || "";

  if (encontrado.encabezado) {
    document.getElementById("enc-negocio").value = encontrado.encabezado.negocio || "";
    document.getElementById("enc-nit").value = encontrado.encabezado.nit || "";
    document.getElementById("enc-direccion").value = encontrado.encabezado.direccion || "";
    document.getElementById("enc-telefono").value = encontrado.encabezado.telefono || "";
  }

  const cont = document.getElementById("contenedor-items");
  cont.innerHTML = "";
  if (encontrado.items && encontrado.items.length > 0) {
    encontrado.items.forEach((it) => {
      agregarFilaItem(it.descripcion, it.cantidad, it.precio_unitario);
    });
  } else {
    agregarFilaItem();
  }

  actualizarVistaPrevia();
  renderizarListaTickets();

  if (imprimirDirecto) {
    guardarYImprimir();
  }
}

function eliminarTicket(idTicket) {
  if (!confirm(`¿Eliminar el ticket ${idTicket} del historial?`)) return;
  eliminarTicketPorId(idTicket);
  if (ticketActual && ticketActual.id_ticket === idTicket) {
    nuevoTicket();
  } else {
    renderizarListaTickets();
  }
}

function renderizarListaTickets() {
  const contenedor = document.getElementById("lista-tickets");
  const filtro = (document.getElementById("buscador-tickets").value || "").trim().toLowerCase();

  const lista = obtenerTodosLosTickets().filter((t) => {
    if (!filtro) return true;
    const texto = `${t.id_ticket} ${t.cliente} ${t.referencia} ${t.fecha_creacion}`.toLowerCase();
    return texto.includes(filtro);
  });

  if (lista.length === 0) {
    contenedor.innerHTML = `<div class="lista-vacia">No hay tickets guardados que coincidan.</div>`;
    return;
  }

  contenedor.innerHTML = "";
  lista.forEach((t) => {
    const esActivo = ticketActual && ticketActual.id_ticket === t.id_ticket;
    const card = document.createElement("div");
    card.className = "ticket-card-item" + (esActivo ? " activo" : "");

    const meta = document.createElement("div");
    meta.className = "ticket-meta";
    meta.innerHTML = `
      <strong>${t.id_ticket} — ${formatearMoneda(t.total)}</strong>
      <div>${t.fecha_creacion} | Cliente: ${t.cliente || "Consumidor Final"}</div>
      <div>Ref: ${t.referencia || "-"} | Impresiones: ${t.veces_impreso || 0}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "ticket-card-actions";

    const btnCargar = document.createElement("button");
    btnCargar.type = "button";
    btnCargar.className = "btn btn-outline btn-sm";
    btnCargar.textContent = "Cargar";
    btnCargar.addEventListener("click", () => cargarTicketEnFormulario(t.id_ticket, false));

    const btnReimprimir = document.createElement("button");
    btnReimprimir.type = "button";
    btnReimprimir.className = "btn btn-primary btn-sm";
    btnReimprimir.textContent = "Reimprimir";
    btnReimprimir.addEventListener("click", () => cargarTicketEnFormulario(t.id_ticket, true));

    const btnBorrar = document.createElement("button");
    btnBorrar.type = "button";
    btnBorrar.className = "btn btn-danger btn-sm";
    btnBorrar.textContent = "✕";
    btnBorrar.addEventListener("click", () => eliminarTicket(t.id_ticket));

    actions.appendChild(btnCargar);
    actions.appendChild(btnReimprimir);
    actions.appendChild(btnBorrar);

    card.appendChild(meta);
    card.appendChild(actions);
    contenedor.appendChild(card);
  });
}

function registrarEventos() {
  document.getElementById("btn-agregar-item").addEventListener("click", () => agregarFilaItem());
  document.getElementById("btn-guardar-imprimir").addEventListener("click", guardarYImprimir);
  document.getElementById("btn-imprimir-rapido").addEventListener("click", guardarYImprimir);
  document.getElementById("btn-guardar-solo").addEventListener("click", guardarSolo);
  document.getElementById("btn-nuevo-ticket").addEventListener("click", nuevoTicket);
  document.getElementById("buscador-tickets").addEventListener("input", renderizarListaTickets);
  document.getElementById("btn-exportar-json").addEventListener("click", exportarTicketsJSON);

  document.getElementById("input-importar-json").addEventListener("change", async (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;
    try {
      const cantidad = await importarTicketsDesdeArchivo(archivo);
      renderizarListaTickets();
      alert(`Se importaron ${cantidad} tickets correctamente.`);
    } catch (err) {
      alert(err.message || "Error al importar el archivo JSON.");
    }
    event.target.value = "";
  });

  [
    "enc-negocio", "enc-nit", "enc-direccion", "enc-telefono",
    "tck-fecha", "tck-pago", "tck-cliente", "tck-referencia", "tck-obs",
  ].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", actualizarVistaPrevia);
    el.addEventListener("change", actualizarVistaPrevia);
  });
}

// Inicialización
cargarEncabezadoEnFormulario();
registrarEventos();
nuevoTicket();
