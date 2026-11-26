export function formatearMoneda(valor) {
  const num = Number(valor) || 0;
  return "$ " + num.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function renderizarVistaPreviaTicket(ticket, esReimpresion = false) {
  document.getElementById("prev-negocio").textContent = (ticket.encabezado.negocio || "ESTACIÓN DE SERVICIO").toUpperCase();

  const elNit = document.getElementById("prev-nit");
  elNit.textContent = ticket.encabezado.nit ? `NIT: ${ticket.encabezado.nit}` : "";
  elNit.style.display = ticket.encabezado.nit ? "block" : "none";

  const elDir = document.getElementById("prev-direccion");
  elDir.textContent = ticket.encabezado.direccion || "";
  elDir.style.display = ticket.encabezado.direccion ? "block" : "none";

  const elTel = document.getElementById("prev-telefono");
  elTel.textContent = ticket.encabezado.telefono ? `Tel: ${ticket.encabezado.telefono}` : "";
  elTel.style.display = ticket.encabezado.telefono ? "block" : "none";

  document.getElementById("prev-id").textContent = ticket.id_ticket;
  document.getElementById("prev-fecha").textContent = ticket.fecha_creacion;
  document.getElementById("prev-pago").textContent = ticket.metodo_pago;

  document.getElementById("prev-impresiones").textContent =
    esReimpresion && ticket.veces_impreso > 0
      ? `${ticket.veces_impreso} (Reimpresión)`
      : "Original";

  document.getElementById("prev-cliente").textContent = ticket.cliente || "CONSUMIDOR FINAL";

  const bloqueRef = document.getElementById("bloque-prev-ref");
  document.getElementById("prev-referencia").textContent = ticket.referencia || "-";
  bloqueRef.style.display = ticket.referencia ? "block" : "none";

  const contItems = document.getElementById("prev-items");
  contItems.innerHTML = "";

  if (!ticket.items || ticket.items.length === 0) {
    contItems.innerHTML = `<div class="t-empty">(Sin ítems cargados)</div>`;
  } else {
    ticket.items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "t-item";

      const divDesc = document.createElement("div");
      divDesc.className = "t-bold";
      divDesc.textContent = it.descripcion;

      const divRow = document.createElement("div");
      divRow.className = "t-row";

      const spanCant = document.createElement("span");
      spanCant.textContent = `${it.cantidad} x ${formatearMoneda(it.precio_unitario)}`;

      const spanSub = document.createElement("span");
      spanSub.textContent = formatearMoneda(it.subtotal);

      divRow.appendChild(spanCant);
      divRow.appendChild(spanSub);
      div.appendChild(divDesc);
      div.appendChild(divRow);
      contItems.appendChild(div);
    });
  }

  document.getElementById("prev-total").textContent = formatearMoneda(ticket.total);

  const bloqueObs = document.getElementById("bloque-prev-obs");
  if (ticket.observaciones) {
    document.getElementById("prev-obs").textContent = ticket.observaciones;
    bloqueObs.style.display = "block";
  } else {
    bloqueObs.style.display = "none";
  }
}

export function ejecutarImpresionTermica() {
  window.print();
}
