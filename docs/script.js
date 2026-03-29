const centralRepoBaseURL = 'https://all-solutions.github.io/Flash2MQTT/firmware';
let currentManifestUrl = null;

function elements() {
    return {
        firmwareSelect: document.getElementById('firmwareSelect'),
        variantSelect: document.getElementById('variantSelect'),
        variantGroup: document.getElementById('variantGroup'),
        flashButton: document.getElementById('flashButton'),
        statusMessage: document.getElementById('statusMessage'),
        selectedFirmware: document.getElementById('selectedFirmware'),
        selectedVariant: document.getElementById('selectedVariant'),
        selectedChip: document.getElementById('selectedChip')
    };
}

function updateSummary({ firmware = 'Nicht gewählt', variant = 'Nicht gewählt', chip = 'Unbekannt' } = {}) {
    const { selectedFirmware, selectedVariant, selectedChip } = elements();
    selectedFirmware.textContent = firmware;
    selectedVariant.textContent = variant;
    selectedChip.textContent = chip;
}

function setStatus(message) {
    elements().statusMessage.textContent = message;
}

function resetFlashButton() {
    const { flashButton } = elements();

    if (currentManifestUrl) {
        URL.revokeObjectURL(currentManifestUrl);
        currentManifestUrl = null;
    }

    flashButton.disabled = true;
    flashButton.removeAttribute('enabled');
    flashButton.manifest = '';
}

function resetVariantSelection() {
    const { variantSelect, variantGroup } = elements();
    variantSelect.innerHTML = '<option value="">Bitte Variante wählen</option>';
    variantGroup.classList.remove('is-visible');
    updateSummary({ variant: 'Nicht gewählt', chip: 'Unbekannt' });
    resetFlashButton();
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
    } catch (err) {
        console.error('Fehler beim Abrufen der Firmware-Liste:', err);
        setStatus('Firmware-Liste konnte derzeit nicht geladen werden.');
    }
}

fetchFirmwareList();

document.getElementById('firmwareSelect').addEventListener('change', async function () {
    const firmwareName = this.value;
    const { variantSelect, variantGroup } = elements();

    resetVariantSelection();

    if (!firmwareName) {
        updateSummary({ firmware: 'Nicht gewählt' });
        setStatus('Wähle zuerst eine Firmware, um die Varianten zu laden.');
        return;
    }

    updateSummary({ firmware: firmwareName });
    setStatus('Varianten für die ausgewählte Firmware werden geladen...');

    try {
        const response = await fetch(`${centralRepoBaseURL}/${firmwareName}/variants.json`);
        const variants = await response.json();

        variants.forEach((variant) => {
            const option = document.createElement('option');
            option.value = variant.file;
            option.dataset.chipFamily = variant.chipFamily || 'ESP8266';
            option.text = variant.displayName;
            variantSelect.add(option);
        });

        variantGroup.classList.add('is-visible');
        setStatus('Wähle jetzt die passende Hardware-Variante aus.');
    } catch (err) {
        console.error('Fehler beim Abrufen der Varianten:', err);
        setStatus('Varianten konnten für diese Firmware nicht geladen werden.');
    }
});

document.getElementById('variantSelect').addEventListener('change', function () {
    const firmwareUrl = this.value;
    const { firmwareSelect, flashButton } = elements();
    const firmwareName = firmwareSelect.options[firmwareSelect.selectedIndex].value;
    const selectedOption = this.options[this.selectedIndex];
    const chipFamily = selectedOption?.dataset.chipFamily || 'ESP8266';
    const variantName = selectedOption?.text || 'Nicht gewählt';

    if (!firmwareUrl) {
        updateSummary({ firmware: firmwareName || 'Nicht gewählt', variant: 'Nicht gewählt', chip: 'Unbekannt' });
        setStatus('Wähle eine Hardware-Variante, um den Flash-Button zu aktivieren.');
        resetFlashButton();
        return;
    }

    const manifest = {
        name: 'ESP Flash Tool',
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
    flashButton.disabled = false;
    flashButton.setAttribute('enabled', 'true');

    updateSummary({ firmware: firmwareName, variant: variantName, chip: chipFamily });
    setStatus('Bereit. Auf Connect klicken und danach den seriellen Port auswählen.');
});
