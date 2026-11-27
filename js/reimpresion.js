const STORAGE_TICKETS_KEY = 'eds_orquideas_tickets_v1';
const LIMITE_ULTIMOS_REGISTROS = 10;
let memoriaTicketsRespaldo = [];
let baseRemotaCargada = false;
let consultaRemotaEnCurso = false;

function normalizarTextoBusqueda(txt) {
    return String(txt || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
}

function normalizarCompacto(txt) {
    return normalizarTextoBusqueda(txt).replace(/[\s-]+/g, '');
}

function obtenerClaveTicket(ticket) {
    if (!ticket) return '';
    if (ticket.idRegistro) return String(ticket.idRegistro).trim();
    if (ticket.consecutivo) return String(ticket.consecutivo).trim();
    return `${ticket.placa || ''}|${ticket.fecha || ''}|${ticket.hora || ''}|${ticket.dinero || ''}`.trim();
}

function manejarBusquedaTicket() {
    renderizarTicketsGuardados();
    if (!baseRemotaCargada && !consultaRemotaEnCurso) {
        cargarTicketsDesdeBaseRemota(false);
    }
}

function obtenerTicketsGuardados() {
    let listaLocal = [];
    try {
        const raw = localStorage.getItem(STORAGE_TICKETS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                listaLocal = parsed;
            }
        }
    } catch (e) {}

    if (listaLocal.length > 0) {
        memoriaTicketsRespaldo = listaLocal;
        return listaLocal;
    }
    return memoriaTicketsRespaldo;
}

function guardarTicketLocal(ticket) {
    const clave = obtenerClaveTicket(ticket);
    const listaActual = obtenerTicketsGuardados();
    const anterior = listaActual.find(item => obtenerClaveTicket(item) === clave);
    const veces = ticket.vecesImpreso || ((anterior && anterior.vecesImpreso) ? anterior.vecesImpreso : 1);

    const registroActualizado = {
        ...ticket,
        idRegistro: clave,
        vecesImpreso: veces,
        ultimaImpresion: new Date().toLocaleString('es-CO')
    };

    const filtrada = listaActual.filter(item => obtenerClaveTicket(item) !== clave);
    filtrada.unshift(registroActualizado);
    const recortada = filtrada.slice(0, 200);
    memoriaTicketsRespaldo = recortada;

    try {
        localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(recortada));
    } catch (e) {}
    return registroActualizado;
}

function normalizarListaTickets(rawLista) {
    if (!Array.isArray(rawLista)) return [];
    return rawLista.map((item, idx) => {
        const placa = String(item.placa || '').trim().toUpperCase();
        const consecutivo = String(item.consecutivo || item.idRegistro || (idx + 1)).trim();
        const fecha = String(item.fecha || '').trim();
        const hora = String(item.hora || '').trim();
        const dinero = String(item.dinero || '0').trim();
        const idRegistro = String(item.idRegistro || `${consecutivo}|${placa}|${fecha}|${hora}|${dinero}`).trim();
        return {
            ...item,
            idRegistro,
            consecutivo,
            placa,
            cliente: String(item.cliente || '').trim(),
            km: String(item.km || '0').trim(),
            producto: String(item.producto || 'DIESEL').trim(),
            ppu: String(item.ppu || '').trim(),
            volumen: String(item.volumen || '0').trim(),
            dinero,
            autorizacion: String(item.autorizacion || '').trim(),
            vecesImpreso: parseInt(item.vecesImpreso, 10) || 1
        };
    }).filter(t => t.placa || t.cliente || t.consecutivo);
}

function finalizarConsultaSinDatos(detalle = '') {
    consultaRemotaEnCurso = false;
    const estadoEl = document.getElementById('estadoSincronizacionBase');
    const locales = obtenerTicketsGuardados();
    if (estadoEl) {
        estadoEl.innerText = locales.length > 0
            ? `Mostrando últimos ${LIMITE_ULTIMOS_REGISTROS} registros locales${detalle ? ' (' + detalle + ')' : ''}`
            : `Sin registros disponibles${detalle ? ' (' + detalle + ')' : ''}`;
    }
    renderizarTicketsGuardados();
}

function fusionarTicketsRemotos(ticketsRemotos, fuenteTexto = '') {
    consultaRemotaEnCurso = false;
    const estadoEl = document.getElementById('estadoSincronizacionBase');
    const normalizados = normalizarListaTickets(ticketsRemotos);
    if (!normalizados.length) {
        finalizarConsultaSinDatos('Hoja vacía');
        return false;
    }

    const locales = obtenerTicketsGuardados();
    const combinados = [...normalizados];

    locales.forEach(loc => {
        const clave = obtenerClaveTicket(loc);
        if (!clave) return;
        const idx = combinados.findIndex(c => obtenerClaveTicket(c) === clave);
        if (idx === -1) {
            combinados.push(loc);
        } else if (loc.vecesImpreso && loc.vecesImpreso > 1) {
            combinados[idx].vecesImpreso = Math.max(combinados[idx].vecesImpreso || 1, loc.vecesImpreso);
        }
    });

    const recortada = combinados.slice(0, 200);
    memoriaTicketsRespaldo = recortada;
    try {
        localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(recortada));
    } catch (e) {}

    baseRemotaCargada = true;
    if (estadoEl) {
        estadoEl.innerText = `Últimos ${LIMITE_ULTIMOS_REGISTROS} registros disponibles (${recortada.length} en base)${fuenteTexto ? ' · ' + fuenteTexto : ''}`;
    }
    renderizarTicketsGuardados();
    return true;
}

function cargarTicketsDesdeBaseRemota(forzar = false) {
    const estadoEl = document.getElementById('estadoSincronizacionBase');
    if (baseRemotaCargada && !forzar) {
        renderizarTicketsGuardados();
        return;
    }
    if (consultaRemotaEnCurso && !forzar) {
        return;
    }
    consultaRemotaEnCurso = true;
    if (estadoEl) estadoEl.innerText = "Consultando últimos 10 registros de FAC EDS...";

    cargarDesdeGoogleSheetGViz('Consulta directa');
}

function parsearLineaCSV(linea) {
    const resultado = [];
    let actual = '';
    let entreComillas = false;
    for (let i = 0; i < linea.length; i++) {
        const ch = linea[i];
        if (ch === '"') {
            if (entreComillas && linea[i + 1] === '"') {
                actual += '"';
                i++;
            } else {
                entreComillas = !entreComillas;
            }
        } else if (ch === ',' && !entreComillas) {
            resultado.push(actual.trim());
            actual = '';
        } else {
            actual += ch;
        }
    }
    resultado.push(actual.trim());
    return resultado;
}

function cargarDesdeCSVHoja(motivoFetch) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}&_=${Date.now()}`;
    const csvTimer = setTimeout(() => {
        finalizarConsultaSinDatos(motivoFetch || 'Timeout CSV');
    }, 4000);

    fetch(csvUrl, { method: 'GET', cache: 'no-store' })
        .then(res => {
            clearTimeout(csvTimer);
            if (!res.ok) throw new Error(`CSV HTTP ${res.status}`);
            return res.text();
        })
        .then(csvText => {
            const lineas = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
            if (lineas.length <= 1) {
                finalizarConsultaSinDatos(motivoFetch || 'Sin filas');
                return;
            }

            const filasDatos = lineas.slice(1).map(parsearLineaCSV);
            const invertidas = [...filasDatos].reverse();
            const convertidos = [];

            for (let i = 0; i < invertidas.length && convertidos.length < 200; i++) {
                const c = invertidas[i];
                const fechaCompleta = c[0] || '';
                const placa = (c[1] || '').toUpperCase().trim();
                const cliente = (c[2] || '').trim();
                const km = (c[3] || '0').trim();
                const producto = (c[4] || 'DIESEL').trim();
                const ppu = (c[5] || '').trim();
                const volumen = (c[6] || '0').trim();
                const dinero = (c[7] || '0').trim();
                const autorizacion = (c[8] || '').trim();
                const consecutivoCol = (c[9] || '').trim();
                const vecesCol = parseInt(c[11] || '1', 10) || 1;

                if (!placa && !cliente && !consecutivoCol) continue;

                const idxComa = fechaCompleta.indexOf(',');
                const fechaTxt = idxComa !== -1 ? fechaCompleta.slice(0, idxComa).trim() : fechaCompleta.trim();
                const horaTxt = idxComa !== -1 ? fechaCompleta.slice(idxComa + 1).trim() : '';
                const filaNum = filasDatos.length - i + 1;

                convertidos.push({
                    idRegistro: `F${filaNum}-${placa}-${consecutivoCol || dinero}`,
                    consecutivo: consecutivoCol || String(filaNum),
                    fecha: fechaTxt,
                    hora: horaTxt,
                    placa,
                    cliente,
                    km,
                    producto,
                    ppu,
                    volumen,
                    dinero,
                    autorizacion,
                    vecesImpreso: vecesCol
                });
            }

            if (convertidos.length > 0) {
                fusionarTicketsRemotos(convertidos, 'FAC EDS');
            } else {
                finalizarConsultaSinDatos(motivoFetch || 'Sin datos válidos');
            }
        })
        .catch(() => {
            clearTimeout(csvTimer);
            finalizarConsultaSinDatos(motivoFetch || 'Error de red');
        });
}

function cargarDesdeGoogleSheetGViz(motivoFetch) {
    const gvizCallback = 'gvizCb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const scriptTag = document.createElement('script');
    let listo = false;

    const limpiar = () => {
        try { delete window[gvizCallback]; } catch (e) {}
        if (scriptTag.parentNode) scriptTag.parentNode.removeChild(scriptTag);
    };

    const timer = setTimeout(() => {
        if (listo) return;
        listo = true;
        limpiar();
        cargarDesdeCSVHoja(motivoFetch);
    }, 4000);

    window[gvizCallback] = function (resp) {
        if (listo) return;
        listo = true;
        clearTimeout(timer);
        limpiar();

        try {
            const table = resp && resp.table;
            const rows = (table && Array.isArray(table.rows)) ? table.rows : [];
            const invertidas = [...rows].reverse();
            const convertidos = [];

            for (let i = 0; i < invertidas.length && convertidos.length < 200; i++) {
                const c = invertidas[i].c || [];
                const val = (idx) => {
                    const cell = c[idx];
                    if (!cell) return '';
                    return cell.f !== undefined && cell.f !== null ? String(cell.f).trim() : String(cell.v ?? '').trim();
                };

                const fechaCompleta = val(0);
                const placa = val(1).toUpperCase();
                const cliente = val(2);
                const km = val(3) || '0';
                const producto = val(4) || 'DIESEL';
                const ppu = val(5) || '';
                const volumen = val(6) || '0';
                const dinero = val(7) || '0';
                const autorizacion = val(8) || '';
                const consecutivoCol = val(9) || '';
                const vecesCol = parseInt(val(11) || '1', 10) || 1;

                if (!placa && !cliente && !consecutivoCol) continue;

                const idxComa = fechaCompleta.indexOf(',');
                const fechaTxt = idxComa !== -1 ? fechaCompleta.slice(0, idxComa).trim() : fechaCompleta.trim();
                const horaTxt = idxComa !== -1 ? fechaCompleta.slice(idxComa + 1).trim() : '';
                const filaNum = rows.length - i + 1;

                convertidos.push({
                    idRegistro: `F${filaNum}-${placa}-${consecutivoCol || dinero}`,
                    consecutivo: consecutivoCol || String(filaNum),
                    fecha: fechaTxt,
                    hora: horaTxt,
                    placa: placa,
                    cliente: cliente,
                    km: km,
                    producto: producto,
                    ppu: ppu,
                    volumen: volumen,
                    dinero: dinero,
                    autorizacion: autorizacion,
                    vecesImpreso: vecesCol
                });
            }

            if (convertidos.length > 0) {
                fusionarTicketsRemotos(convertidos, 'Hoja FAC EDS');
            } else {
                cargarDesdeCSVHoja(motivoFetch);
            }
        } catch (e) {
            cargarDesdeCSVHoja(motivoFetch);
        }
    };

    scriptTag.onerror = function () {
        if (listo) return;
        listo = true;
        clearTimeout(timer);
        limpiar();
        cargarDesdeCSVHoja(motivoFetch);
    };

    const sheetParam = encodeURIComponent(SHEET_NAME);
    scriptTag.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${sheetParam}&tqx=responseHandler:${gvizCallback}&_=${Date.now()}`;
    document.body.appendChild(scriptTag);
}

function registrarReimpresionEnDrive(ticket) {
    const ahoraReimpresion = new Date().toLocaleString('es-CO');
    const estadoEl = document.getElementById('estadoSincronizacionBase');
    if (estadoEl) {
        estadoEl.innerText = `Guardando reimpresión de ${ticket.placa} (#${ticket.consecutivo}) en FAC EDS...`;
    }

    enviarEventoASheet({
        fechaHora: ahoraReimpresion,
        fechaHoraReimpresion: ahoraReimpresion,
        fechaHoraOriginal: `${ticket.fecha} ${ticket.hora}`,
        placa: ticket.placa,
        cliente: ticket.cliente,
        km: ticket.km || '0',
        producto: ticket.producto,
        ppu: ticket.ppu,
        volumen: ticket.volumen,
        dinero: ticket.dinero,
        autorizacion: ticket.autorizacion || '',
        consecutivo: ticket.consecutivo,
        tipoEvento: 'REIMPRESION',
        vecesImpreso: String(ticket.vecesImpreso)
    }, () => {
        if (estadoEl) {
            estadoEl.innerText = `Reimpresión registrada (${ticket.placa} · #${ticket.consecutivo} · ${ahoraReimpresion}).`;
        }
    });
}

function obtenerTicketsFiltradosUltimos10() {
    const rawFiltro = document.getElementById('filtroTicket')?.value || '';
    const filtro = normalizarTextoBusqueda(rawFiltro);
    const filtroCompacto = normalizarCompacto(rawFiltro);
    const todos = obtenerTicketsGuardados();

    if (!filtroCompacto) {
        return todos.slice(0, LIMITE_ULTIMOS_REGISTROS);
    }

    return todos
        .filter(t => {
            const placaNorm = normalizarTextoBusqueda(t.placa);
            const placaCompacta = normalizarCompacto(t.placa);
            const consecutivoNorm = normalizarTextoBusqueda(t.consecutivo);
            const consecutivoCompacto = normalizarCompacto(t.consecutivo);
            const clienteNorm = normalizarTextoBusqueda(t.cliente);
            const clienteCompacto = normalizarCompacto(t.cliente);
            const authCompacta = normalizarCompacto(t.autorizacion);

            return placaCompacta.includes(filtroCompacto) ||
                   placaNorm.includes(filtro) ||
                   consecutivoCompacto.includes(filtroCompacto) ||
                   consecutivoNorm.includes(filtro) ||
                   clienteCompacto.includes(filtroCompacto) ||
                   clienteNorm.includes(filtro) ||
                   authCompacta.includes(filtroCompacto);
        })
        .slice(0, LIMITE_ULTIMOS_REGISTROS);
}

function renderizarTicketsGuardados() {
    const contenedor = document.getElementById('listaTicketsGuardados');
    if (!contenedor) return;

    const tickets = obtenerTicketsFiltradosUltimos10();

    if (!tickets.length) {
        contenedor.innerHTML = '<div class="empty-msg">No hay tickets que coincidan con la búsqueda.</div>';
        return;
    }

    contenedor.innerHTML = tickets.map((t, idx) => {
        const clave = obtenerClaveTicket(t);
        const encodedClave = encodeURIComponent(clave);
        return `
            <div class="ticket-item" data-ticket-index="${idx}">
                <div class="ticket-meta">
                    <strong>Placa: ${t.placa || 'SIN PLACA'}</strong> · #${t.consecutivo} · $${t.dinero}<br>
                    ${t.cliente} (${t.producto} - ${String(t.volumen).replace('.', ',')} G.)<br>
                    <small>${t.fecha} ${t.hora}</small><br>
                    <span class="print-badge">Impresiones: ${t.vecesImpreso || 1}</span>
                </div>
                <button type="button" class="btn-reprint" data-clave="${encodedClave}">
                    🖨️ Reimprimir
                </button>
            </div>
        `;
    }).join('');
}

function reimprimirPorConsecutivoDirecto() {
    const rawValor = document.getElementById('filtroTicket')?.value || '';
    const valor = normalizarTextoBusqueda(rawValor);
    const valorCompacto = normalizarCompacto(rawValor);
    if (!valorCompacto) {
        alert("Ingrese la placa o número de consecutivo para reimprimir.");
        return;
    }
    const candidatos = obtenerTicketsFiltradosUltimos10();
    const encontrado =
        candidatos.find(t => normalizarCompacto(t.placa) === valorCompacto) ||
        candidatos.find(t => normalizarCompacto(t.placa).includes(valorCompacto)) ||
        candidatos.find(t => normalizarCompacto(t.consecutivo) === valorCompacto) ||
        candidatos.find(t => normalizarCompacto(t.consecutivo).includes(valorCompacto)) ||
        candidatos.find(t => normalizarTextoBusqueda(t.placa).includes(valor));

    if (!encontrado) {
        alert("No se encontró un ticket reciente con esa placa o consecutivo.");
        return;
    }
    ejecutarReimpresion(obtenerClaveTicket(encontrado));
}

function ejecutarReimpresion(claveBuscada) {
    const claveNorm = String(claveBuscada || '').trim().toUpperCase();
    const ticket = obtenerTicketsGuardados().find(t => obtenerClaveTicket(t).toUpperCase() === claveNorm);
    if (!ticket) {
        alert("Ticket no encontrado.");
        return;
    }

    const totalImpresiones = (parseInt(ticket.vecesImpreso, 10) || 1) + 1;
    const ticketActualizado = guardarTicketLocal({
        ...ticket,
        vecesImpreso: totalImpresiones
    });

    registrarReimpresionEnDrive(ticketActualizado);
    renderizarTicketsGuardados();

    document.getElementById('t-num').innerText = ticketActualizado.consecutivo;
    document.getElementById('t-fecha').innerText = ticketActualizado.fecha;
    document.getElementById('t-hora').innerText = ticketActualizado.hora;
    document.getElementById('t-placa').innerText = ticketActualizado.placa;
    document.getElementById('t-cliente').innerText = ticketActualizado.cliente;
    document.getElementById('t-km').innerText = ticketActualizado.km || '0';
    actualizarAutorizacionEnTicket(ticketActualizado.autorizacion);
    document.getElementById('t-producto').innerText = ticketActualizado.producto;
    document.getElementById('t-ppu').innerText = ticketActualizado.ppu;
    document.getElementById('t-volumen').innerText = String(ticketActualizado.volumen).replace('.', ',');
    document.getElementById('t-dinero').innerText = ticketActualizado.dinero;
    document.getElementById('t-leyenda').innerText = "** COPIA **";

    setTimeout(() => {
        window.print();
    }, 250);
}
