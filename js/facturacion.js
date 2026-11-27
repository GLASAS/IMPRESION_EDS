let procesandoImpresionLock = false;

function cambiarProductoYPrecio() {
    const productoEl = document.getElementById('producto');
    const ppuInput = document.getElementById('ppu');
    if (!productoEl || !ppuInput) return;

    const producto = productoEl.value;
    if (producto === 'DIESEL') {
        ppuInput.value = 11380;
    } else if (producto.includes('GASOLINA')) {
        ppuInput.value = 16110;
    }
    calcularTotal();
}

function calcularTotal() {
    const ppuEl = document.getElementById('ppu');
    const volEl = document.getElementById('volumen');
    const dinEl = document.getElementById('dinero');
    if (!ppuEl || !volEl || !dinEl) return;

    const ppu = parseFloat(ppuEl.value) || 0;
    const volumen = parseFloat(volEl.value) || 0;
    const dineroTotal = Math.round(ppu * volumen);
    dinEl.value = dineroTotal > 0 ? dineroTotal : '';
}

function procesarImpresionYGuardar() {
    if (procesandoImpresionLock) return;
    const btn = document.getElementById('btnImprimir');

    try {
        const consecutivoEl = document.getElementById('consecutivo');
        const placaEl = document.getElementById('placa');
        const clienteEl = document.getElementById('cliente');
        const autorizacionEl = document.getElementById('autorizacion');
        const productoEl = document.getElementById('producto');
        const ppuEl = document.getElementById('ppu');
        const volEl = document.getElementById('volumen');
        const dinEl = document.getElementById('dinero');
        const kmEl = document.getElementById('km');

        const consecutivoVal = (consecutivoEl?.value || '').trim();
        const placaVal = (placaEl?.value || '').trim().toUpperCase();
        const clienteVal = (clienteEl?.value || '').trim();
        const autorizacionVal = (autorizacionEl?.value || '').trim();

        if (!consecutivoVal) {
            alert("Por favor ingrese el número o consecutivo.");
            consecutivoEl?.focus();
            return;
        }
        if (!placaVal) {
            alert("Por favor ingrese la placa del vehículo.");
            placaEl?.focus();
            return;
        }
        if (!clienteVal) {
            alert("Por favor seleccione una empresa / cliente.");
            clienteEl?.focus();
            return;
        }

        procesandoImpresionLock = true;
        if (btn) {
            btn.innerText = "Guardando e Imprimiendo...";
            btn.disabled = true;
        }

        const ahora = new Date();
        const fechaFormateada = ahora.toLocaleDateString('es-CO');
        const horaFormateada = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const fechaHoraCompleta = ahora.toLocaleString('es-CO');

        const productoVal = productoEl?.value || 'DIESEL';
        const ppuVal = String(ppuEl?.value || '0').trim();
        const volVal = String(volEl?.value || '0').trim();
        const dinVal = String(dinEl?.value || '0').trim();
        const kmVal = String(kmEl?.value || '0').trim();

        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.innerText = txt;
        };

        setText('t-num', consecutivoVal);
        setText('t-placa', placaVal);
        setText('t-cliente', clienteVal);
        setText('t-producto', productoVal);
        setText('t-ppu', ppuVal);
        setText('t-volumen', volVal.replace('.', ','));
        setText('t-dinero', dinVal);
        setText('t-km', kmVal);
        actualizarAutorizacionEnTicket(autorizacionVal);
        setText('t-fecha', fechaFormateada);
        setText('t-hora', horaFormateada);
        setText('t-leyenda', "** COPIA **");

        if (typeof guardarTicketLocal === 'function') {
            guardarTicketLocal({
                idRegistro: `${consecutivoVal}|${placaVal}|${fechaFormateada}|${horaFormateada}|${dinVal}`,
                consecutivo: consecutivoVal,
                fecha: fechaFormateada,
                hora: horaFormateada,
                placa: placaVal,
                cliente: clienteVal,
                km: kmVal,
                producto: productoVal,
                ppu: ppuVal,
                volumen: volVal,
                dinero: dinVal,
                autorizacion: autorizacionVal,
                vecesImpreso: 1
            });
        }
        if (typeof renderizarTicketsGuardados === 'function') {
            renderizarTicketsGuardados();
        }

        if (typeof enviarEventoASheet === 'function') {
            enviarEventoASheet({
                fechaHora: fechaHoraCompleta,
                placa: placaVal,
                cliente: clienteVal,
                km: kmVal,
                producto: productoVal,
                ppu: ppuVal,
                volumen: volVal,
                dinero: dinVal,
                autorizacion: autorizacionVal,
                consecutivo: consecutivoVal,
                tipoEvento: 'IMPRESION',
                vecesImpreso: '1'
            });
        }

        setTimeout(() => {
            try {
                window.print();
            } finally {
                const form = document.getElementById('posForm');
                if (form) form.reset();
                if (productoEl) productoEl.value = 'DIESEL';
                cambiarProductoYPrecio();

                procesandoImpresionLock = false;
                if (btn) {
                    btn.innerText = "🖨️ Imprimir Ticket y Guardar";
                    btn.disabled = false;
                }
            }
        }, 500);
    } catch (err) {
        console.error('Error en procesarImpresionYGuardar:', err);
        procesandoImpresionLock = false;
        if (btn) {
            btn.innerText = "🖨️ Imprimir Ticket y Guardar";
            btn.disabled = false;
        }
    }
}
