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

function updateSummary({ firmware = 'Not selected', variant = 'Not selected', chip = 'Unknown' } = {}) {
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
    variantSelect.innerHTML = '<option value="">Please select a variant</option>';
    variantGroup.classList.remove('is-visible');
    updateSummary({ variant: 'Not selected', chip: 'Unknown' });
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
        setStatus('Unable to load firmware list right now.');
    }
}

fetchFirmwareList();

document.getElementById('firmwareSelect').addEventListener('change', async function () {
    const firmwareName = this.value;
    const { variantSelect, variantGroup } = elements();

    resetVariantSelection();

    if (!firmwareName) {
        updateSummary({ firmware: 'Not selected' });
        setStatus('Select a firmware to load available variants.');
        return;
    }

    updateSummary({ firmware: firmwareName });
    setStatus('Loading variants for the selected firmware...');

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
        setStatus('Select a hardware variant to generate the flashing manifest.');

        const preselectVariant = getURLParameter('variant');
        if (preselectVariant) {
            variantSelect.value = preselectVariant;
            variantSelect.dispatchEvent(new Event('change'));
        }
    } catch (err) {
        console.error('Fehler beim Abrufen der Varianten:', err);
        setStatus('Variants could not be loaded for the selected firmware.');
    }
});

document.getElementById('variantSelect').addEventListener('change', function () {
    const firmwareUrl = this.value;
    const { firmwareSelect, flashButton } = elements();
    const firmwareName = firmwareSelect.options[firmwareSelect.selectedIndex].value;
    const selectedOption = this.options[this.selectedIndex];
    const chipFamily = selectedOption?.dataset.chipFamily || 'ESP8266';
    const variantName = selectedOption?.text || 'Not selected';

    if (!firmwareUrl) {
        updateSummary({ firmware: firmwareName || 'Not selected', variant: 'Not selected', chip: 'Unknown' });
        setStatus('Select a hardware variant to enable flashing.');
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
    flashButton.disabled = false;
    flashButton.setAttribute('enabled', 'true');

    updateSummary({ firmware: firmwareName, variant: variantName, chip: chipFamily });
    setStatus('Ready. Press Connect and choose the serial port for your device.');
});
