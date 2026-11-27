function activarModulo(nombreModulo) {
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
}

function enlazarEventosInterfaz() {
    const posForm = document.getElementById('posForm');
    if (posForm) {
        posForm.addEventListener('submit', (e) => e.preventDefault());
    }

    document.getElementById('tabFacturacion')?.addEventListener('click', () => activarModulo('facturacion'));
    document.getElementById('tabReimpresion')?.addEventListener('click', () => activarModulo('reimpresion'));

    document.getElementById('producto')?.addEventListener('change', cambiarProductoYPrecio);
    document.getElementById('ppu')?.addEventListener('input', calcularTotal);
    document.getElementById('volumen')?.addEventListener('input', calcularTotal);
    document.getElementById('btnImprimir')?.addEventListener('click', procesarImpresionYGuardar);

    const filtroEl = document.getElementById('filtroTicket');
    if (filtroEl) {
        ['input', 'keyup', 'change'].forEach(ev => filtroEl.addEventListener(ev, manejarBusquedaTicket));
    }

    document.getElementById('btnRefrescarBase')?.addEventListener('click', () => cargarTicketsDesdeBaseRemota(true));
    document.getElementById('btnReimprimirDirecto')?.addEventListener('click', reimprimirPorConsecutivoDirecto);

    document.getElementById('listaTicketsGuardados')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-reprint');
        if (!btn) return;
        const clave = btn.getAttribute('data-clave');
        if (clave) ejecutarReimpresion(decodeURIComponent(clave));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    enlazarEventosInterfaz();
    renderizarTicketsGuardados();
});
