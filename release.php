<?php

// Pfad zu den JSON-Dateien
$firmwareListPath = __DIR__ . '/firmware/firmware_list.json';

// Lade die firmware_list.json
$firmwareListData = json_decode(file_get_contents($firmwareListPath), true);
if ($firmwareListData === null) {
    die("Fehler beim Laden der firmware_list.json");
}

$releaseData = ["release" => []];

// Verarbeite jedes Firmware-Element aus firmware_list.json
foreach ($firmwareListData as $firmware) {
    $name = $firmware['name'];
    $version = $firmware['version'];
    $variantsPath = __DIR__ . "/firmware/$name/variants.json";

    // Lade die variants.json
    $variantsData = json_decode(file_get_contents($variantsPath), true);
    if ($variantsData === null) {
        continue; // Überspringe, falls die variants.json nicht geladen werden kann
    }

    // Verarbeite jede Variante in variants.json
    foreach ($variantsData as $variant) {
        $displayName = $variant['displayName'];
        $file = $variant['file'];

        // Erstelle den Eintrag für diese Variante
        $releaseData['release'][] = [
            "binary" => "$name$displayName$version",
            "otaurl" => $file,
        ];
    }
}

// Setze Header und gib die JSON-Daten aus
header('Content-Type: application/json');
echo json_encode($releaseData, JSON_PRETTY_PRINT);

