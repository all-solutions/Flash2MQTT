const repos = [
    'softwarecrash/Daly2MQTT',
    'softwarecrash/Solar2MQTT',
    'softwarecrash/EPEver2MQTT',
    'softwarecrash/Victron2MQTT',
    'softwarecrash/100Balance2MQTT'
];

async function fetchFirmwareList() {
    const firmwareSelect = document.getElementById('firmwareSelect');

    for (const repo of repos) {
        const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;

        try {
            const response = await fetch(apiUrl);
            const release = await response.json();

            const assets = release.assets.filter(asset => {
                return asset.name.includes('_d1_mini_') && !asset.name.includes('OTA');
            });

            assets.forEach(asset => {
                const option = document.createElement('option');
                option.value = asset.browser_download_url;
                option.text = `${repo.split('/')[1]} - ${asset.name}`;
                firmwareSelect.add(option);
            });
        } catch (err) {
            console.error(`Fehler beim Abrufen der Releases von ${repo}:`, err);
        }
    }
}

fetchFirmwareList();

async function createManifest() {
    const firmwareUrl = document.getElementById('firmwareSelect').value;
    if (!firmwareUrl) {
        alert('Bitte wählen Sie eine Firmware aus.');
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

    const installer = document.querySelector('esp-web-install-button');
    installer.manifest = manifestUrl;
    installer.disabled = false;
}

document.getElementById('firmwareSelect').addEventListener('change', createManifest);
