const SHEET_ID = "1kpCmuE1pzVlyd2xZhr7hyNnGUKaDI-pVZvHgB61pEYM";
const SHEET_NAME = "FAC EDS";
const SHEET_GID = "0";
const SCRIPT_URL_ACTUAL = "https://script.google.com/macros/s/AKfycbwBoF_PJjYZr1Ij_mkQnsvZQr6ak6-rPkE7FsDJbYiTebMupVeNWXIiKpkv2J8DKjiCfg/exec";
var scriptURL = SCRIPT_URL_ACTUAL;

try {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('google_sheet_url', SCRIPT_URL_ACTUAL);
    }
} catch (e) {}

var ultimaLlaveEnvio = '';
var ultimoTiempoEnvio = 0;

function enviarEventoASheet(paramsObj, alTerminar) {
    var urlDestino = (typeof scriptURL === 'string' && scriptURL.trim()) ? scriptURL.trim() : SCRIPT_URL_ACTUAL;
    var ahoraMs = Date.now();
    var llaveEnvio = (paramsObj.tipoEvento || '') + '|' + (paramsObj.consecutivo || '') + '|' + (paramsObj.placa || '') + '|' + (paramsObj.vecesImpreso || '');

    if (llaveEnvio === ultimaLlaveEnvio && (ahoraMs - ultimoTiempoEnvio) < 1500) {
        if (typeof alTerminar === 'function') alTerminar(true);
        return;
    }
    ultimaLlaveEnvio = llaveEnvio;
    ultimoTiempoEnvio = ahoraMs;

    var formData = new URLSearchParams();
    Object.keys(paramsObj || {}).forEach(function (k) {
        var val = paramsObj[k];
        formData.append(k, val !== undefined && val !== null ? String(val) : '');
    });

    fetch(urlDestino, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    })
        .then(function () {
            if (typeof alTerminar === 'function') alTerminar(true);
        })
        .catch(function (error) {
            console.error('Error al enviar evento a Sheet:', error);
            if (typeof alTerminar === 'function') alTerminar(false);
        });
}

var RUTAS_LOGO_RESPALDO = [
    'assets/logo biomax.png',
    './assets/logo biomax.png',
    'assets/logo%20biomax.png',
    'assets/logo marca de agua APK.jpg',
    'logo biomax.png'
];

function respaldoLogo(imgEl) {
    try {
        var pasoActual = parseInt(imgEl.getAttribute('data-retry') || '0', 10);
        if (pasoActual < RUTAS_LOGO_RESPALDO.length) {
            imgEl.setAttribute('data-retry', String(pasoActual + 1));
            imgEl.src = RUTAS_LOGO_RESPALDO[pasoActual];
        } else {
            imgEl.style.display = 'none';
        }
    } catch (e) {}
}

function actualizarAutorizacionEnTicket(valorAutorizacion) {
    var limpio = String(valorAutorizacion || '').trim();
    var elLinea = document.getElementById('t-autorizacion-linea');
    if (!elLinea) return;
    if (limpio !== '' && limpio !== '0' && Number(limpio) !== 0) {
        elLinea.innerText = '\nAutorizacion : ' + limpio;
    } else {
        elLinea.innerText = '';
    }
}
