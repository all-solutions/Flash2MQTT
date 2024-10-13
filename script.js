const centralRepoBaseURL = 'https://all-solutions.github.io/Flash2MQTT/firmware';

// Function to parse URL parameters
function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function fetchFirmwareList() {
    const firmwareSelect = document.getElementById('firmwareSelect');

    // Fetch the firmware list from the central repository
    try {
        const response = await fetch(`${centralRepoBaseURL}/firmware_list.json`);
        const firmwareList = await response.json();

        firmwareList.forEach(firmware => {
            const option = document.createElement('option');
            option.value = firmware.name;
            option.text = `${firmware.name} - Version ${firmware.version}`;
            firmwareSelect.add(option);
        });

        // Check if a 'get' parameter is present
        const preselectFirmware = getURLParameter('get');
        if (preselectFirmware) {
            firmwareSelect.value = preselectFirmware;
            // Manually trigger change event
            firmwareSelect.dispatchEvent(new Event('change'));
        }
    } catch (err) {
        console.error('Error fetching firmware list:', err);
    }
}

fetchFirmwareList();

document.getElementById('firmwareSelect').addEventListener('change', async function () {
    const firmwareName = this.value;
    const variantSelect = document.getElementById('variantSelect');
    const flashButton = document.getElementById('flashButton');
    const variantLabel = document.querySelector('label[for="variantSelect"]');

    // Reset variant
    variantSelect.style.display = 'none';
    variantLabel.style.display = 'none';
    variantSelect.innerHTML = '<option value="">Please select a variant</option>';
    flashButton.disabled = true;
    flashButton.removeAttribute('enabled');
    flashButton.manifest = '';

    if (!firmwareName) {
        return;
    }

    // Fetch variants for the selected firmware
    try {
        const response = await fetch(`${centralRepoBaseURL}/${firmwareName}/variants.json`);
        const variants = await response.json();

        variants.forEach(variant => {
            const option = document.createElement('option');
            option.value = variant.file;
            option.text = variant.displayName;
            variantSelect.add(option);
        });

        variantSelect.style.display = 'block';
        variantLabel.style.display = 'block';

        // Check if a 'variant' parameter is present
        const preselectVariant = getURLParameter('variant');
        if (preselectVariant) {
            variantSelect.value = preselectVariant;
            variantSelect.dispatchEvent(new Event('change'));
        }

    } catch (err) {
        console.error('Error fetching variants:', err);
    }
});

document.getElementById('variantSelect').addEventListener('change', function () {
    const firmwareUrl = this.value;
    const flashButton = document.getElementById('flashButton');

    if (!firmwareUrl) {
        flashButton.disabled = true;
        flashButton.removeAttribute('enabled');
        flashButton.manifest = '';
        return;
    }

    const manifest = {
        "name": "*2MQTT Firmware",
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
    flashButton.setAttribute('enabled', 'true');
});
