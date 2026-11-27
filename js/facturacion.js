let procesandoImpresionLock = false;

function cambiarProductoYPrecio() {
    const producto = document.getElementById('producto').value;
    const ppuInput = document.getElementById('ppu');

    if (producto === 'DIESEL') {
        ppuInput.value = 11380;
    } else if (producto.includes('GASOLINA')) {
        ppuInput.value = 16110;
    }
    calcularTotal();
}

function calcularTotal() {
    const ppu = parseFloat(document.getElementById('ppu').value) || 0;
    const volumen = parseFloat(document.getElementById('volumen').value) || 0;
    const dineroTotal = Math.round(ppu * volumen);
    document.getElementById('dinero').value = dineroTotal > 0 ? dineroTotal : '';
}

function procesarImpresionYGuardar() {
    if (procesandoImpresionLock) return;
    const btn = document.getElementById('btnImprimir');
    try {
        const consecutivoVal = document.getElementById('consecutivo').value.trim();
        const placaVal = document.getElementById('placa').value.trim();
        const clienteVal = document.getElementById('cliente').value;
        const autorizacionVal = document.getElementById('autorizacion').value.trim();

        if (!consecutivoVal) {
            alert("Por favor ingrese el número o consecutivo.");
            document.getElementById('consecutivo').focus();
            return;
        }
        if (!placaVal) {
            alert("Por favor ingrese la placa del vehículo.");
            document.getElementById('placa').focus();
            return;
        }
        if (!clienteVal) {
            alert("Por favor seleccione una empresa / cliente.");
            document.getElementById('cliente').focus();
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

        document.getElementById('t-num').innerText = consecutivoVal;
        document.getElementById('t-placa').innerText = placaVal.toUpperCase();
        document.getElementById('t-cliente').innerText = clienteVal;
        document.getElementById('t-producto').innerText = document.getElementById('producto').value;

        const ppuVal = document.getElementById('ppu').value;
        const volVal = document.getElementById('volumen').value || '0';
        const dinVal = document.getElementById('dinero').value || '0';
        const kmVal = document.getElementById('km').value || '0';

        document.getElementById('t-ppu').innerText = ppuVal;
        document.getElementById('t-volumen').innerText = volVal.replace('.', ',');
        document.getElementById('t-dinero').innerText = dinVal;
        document.getElementById('t-km').innerText = kmVal;
        actualizarAutorizacionEnTicket(autorizacionVal);
        document.getElementById('t-fecha').innerText = fechaFormateada;
        document.getElementById('t-hora').innerText = horaFormateada;
        document.getElementById('t-leyenda').innerText = "** COPIA **";

        guardarTicketLocal({
            idRegistro: consecutivoVal,
            consecutivo: consecutivoVal,
            fecha: fechaFormateada,
            hora: horaFormateada,
            placa: placaVal.toUpperCase(),
            cliente: clienteVal,
            km: kmVal,
            producto: document.getElementById('producto').value,
            ppu: ppuVal,
            volumen: volVal,
            dinero: dinVal,
            autorizacion: autorizacionVal,
            vecesImpreso: 1
        });
        renderizarTicketsGuardados();

        const ahoraIso = new Date().toLocaleString('es-CO');
        enviarEventoASheet({
            fechaHora: ahoraIso,
            placa: placaVal.toUpperCase(),
            cliente: clienteVal,
            km: kmVal,
            producto: document.getElementById('producto').value,
            ppu: ppuVal,
            volumen: volVal,
            dinero: dinVal,
            autorizacion: autorizacionVal,
            consecutivo: consecutivoVal,
            tipoEvento: 'IMPRESION',
            vecesImpreso: '1'
        });

        setTimeout(() => {
            try {
                window.print();
            } finally {
                document.getElementById('posForm').reset();
                document.getElementById('producto').value = 'DIESEL';
                cambiarProductoYPrecio();

                procesandoImpresionLock = false;
                if (btn) {
                    btn.innerText = "🖨️ Imprimir Ticket y Guardar";
                    btn.disabled = false;
                }
            }
        }, 600);
    } catch (err) {
        console.error('Error en procesarImpresionYGuardar:', err);
        procesandoImpresionLock = false;
        if (btn) {
            btn.innerText = "🖨️ Imprimir Ticket y Guardar";
            btn.disabled = false;
        }
    }
}
