const SHEET_ID = "1kpCmuE1pzVlyd2xZhr7hyNnGUKaDI-pVZvHgB61pEYM";
const SHEET_NAME = "FAC EDS";
const SHEET_GID = "0";
const SCRIPT_URL_ACTUAL = "https://script.google.com/macros/s/AKfycbwBoF_PJjYZr1Ij_mkQnsvZQr6ak6-rPkE7FsDJbYiTebMupVeNWXIiKpkv2J8DKjiCfg/exec";
let scriptURL = SCRIPT_URL_ACTUAL;

try {
    localStorage.setItem('google_sheet_url', SCRIPT_URL_ACTUAL);
} catch (e) {}

let ultimaLlaveEnvio = '';
let ultimoTiempoEnvio = 0;

function enviarEventoASheet(paramsObj, alTerminar) {
    const ahoraMs = Date.now();
    const llaveEnvio = `${paramsObj.tipoEvento || ''}|${paramsObj.consecutivo || ''}|${paramsObj.placa || ''}|${paramsObj.vecesImpreso || ''}`;
    if (llaveEnvio === ultimaLlaveEnvio && (ahoraMs - ultimoTiempoEnvio) < 2000) {
        if (typeof alTerminar === 'function') alTerminar(true);
        return;
    }
    ultimaLlaveEnvio = llaveEnvio;
    ultimoTiempoEnvio = ahoraMs;

    const formData = new URLSearchParams();
    Object.keys(paramsObj).forEach(k => {
        formData.append(k, paramsObj[k] !== undefined && paramsObj[k] !== null ? String(paramsObj[k]) : '');
    });

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    })
        .then(() => {
            if (typeof alTerminar === 'function') alTerminar(true);
        })
        .catch(error => {
            console.error('Error al sincronizar con Sheet:', error);
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
