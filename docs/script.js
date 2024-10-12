const centralRepoBaseURL = 'https://all-solutions.github.io/Flash2MQTT/firmware';

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
    const flashButton = document.getElementById('flashButton');

    // Variante zurücksetzen
    variantSelect.style.display = 'none';
    variantSelect.innerHTML = '<option value="">Bitte Variante wählen</option>';
    flashButton.disabled = true;
    flashButton.manifest = '';

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
            option.text = variant.displayName;
            variantSelect.add(option);
        });

        variantSelect.style.display = 'inline';
        document.querySelector('label[for="variantSelect"]').style.display = 'inline';

    } catch (err) {
        console.error('Fehler beim Abrufen der Varianten:', err);
    }
});

document.getElementById('variantSelect').addEventListener('change', function () {
    const firmwareUrl = this.value;
    const flashButton = document.getElementById('flashButton');

    if (!firmwareUrl) {
        flashButton.disabled = true;
        flashButton.manifest = '';
        return;
    }

    const manifest = {
        "name": "ESP8266 Flash Tool",
        "builds": [
            {
                "chipFamily": "ESP8266",
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

    flashButton.manifest = manifestUrl;
    flashButton.disabled = false;
});

