const STORAGE_TICKETS_KEY = "pos_tickets_guardados_v1";
const STORAGE_CONFIG_KEY = "pos_tickets_config_v1";

export function generarIdTicket() {
  const ahora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fecha = `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}`;
  const hora = `${pad(ahora.getHours())}${pad(ahora.getMinutes())}${pad(ahora.getSeconds())}`;
  const rand = Math.floor(100 + Math.random() * 900);
  return `TCK-${fecha}-${hora}-${rand}`;
}

export function obtenerFechaHoraActual() {
  const ahora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}

export function leerConfiguracion() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

export function guardarConfiguracion(config) {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
}

export function obtenerTodosLosTickets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_TICKETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function guardarTicketEnHistorial(ticket) {
  const lista = obtenerTodosLosTickets();
  const idx = lista.findIndex((x) => x.id_ticket === ticket.id_ticket);

  if (idx >= 0) {
    lista[idx] = ticket;
  } else {
    lista.unshift(ticket);
  }

  localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(lista));
  return ticket;
}

export function buscarTicketPorId(idTicket) {
  return obtenerTodosLosTickets().find((x) => x.id_ticket === idTicket) || null;
}

export function eliminarTicketPorId(idTicket) {
  const lista = obtenerTodosLosTickets().filter((x) => x.id_ticket !== idTicket);
  localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(lista));
}

export function exportarTicketsJSON() {
  const lista = obtenerTodosLosTickets();
  const blob = new Blob([JSON.stringify(lista, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `respaldo_tickets_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarTicketsDesdeArchivo(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (e) => {
      try {
        const importados = JSON.parse(e.target.result);
        if (!Array.isArray(importados)) {
          reject(new Error("Formato de archivo JSON inválido."));
          return;
        }
        const actuales = obtenerTodosLosTickets();
        const mapa = new Map(actuales.map((t) => [t.id_ticket, t]));
        importados.forEach((t) => {
          if (t && t.id_ticket) {
            mapa.set(t.id_ticket, t);
          }
        });
        localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(Array.from(mapa.values())));
        resolve(importados.length);
      } catch (err) {
        reject(err);
      }
    };
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsText(archivo);
  });
}
