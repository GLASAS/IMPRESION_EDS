const SHEET_ID = "1kpCmuE1pzVlyd2xZhr7hyNnGUKaDI-pVZvHgB61pEYM";
const SHEET_NAME = "FAC EDS";
const SHEET_GID = "0";
const SCRIPT_URL_ACTUAL = "https://script.google.com/macros/s/AKfycbwfn5jkSUaUNFlY3hrsXKQxuzwYK5N3uESvWlw9vuNj2m10N72y1lo4BXdYeYpqqOWGag/exec";
var scriptURL = SCRIPT_URL_ACTUAL;

try {
    localStorage.setItem('google_sheet_url', SCRIPT_URL_ACTUAL);
} catch (e) {}

let ultimaLlaveEnvio = '';
let ultimoTiempoEnvio = 0;

function enviarEventoASheet(paramsObj, alTerminar) {
    const urlDestino = (typeof scriptURL === 'string' && scriptURL.trim()) ? scriptURL.trim() : SCRIPT_URL_ACTUAL;
    const ahoraMs = Date.now();
    const llaveEnvio = `${paramsObj.tipoEvento || ''}|${paramsObj.consecutivo || ''}|${paramsObj.placa || ''}|${paramsObj.vecesImpreso || ''}`;

    if (llaveEnvio === ultimaLlaveEnvio && (ahoraMs - ultimoTiempoEnvio) < 1500) {
        if (typeof alTerminar === 'function') alTerminar(true);
        return;
    }
    ultimaLlaveEnvio = llaveEnvio;
    ultimoTiempoEnvio = ahoraMs;

    const formData = new URLSearchParams();
    Object.keys(paramsObj || {}).forEach(k => {
        const val = paramsObj[k];
        formData.append(k, val !== undefined && val !== null ? String(val) : '');
    });

    fetch(urlDestino, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    })
        .then(() => {
            if (typeof alTerminar === 'function') alTerminar(true);
        })
        .catch(error => {
            console.error('Error al enviar evento a Sheet:', error);
            if (typeof alTerminar === 'function') alTerminar(false);
        });
}

const RUTAS_LOGO_RESPALDO = [
    'assets/logo biomax.png',
    './assets/logo biomax.png',
    'assets/logo%20biomax.png',
    'assets/logo marca de agua APK.jpg',
    'logo biomax.png'
];

function respaldoLogo(imgEl) {
    try {
        const pasoActual = parseInt(imgEl.getAttribute('data-retry') || '0', 10);
        if (pasoActual < RUTAS_LOGO_RESPALDO.length) {
            imgEl.setAttribute('data-retry', String(pasoActual + 1));
            imgEl.src = RUTAS_LOGO_RESPALDO[pasoActual];
        } else {
            imgEl.style.display = 'none';
        }
    } catch (e) {}
}

function actualizarAutorizacionEnTicket(valorAutorizacion) {
    const limpio = String(valorAutorizacion || '').trim();
    const elLinea = document.getElementById('t-autorizacion-linea');
    if (!elLinea) return;
    if (limpio !== '' && limpio !== '0' && Number(limpio) !== 0) {
        elLinea.innerText = `\nAutorizacion : ${limpio}`;
    } else {
        elLinea.innerText = '';
    }
}
