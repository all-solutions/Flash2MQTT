const centralRepoBaseURL = 'https://all-solutions.github.io/Flash2MQTT/firmware';
const defaultLanguage = 'en';

const i18n = {
    en: {
        htmlLang: 'en',
        eyebrow: 'Browser Flasher',
        heroTitle: 'Flash2MQTT Installer',
        heroText: 'Install *2MQTT firmware directly from your browser for ESP8266 and ESP32 boards.',
        metaUsb: 'USB / Serial',
        metaChips: 'ESP8266 + ESP32',
        metaTools: 'No local tools required',
        workflowKicker: 'Workflow',
        workflowTitle: 'Flash in three steps',
        step1Title: 'Choose firmware and board',
        step1Text: 'Select the matching firmware family and the exact hardware variant.',
        step2Title: 'Connect your device',
        step2Text: 'Use USB or a serial-to-USB adapter and put the board into flash mode if needed.',
        step3Title: 'Start the web flasher',
        step3Text: 'Press Connect, pick the serial port, and let ESP Web Tools handle the upload.',
        installerKicker: 'Installer',
        installerTitle: 'Select your target',
        firmwareLabel: 'Firmware',
        firmwarePlaceholder: 'Please select',
        variantLabel: 'Variant',
        variantPlaceholder: 'Please select a variant',
        summaryFirmwareLabel: 'Firmware',
        summaryVariantLabel: 'Variant',
        summaryChipLabel: 'Chip',
        footerLine1: '*2MQTT Firmware Installer inspired by ESP Web Tools',
        notSelected: 'Not selected',
        unknown: 'Unknown',
        statusLoadFirmware: 'Select a firmware to load available variants.',
        statusLoadingVariants: 'Loading variants for the selected firmware...',
        statusSelectVariant: 'Select a hardware variant to generate the flashing manifest.',
        statusEnableFlash: 'Select a hardware variant to enable flashing.',
        statusReady: 'Ready. Press Connect and choose the serial port for your device.',
        statusFirmwareListError: 'Unable to load firmware list right now.',
        statusVariantsError: 'Variants could not be loaded for the selected firmware.'
    },
    de: {
        htmlLang: 'de',
        eyebrow: 'Browser Flasher',
        heroTitle: 'Flash2MQTT Installer',
        heroText: '*2MQTT Firmware direkt im Browser auf ESP8266- und ESP32-Boards flashen.',
        metaUsb: 'USB / Seriell',
        metaChips: 'ESP8266 + ESP32',
        metaTools: 'Ohne lokale Tools',
        workflowKicker: 'Ablauf',
        workflowTitle: 'In drei Schritten flashen',
        step1Title: 'Firmware und Board wählen',
        step1Text: 'Die passende Firmware-Familie und anschließend die genaue Hardware-Variante auswählen.',
        step2Title: 'Gerät verbinden',
        step2Text: 'Per USB oder USB-Seriell-Adapter anschließen und falls nötig in den Flash-Modus versetzen.',
        step3Title: 'Web-Flasher starten',
        step3Text: 'Auf Connect klicken, den richtigen Port wählen und den Upload starten.',
        installerKicker: 'Installer',
        installerTitle: 'Ziel auswählen',
        firmwareLabel: 'Firmware',
        firmwarePlaceholder: 'Bitte wählen',
        variantLabel: 'Variante',
        variantPlaceholder: 'Bitte Variante wählen',
        summaryFirmwareLabel: 'Firmware',
        summaryVariantLabel: 'Variante',
        summaryChipLabel: 'Chip',
        footerLine1: '*2MQTT Firmware Installer inspiriert von ESP Web Tools',
        notSelected: 'Nicht gewählt',
        unknown: 'Unbekannt',
        statusLoadFirmware: 'Wähle zuerst eine Firmware, um die Varianten zu laden.',
        statusLoadingVariants: 'Varianten für die ausgewählte Firmware werden geladen...',
        statusSelectVariant: 'Wähle jetzt die passende Hardware-Variante aus.',
        statusEnableFlash: 'Wähle eine Hardware-Variante, um den Flash-Button zu aktivieren.',
        statusReady: 'Bereit. Auf Connect klicken und danach den seriellen Port auswählen.',
        statusFirmwareListError: 'Firmware-Liste konnte derzeit nicht geladen werden.',
        statusVariantsError: 'Varianten konnten für diese Firmware nicht geladen werden.'
    }
};

let currentManifestUrl = null;
let currentLanguage = getInitialLanguage();
let currentFirmware = '';
let currentVariant = '';
let currentChip = '';
let currentStatusKey = 'statusLoadFirmware';

function elements() {
    return {
        firmwareSelect: document.getElementById('firmwareSelect'),
        variantSelect: document.getElementById('variantSelect'),
        variantGroup: document.getElementById('variantGroup'),
        flashButton: document.getElementById('flashButton'),
        statusMessage: document.getElementById('statusMessage'),
        selectedFirmware: document.getElementById('selectedFirmware'),
        selectedVariant: document.getElementById('selectedVariant'),
        selectedChip: document.getElementById('selectedChip'),
        langButtons: Array.from(document.querySelectorAll('.lang-button'))
    };
}

function t(key) {
    return i18n[currentLanguage][key] || i18n[defaultLanguage][key] || key;
}

function getInitialLanguage() {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'de' || param === 'en') {
        return param;
    }

    const stored = window.localStorage.getItem('flash2mqtt_lang');
    if (stored === 'de' || stored === 'en') {
        return stored;
    }

    return defaultLanguage;
}

function setStatus(key) {
    currentStatusKey = key;
    elements().statusMessage.textContent = t(key);
}

function setFlashButtonInteractive(isInteractive) {
    const { flashButton } = elements();

    flashButton.disabled = !isInteractive;
    flashButton.toggleAttribute('disabled', !isInteractive);
    flashButton.dataset.state = isInteractive ? 'enabled' : 'disabled';
    flashButton.style.pointerEvents = isInteractive ? 'auto' : 'none';
    flashButton.style.cursor = isInteractive ? 'pointer' : 'not-allowed';
    flashButton.setAttribute('aria-disabled', isInteractive ? 'false' : 'true');

    if (isInteractive) {
        flashButton.removeAttribute('tabindex');
        flashButton.removeAttribute('inert');
        flashButton.setAttribute('enabled', 'true');
        return;
    }

    flashButton.setAttribute('tabindex', '-1');
    flashButton.setAttribute('inert', '');
    flashButton.removeAttribute('enabled');
}

function updateSummary() {
    const { selectedFirmware, selectedVariant, selectedChip } = elements();
    selectedFirmware.textContent = currentFirmware || t('notSelected');
    selectedVariant.textContent = currentVariant || t('notSelected');
    selectedChip.textContent = currentChip || t('unknown');
}

function translateStaticContent() {
    document.documentElement.lang = t('htmlLang');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.dataset.i18n;
        node.textContent = t(key);
    });
}

function updateSelectPlaceholders() {
    const { firmwareSelect, variantSelect } = elements();

    if (firmwareSelect.options[0]) {
        firmwareSelect.options[0].text = t('firmwarePlaceholder');
    }

    if (variantSelect.options[0]) {
        variantSelect.options[0].text = t('variantPlaceholder');
    }
}

function updateLanguageButtons() {
    elements().langButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.lang === currentLanguage);
    });
}

function applyLanguage(language) {
    currentLanguage = language;
    window.localStorage.setItem('flash2mqtt_lang', language);
    translateStaticContent();
    updateLanguageButtons();
    updateSelectPlaceholders();
    updateSummary();
    setStatus(currentStatusKey);
}

function resetFlashButton() {
    const { flashButton } = elements();

    if (currentManifestUrl) {
        URL.revokeObjectURL(currentManifestUrl);
        currentManifestUrl = null;
    }

    flashButton.manifest = '';
    setFlashButtonInteractive(false);
}

function resetVariantSelection() {
    const { variantSelect, variantGroup } = elements();
    variantSelect.innerHTML = `<option value="">${t('variantPlaceholder')}</option>`;
    variantGroup.classList.remove('is-visible');
    currentVariant = '';
    currentChip = '';
    updateSummary();
    resetFlashButton();
}

function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function fetchFirmwareList() {
    const { firmwareSelect } = elements();

    try {
        const response = await fetch(`${centralRepoBaseURL}/firmware_list.json`);
        const firmwareList = await response.json();

        firmwareList.forEach((firmware) => {
            const option = document.createElement('option');
            option.value = firmware.name;
            option.text = `${firmware.name} - Version ${firmware.version}`;
            firmwareSelect.add(option);
        });

        const preselectFirmware = getURLParameter('get');
        if (preselectFirmware) {
            firmwareSelect.value = preselectFirmware;
            firmwareSelect.dispatchEvent(new Event('change'));
        }
    } catch (err) {
        console.error('Fehler beim Abrufen der Firmware-Liste:', err);
        setStatus('statusFirmwareListError');
    }
}

function bindLanguageButtons() {
    elements().langButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const nextLanguage = button.dataset.lang;
            if (nextLanguage === currentLanguage) {
                return;
            }
            applyLanguage(nextLanguage);
        });
    });
}

document.getElementById('firmwareSelect').addEventListener('change', async function () {
    const firmwareName = this.value;
    const { variantSelect, variantGroup } = elements();

    currentFirmware = firmwareName;
    resetVariantSelection();

    if (!firmwareName) {
        currentFirmware = '';
        updateSummary();
        setStatus('statusLoadFirmware');
        return;
    }

    updateSummary();
    setStatus('statusLoadingVariants');

    try {
        const response = await fetch(`${centralRepoBaseURL}/${firmwareName}/variants.json`);
        const variants = await response.json();

        variants.forEach((variant) => {
            const option = document.createElement('option');
            option.value = variant.file;
            option.dataset.chipFamily = variant.chipFamily || 'ESP8266';

            let displayText = variant.displayName;
            if (displayText === 'D1 Mini') {
                displayText = 'D1 Mini / NG';
            }

            option.text = displayText;
            variantSelect.add(option);
        });

        variantGroup.classList.add('is-visible');
        setStatus('statusSelectVariant');

        const preselectVariant = getURLParameter('variant');
        if (preselectVariant) {
            variantSelect.value = preselectVariant;
            variantSelect.dispatchEvent(new Event('change'));
        }
    } catch (err) {
        console.error('Fehler beim Abrufen der Varianten:', err);
        setStatus('statusVariantsError');
    }
});

document.getElementById('variantSelect').addEventListener('change', function () {
    const firmwareUrl = this.value;
    const { firmwareSelect, flashButton } = elements();
    const firmwareName = firmwareSelect.options[firmwareSelect.selectedIndex].value;
    const selectedOption = this.options[this.selectedIndex];
    const chipFamily = selectedOption?.dataset.chipFamily || 'ESP8266';
    const variantName = selectedOption?.text || '';

    currentFirmware = firmwareName || '';

    if (!firmwareUrl) {
        currentVariant = '';
        currentChip = '';
        updateSummary();
        setStatus('statusEnableFlash');
        resetFlashButton();
        return;
    }

    const manifest = {
        name: `${firmwareName} Firmware`,
        builds: [
            {
                chipFamily,
                parts: [
                    {
                        path: firmwareUrl,
                        offset: 0
                    }
                ]
            }
        ]
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);
    currentManifestUrl = manifestUrl;

    flashButton.manifest = manifestUrl;
    setFlashButtonInteractive(true);

    currentVariant = variantName;
    currentChip = chipFamily;
    updateSummary();
    setStatus('statusReady');
});

bindLanguageButtons();
applyLanguage(currentLanguage);
setFlashButtonInteractive(false);
fetchFirmwareList();
