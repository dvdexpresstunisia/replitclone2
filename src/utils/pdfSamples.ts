/**
 * Utility to generate valid, compliant PDF 1.4 documents in Base64 Data URL format.
 * Enables instant offline and online PDF viewing and testing without third-party dependencies.
 */

export function generateSimplePdfBase64(
  title: string,
  subtitle: string,
  sections: { heading: string; lines: string[] }[]
): string {
  // Build PDF text stream with font commands and coordinates
  let streamLines: string[] = [];
  streamLines.push("BT");
  streamLines.push("/F1 22 Tf");
  streamLines.push("50 730 Td");
  streamLines.push(`(${escapePdfText(title)}) Tj`);

  streamLines.push("/F1 12 Tf");
  streamLines.push("0 -28 Td");
  streamLines.push(`(${escapePdfText(subtitle)}) Tj`);

  let currentYOffset = -35;

  sections.forEach((section) => {
    streamLines.push("/F1 14 Tf");
    streamLines.push(`0 ${currentYOffset} Td`);
    streamLines.push(`(${escapePdfText(section.heading)}) Tj`);

    streamLines.push("/F1 10 Tf");
    section.lines.forEach((line) => {
      streamLines.push("0 -18 Td");
      streamLines.push(`(${escapePdfText(line)}) Tj`);
    });

    currentYOffset = -28;
  });

  streamLines.push("/F1 9 Tf");
  streamLines.push("0 -40 Td");
  streamLines.push("(Document officiel genere par RepliLite IDE - Support PDF natif & Diffusion visuelle) Tj");
  streamLines.push("ET");

  const streamContent = streamLines.join("\n");
  const streamByteLength = typeof TextEncoder !== "undefined"
    ? new TextEncoder().encode(streamContent).length
    : streamContent.length;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  function appendObj(obj: string) {
    offsets.push(pdf.length);
    pdf += obj + "\n";
  }

  appendObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  appendObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  appendObj(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`
  );
  appendObj(`4 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${streamContent}\nendstream\nendobj`);
  appendObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

  const xrefOffset = pdf.length;
  pdf += "xref\n0 6\n";
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    pdf += offsets[i].toString().padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // Encode to base64 cleanly in browser environment
  const bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(pdf) : new Uint8Array();
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary || pdf);
  return `data:application/pdf;base64,${base64}`;
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // replace accented characters for basic Type1 Helvetica compatibility
}

export const SAMPLE_ARCHITECTURE_PDF = generateSimplePdfBase64(
  "RepliLite - Guide d'Architecture & Specifications",
  "Documentation technique officielle du projet RepliLite IDE & Workspace IA",
  [
    {
      heading: "1. Architecture Globale du Projet",
      lines: [
        "- Editeur de code reactif multi-fichiers avec Prism.js et coloration syntaxique.",
        "- Terminal integre avec support d'execution en bac a sable Python 3 et JavaScript ES2024.",
        "- Double panneau interactif : Webview HTML5 Canvas et Ghostwriter IA.",
        "- Integration complete du support natif des fichiers PDF avec visionneuse et analyse IA.",
      ],
    },
    {
      heading: "2. Diffusion Visuelle & Audio Live (Gemini 3.8 Live)",
      lines: [
        "- Diffusion en direct du flux video d'ecran (Screen Share) ou webcam vers Gemini.",
        "- Capture automatique des trames a 1 FPS en format compresse JPEG ultra-haute fidelite.",
        "- Dialogue vocal bidirectionnel 16kHz/24kHz avec interruption naturelle de parole.",
        "- L'IA voit votre code source, vos erreurs de console et votre interface en direct.",
      ],
    },
    {
      heading: "3. Moteur Multimodal & Support PDF",
      lines: [
        "- Lecture des documents PDF via les modeles Gemini 3.8 Flash et Gemini 3.1 Pro.",
        "- Extraction automatique des sommaires, synthese des chapitres et generation de code associe.",
        "- Importation drag-and-drop de fichiers PDF personnels depuis l'explorateur de fichiers.",
      ],
    },
  ]
);

export const SAMPLE_PYTHON_CHEATSHEET_PDF = generateSimplePdfBase64(
  "Aide-Memoire Python & Data Science",
  "Synthese rapide des fonctions cles, types et bibliotheques pour RepliLite",
  [
    {
      heading: "1. Syntaxe de Base & Types",
      lines: [
        "- Listes : fruits = ['pomme', 'banane'] | fruits.append('orange')",
        "- Dictionnaires : config = {'host': 'localhost', 'port': 3000}",
        "- Comprehensions : carres = [x**2 for x in range(10) if x % 2 == 0]",
        "- Fonctions : def calculer(a, b=10): return a * b",
      ],
    },
    {
      heading: "2. Modules Integres dans RepliLite",
      lines: [
        "- math : sqrt, pi, sin, cos, ceil, floor, isqrt",
        "- random : randint, choice, shuffle, random",
        "- time : sleep, perf_counter, time",
      ],
    },
  ]
);
