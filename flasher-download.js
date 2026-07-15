const releaseApiUrl = 'https://api.github.com/repos/all-solutions/2MQTT-Flasher/releases/latest';
const fallbackReleasesUrl = 'https://github.com/all-solutions/2MQTT-Flasher/releases/latest';

const translations = {
    en: {
        htmlLang: 'en', eyebrow: 'Desktop Flasher', heroTitle: '2MQTT-Flasher',
        heroText: 'Flash ESP8266 and ESP32 devices with a compact desktop application.', backLink: 'Web flasher',
        featuresKicker: 'Features', featuresTitle: 'Everything in one app',
        feature1Title: 'Local or current releases', feature1Text: 'Select your own BIN file or load firmware from current *2MQTT releases.',
        feature2Title: 'Automatic device detection', feature2Text: 'Find serial ports and identify connected ESP chips automatically.',
        feature3Title: 'Integrated serial logs', feature3Text: 'Open the live device output directly after flashing.',
        downloadKicker: 'Download', downloadTitle: 'Choose your operating system', latestVersion: 'Latest version',
        loadingReleases: 'Loading current downloads from GitHub…', ready: 'Select the package that matches your system.',
        loadError: 'The download list could not be loaded. Open the GitHub release page instead.', allReleases: 'View all releases on GitHub',
        workflowKicker: 'Workflow', workflowTitle: 'Ready in three steps', step1Title: 'Download and unpack',
        step1Text: 'Download the package for your system and extract the ZIP archive.', step2Title: 'Connect your ESP',
        step2Text: 'Connect the device by USB and launch 2MQTT-Flasher.', step3Title: 'Select and flash',
        step3Text: 'Choose local or release firmware, then click Flash ESP.', footerLine1: '2MQTT-Flasher uses Espressif esptool under the hood',
        downloadFor: 'Download for', windows: 'Windows', linux: 'Linux', macIntel: 'macOS (Intel)', macArm: 'macOS (Apple Silicon)', package: 'ZIP package'
        , linuxNoticeTitle: 'Linux permission required', linuxNoticeText: 'Your user must belong to the dialout group. Run this command, then log out and back in:',
        copyCommand: 'Copy', commandCopied: 'Copied!'
    },
    de: {
        htmlLang: 'de', eyebrow: 'Desktop-Flasher', heroTitle: '2MQTT-Flasher',
        heroText: 'ESP8266- und ESP32-Geräte komfortabel mit einer kompakten Desktop-Anwendung flashen.', backLink: 'Web-Flasher',
        featuresKicker: 'Funktionen', featuresTitle: 'Alles in einer Anwendung',
        feature1Title: 'Lokal oder aktuelle Releases', feature1Text: 'Eigene BIN-Datei wählen oder Firmware aus aktuellen *2MQTT-Releases laden.',
        feature2Title: 'Automatische Geräteerkennung', feature2Text: 'Serielle Ports finden und angeschlossene ESP-Chips automatisch erkennen.',
        feature3Title: 'Integrierte serielle Logs', feature3Text: 'Die Live-Ausgabe des Geräts direkt nach dem Flashen öffnen.',
        downloadKicker: 'Download', downloadTitle: 'Betriebssystem auswählen', latestVersion: 'Aktuelle Version',
        loadingReleases: 'Aktuelle Downloads werden von GitHub geladen…', ready: 'Wähle das passende Paket für dein System.',
        loadError: 'Die Downloadliste konnte nicht geladen werden. Öffne stattdessen die GitHub-Release-Seite.', allReleases: 'Alle Releases auf GitHub ansehen',
        workflowKicker: 'Ablauf', workflowTitle: 'In drei Schritten startklar', step1Title: 'Herunterladen und entpacken',
        step1Text: 'Paket für dein System herunterladen und das ZIP-Archiv entpacken.', step2Title: 'ESP verbinden',
        step2Text: 'Gerät per USB anschließen und 2MQTT-Flasher starten.', step3Title: 'Auswählen und flashen',
        step3Text: 'Lokale oder Release-Firmware wählen und auf Flash ESP klicken.', footerLine1: '2MQTT-Flasher nutzt im Hintergrund Espressif esptool',
        downloadFor: 'Download für', windows: 'Windows', linux: 'Linux', macIntel: 'macOS (Intel)', macArm: 'macOS (Apple Silicon)', package: 'ZIP-Paket'
        , linuxNoticeTitle: 'Linux-Berechtigung erforderlich', linuxNoticeText: 'Dein Benutzer muss der Gruppe dialout angehören. Führe diesen Befehl aus und melde dich danach einmal ab und wieder an:',
        copyCommand: 'Kopieren', commandCopied: 'Kopiert!'
    }
};

let language = getLanguage();
let releaseData = null;

function getLanguage() {
    const requested = new URLSearchParams(location.search).get('lang');
    if (requested === 'de' || requested === 'en') return requested;
    const stored = localStorage.getItem('flash2mqtt_lang');
    return stored === 'de' || stored === 'en' ? stored : 'en';
}

function t(key) { return translations[language][key] || translations.en[key] || key; }

function assetDetails(name) {
    if (/windows/i.test(name)) return { key: 'windows', badge: 'WIN' };
    if (/macosarm/i.test(name)) return { key: 'macArm', badge: 'ARM' };
    if (/macos/i.test(name)) return { key: 'macIntel', badge: 'MAC' };
    if (/linux/i.test(name)) return { key: 'linux', badge: 'LIN' };
    return null;
}

function renderDownloads() {
    const list = document.getElementById('downloadList');
    if (!releaseData) return;
    const downloads = releaseData.assets.map(asset => ({ asset, details: assetDetails(asset.name) })).filter(item => item.details);
    list.innerHTML = downloads.map(({ asset, details }) => `
        <a class="download-card" href="${asset.browser_download_url}"${details.key === 'linux' ? ' data-linux-download' : ''}>
            <span class="os-badge">${details.badge}</span>
            <span class="download-copy"><strong>${t(details.key)}</strong><small>${t('package')} · ${formatSize(asset.size)}</small></span>
            <span class="download-arrow" aria-hidden="true">↓</span>
            <span class="sr-only">${t('downloadFor')} ${t(details.key)}</span>
        </a>`).join('');
    list.setAttribute('aria-busy', 'false');
    list.querySelector('[data-linux-download]')?.addEventListener('click', showLinuxToast);
}

function formatSize(bytes) { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

function applyLanguage(nextLanguage) {
    language = nextLanguage;
    localStorage.setItem('flash2mqtt_lang', language);
    document.documentElement.lang = t('htmlLang');
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('.lang-button').forEach(button => button.classList.toggle('is-active', button.dataset.lang === language));
    renderDownloads();
}

let toastTimer;

function showLinuxToast() {
    const toast = document.getElementById('linuxToast');
    toast.classList.add('is-visible');
    toast.setAttribute('aria-hidden', 'false');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideLinuxToast, 60000);
}

function hideLinuxToast() {
    const toast = document.getElementById('linuxToast');
    toast.classList.remove('is-visible');
    toast.setAttribute('aria-hidden', 'true');
}

async function copyDialoutCommand() {
    const button = document.getElementById('copyCommand');
    const command = document.getElementById('dialoutCommand').textContent;
    try {
        await navigator.clipboard.writeText(command);
        button.textContent = t('commandCopied');
        setTimeout(() => { button.textContent = t('copyCommand'); }, 1800);
    } catch (error) {
        console.error('Could not copy command:', error);
    }
}

async function loadRelease() {
    const status = document.getElementById('downloadStatus');
    try {
        const response = await fetch(releaseApiUrl, { headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
        releaseData = await response.json();
        document.getElementById('releaseVersion').textContent = releaseData.name || releaseData.tag_name;
        renderDownloads();
        status.textContent = t('ready');
    } catch (error) {
        console.error(error);
        document.getElementById('releaseVersion').textContent = 'GitHub';
        document.getElementById('downloadList').innerHTML = `<a class="download-card fallback-card" href="${fallbackReleasesUrl}" target="_blank" rel="noopener"><span class="os-badge">GH</span><span class="download-copy"><strong>GitHub Releases</strong><small>${t('allReleases')}</small></span><span class="download-arrow">↗</span></a>`;
        status.textContent = t('loadError');
    }
}

document.querySelectorAll('.lang-button').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));
document.getElementById('toastClose').addEventListener('click', hideLinuxToast);
document.getElementById('copyCommand').addEventListener('click', copyDialoutCommand);
document.getElementById('currentYear').textContent = new Date().getFullYear();
applyLanguage(language);
loadRelease();
