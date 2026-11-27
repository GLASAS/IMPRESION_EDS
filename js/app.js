function activarModulo(nombreModulo) {
    try {
        const secFact = document.getElementById('modulo-facturacion');
        const secReimp = document.getElementById('modulo-reimpresion');
        const tabFact = document.getElementById('tabFacturacion');
        const tabReimp = document.getElementById('tabReimpresion');

        if (secFact) secFact.classList.toggle('active', nombreModulo === 'facturacion');
        if (secReimp) secReimp.classList.toggle('active', nombreModulo === 'reimpresion');
        if (tabFact) tabFact.classList.toggle('active', nombreModulo === 'facturacion');
        if (tabReimp) tabReimp.classList.toggle('active', nombreModulo === 'reimpresion');

        if (nombreModulo === 'reimpresion') {
            renderizarTicketsGuardados();
            cargarTicketsDesdeBaseRemota(true);
        }
    } catch (e) {
        console.error('Error al cambiar módulo:', e);
    }
}

function enlazarEventosInterfaz() {
    try {
        const posForm = document.getElementById('posForm');
        if (posForm && !posForm.dataset.bound) {
            posForm.dataset.bound = '1';
            posForm.addEventListener('submit', (e) => {
                e.preventDefault();
                return false;
            });
        }

        const tabFact = document.getElementById('tabFacturacion');
        const tabReimp = document.getElementById('tabReimpresion');
        if (tabFact && !tabFact.dataset.bound) {
            tabFact.dataset.bound = '1';
            tabFact.addEventListener('click', () => activarModulo('facturacion'));
        }
        if (tabReimp && !tabReimp.dataset.bound) {
            tabReimp.dataset.bound = '1';
            tabReimp.addEventListener('click', () => activarModulo('reimpresion'));
        }

        const selProducto = document.getElementById('producto');
        const inpPpu = document.getElementById('ppu');
        const inpVol = document.getElementById('volumen');
        const btnImp = document.getElementById('btnImprimir');

        if (selProducto && !selProducto.dataset.bound) {
            selProducto.dataset.bound = '1';
            selProducto.addEventListener('change', cambiarProductoYPrecio);
        }
        if (inpPpu && !inpPpu.dataset.bound) {
            inpPpu.dataset.bound = '1';
            inpPpu.addEventListener('input', calcularTotal);
        }
        if (inpVol && !inpVol.dataset.bound) {
            inpVol.dataset.bound = '1';
            inpVol.addEventListener('input', calcularTotal);
        }
        if (btnImp && !btnImp.dataset.bound) {
            btnImp.dataset.bound = '1';
            btnImp.addEventListener('click', procesarImpresionYGuardar);
        }

        const filtroEl = document.getElementById('filtroTicket');
        const btnRefrescar = document.getElementById('btnRefrescarBase');
        const btnReimpDirecto = document.getElementById('btnReimprimirDirecto');
        const listaEl = document.getElementById('listaTicketsGuardados');

        if (filtroEl && !filtroEl.dataset.bound) {
            filtroEl.dataset.bound = '1';
            ['input', 'keyup', 'change'].forEach(ev => {
                filtroEl.addEventListener(ev, manejarBusquedaTicket);
            });
        }
        if (btnRefrescar && !btnRefrescar.dataset.bound) {
            btnRefrescar.dataset.bound = '1';
            btnRefrescar.addEventListener('click', () => cargarTicketsDesdeBaseRemota(true));
        }
        if (btnReimpDirecto && !btnReimpDirecto.dataset.bound) {
            btnReimpDirecto.dataset.bound = '1';
            btnReimpDirecto.addEventListener('click', reimprimirPorConsecutivoDirecto);
        }
        if (listaEl && !listaEl.dataset.bound) {
            listaEl.dataset.bound = '1';
            listaEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-reprint');
                if (!btn) return;
                const enc = btn.getAttribute('data-clave');
                if (enc) {
                    ejecutarReimpresion(decodeURIComponent(enc));
                }
            });
        }
    } catch (e) {
        console.error('Error en enlazarEventosInterfaz:', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        enlazarEventosInterfaz();
        renderizarTicketsGuardados();
    });
} else {
    enlazarEventosInterfaz();
    renderizarTicketsGuardados();
}
