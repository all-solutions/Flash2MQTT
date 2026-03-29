const centralRepoBaseURL = 'https://all-solutions.github.io/Flash2MQTT/firmware';
let currentManifestUrl = null;

function resetFlashButton() {
    const flashButton = document.getElementById('flashButton');

    if (currentManifestUrl) {
        URL.revokeObjectURL(currentManifestUrl);
        currentManifestUrl = null;
    }

    flashButton.disabled = true;
    flashButton.manifest = '';
}

async function fetchFirmwareList() {
    const firmwareSelect = document.getElementById('firmwareSelect');

    // Abrufen der Firmware-Liste vom zentralen Repository
    try {
        const response = await fetch(`${centralRepoBaseURL}/firmware_list.json`);
        const firmwareList = await response.json();

        firmwareList.forEach(firmware => {
            const option = document.createElement('option');
            option.value = firmware.name;
            option.text = `${firmware.name} - Version ${firmware.version}`;
            firmwareSelect.add(option);
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Firmware-Liste:', err);
    }
}

fetchFirmwareList();

document.getElementById('firmwareSelect').addEventListener('change', async function () {
    const firmwareName = this.value;
    const variantSelect = document.getElementById('variantSelect');
    const variantLabel = document.querySelector('label[for="variantSelect"]');

    // Variante zurücksetzen
    variantSelect.style.display = 'none';
    variantLabel.style.display = 'none';
    variantSelect.innerHTML = '<option value="">Bitte Variante wählen</option>';
    resetFlashButton();

    if (!firmwareName) {
        return;
    }

    // Abrufen der Varianten für die ausgewählte Firmware
    try {
        const response = await fetch(`${centralRepoBaseURL}/${firmwareName}/variants.json`);
        const variants = await response.json();

        variants.forEach(variant => {
            const option = document.createElement('option');
            option.value = variant.file;
            option.dataset.chipFamily = variant.chipFamily || 'ESP8266';
            option.text = variant.displayName;
            variantSelect.add(option);
        });

        variantSelect.style.display = 'inline';
        variantLabel.style.display = 'inline';
    } catch (err) {
        console.error('Fehler beim Abrufen der Varianten:', err);
    }
});

document.getElementById('variantSelect').addEventListener('change', function () {
    const firmwareUrl = this.value;
    const selectedOption = this.options[this.selectedIndex];
    const chipFamily = selectedOption?.dataset.chipFamily || 'ESP8266';
    const flashButton = document.getElementById('flashButton');

    if (!firmwareUrl) {
        resetFlashButton();
        return;
    }

    const manifest = {
        "name": "ESP Flash Tool",
        "builds": [
            {
                "chipFamily": chipFamily,
                "parts": [
                    {
                        "path": firmwareUrl,
                        "offset": 0
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
});
