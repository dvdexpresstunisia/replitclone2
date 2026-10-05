import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Code,
  Copy,
  Check,
  AlertCircle,
  Eye,
  Layers,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { ProjectFile } from "../types";

interface PDFViewerProps {
  file: ProjectFile;
  onOpenInAIChat?: (prompt: string) => void;
  onTriggerGhostwriter?: (action: "explain" | "fix" | "optimize" | "tests") => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onOpenInAIChat,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showRawBase64, setShowRawBase64] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Generate safe blob URL for the PDF
  const blobUrl = useMemo(() => {
    try {
      let base64Data = file.content;
      if (base64Data.startsWith("data:application/pdf;base64,")) {
        base64Data = base64Data.replace("data:application/pdf;base64,", "");
      } else if (base64Data.startsWith("data:")) {
        const parts = base64Data.split(",");
        base64Data = parts[1] || "";
      }

      // Convert base64 to Uint8Array
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn("Failed to generate PDF blob URL:", err);
      return file.content.startsWith("data:") ? file.content : null;
    }
  }, [file.content]);

  // Clean up blob URL on unmount or file change
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Download PDF file
  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = blobUrl || file.content;
      link.download = file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Could not trigger PDF download", e);
    }
  };

  // Perform AI analysis on the PDF file
  const handleAnalyzeWithGemini = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setShowAiDrawer(true);

      const response = await fetch("/api/ai/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          content: file.content,
          language: "pdf",
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Erreur serveur ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data.summary || "Aucune analyse disponible pour ce document.");
    } catch (err: any) {
      console.error("Erreur lors de l'analyse du PDF :", err);
      setAnalysisError(err.message || "Impossible d'analyser le document PDF avec Gemini.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate file size display
  const fileSizeDisplay = useMemo(() => {
    const rawLen = file.content.length;
    const estBytes = rawLen > 100 ? (rawLen * 3) / 4 : rawLen;
    if (estBytes < 1024) return `${Math.round(estBytes)} o`;
    if (estBytes < 1024 * 1024) return `${(estBytes / 1024).toFixed(1)} Ko`;
    return `${(estBytes / (1024 * 1024)).toFixed(1)} Mo`;
  }, [file.content]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-gray-200 select-none overflow-hidden relative">
      {/* Top PDF Toolbar */}
      <div className="h-11 bg-[#161b24] border-b border-[#252d3d] px-3 flex items-center justify-between shrink-0 z-10">
        {/* Left: Document info */}
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-6 h-6 rounded bg-[#e5252a]/20 border border-[#e5252a]/40 flex items-center justify-center text-[#e5252a] font-bold text-xs shrink-0">
            PDF
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-xs text-white truncate">{file.name}</span>
            <span className="text-[10px] text-gray-400 bg-[#212838] px-1.5 py-0.5 rounded border border-[#2f394e]">
              {fileSizeDisplay}
            </span>
          </div>
        </div>

        {/* Center: Zoom controls */}
        <div className="hidden md:flex items-center gap-1 bg-[#121620] px-2 py-0.5 rounded-lg border border-[#232c3d]">
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
            title="Zoom arrière"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1f2736] transition cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-medium text-gray-300 min-w-10 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
            title="Zoom avant"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1f2736] transition cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            title="Réinitialiser le zoom (100%)"
            className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#1f2736] transition cursor-pointer ml-1"
          >
            100%
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Analyze with Gemini */}
          <button
            onClick={handleAnalyzeWithGemini}
            disabled={isAnalyzing}
            title="Analyser le contenu et la structure du document avec Google Gemini"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-700/60 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {isAnalyzing ? "Analyse en cours..." : "Analyser avec Gemini"}
            </span>
          </button>

          {/* Ask in Chat */}
          {onOpenInAIChat && (
            <button
              onClick={() =>
                onOpenInAIChat(
                  `J'ai ouvert le document PDF '${file.name}'. Peux-tu m'expliquer son contenu et me dire comment l'exploiter dans mon code ?`
                )
              }
              title="Discuter de ce PDF avec l'assistant IA"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-300 hover:text-white hover:bg-[#202737] border border-[#2b3548] transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Poser une question</span>
            </button>
          )}

          {/* Toggle Raw Data */}
          <button
            onClick={() => setShowRawBase64(!showRawBase64)}
            title={showRawBase64 ? "Retourner à la visionneuse PDF" : "Inspecter les données Base64 / Source"}
            className={`p-1.5 rounded text-xs transition border cursor-pointer ${
              showRawBase64
                ? "bg-[#252f42] text-white border-blue-500/50"
                : "text-gray-400 hover:text-white hover:bg-[#202737] border-transparent"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownload}
            title="Télécharger le fichier PDF sur votre ordinateur"
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-gray-200 hover:text-white bg-[#1a212e] hover:bg-[#242e40] border border-[#2d384c] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Télécharger</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (Viewer + Optional AI Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Frame / Render Container */}
        <div className="flex-1 h-full bg-[#11151f] flex flex-col items-center justify-center p-2 overflow-auto relative">
          {showRawBase64 ? (
            <div className="w-full h-full flex flex-col bg-[#0b0e14] rounded-lg border border-[#212938] overflow-hidden p-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1c2433] mb-2 text-gray-400">
                <span className="text-[11px] font-semibold text-gray-300">
                  Données brutes PDF (Data URL / Base64)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(file.content);
                    setCopiedRaw(true);
                    setTimeout(() => setCopiedRaw(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#18202d] hover:bg-[#212b3d] text-gray-300 hover:text-white transition"
                >
                  {copiedRaw ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRaw ? "Copié !" : "Copier Base64"}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={file.content}
                className="flex-1 bg-transparent text-gray-300 text-[11px] font-mono resize-none focus:outline-none overflow-auto"
              />
            </div>
          ) : blobUrl ? (
            <div
              style={{
                width: `${zoomLevel}%`,
                height: "100%",
                maxWidth: zoomLevel === 100 ? "100%" : "none",
                transition: "width 0.15s ease",
              }}
              className="flex-1 h-full w-full rounded-lg overflow-hidden border border-[#232b3c] shadow-2xl relative bg-[#1c212c]"
            >
              <iframe
                src={`${blobUrl}#view=FitH`}
                title={`Visionneuse PDF - ${file.name}`}
                className="w-full h-full border-0 rounded-lg bg-white"
              />

              {/* Watermark badge */}
              <div className="absolute bottom-3 right-3 pointer-events-none bg-[#111622]/90 backdrop-blur-xs border border-[#2a3449] px-2.5 py-1 rounded-md text-[10px] text-gray-400 flex items-center gap-1.5 shadow-md">
                <BookOpen className="w-3 h-3 text-[#e5252a]" />
                <span>Visionneuse PDF RepliLite</span>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 max-w-md bg-[#161c28] border border-[#2a3449] rounded-xl text-gray-300">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h4 className="font-bold text-sm mb-1">Aperçu direct indisponible</h4>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Le document PDF n'a pas pu être prévisualisé directement dans le navigateur, mais vous
                pouvez le télécharger ou l'analyser directement avec Gemini.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger {file.name}</span>
                </button>
                <button
                  onClick={handleAnalyzeWithGemini}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyser avec Gemini</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Drawer (collapsible on the right) */}
        {showAiDrawer && (
          <div className="w-80 md:w-96 bg-[#131823] border-l border-[#242d3e] flex flex-col h-full z-20 shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3 bg-[#171d2b] border-b border-[#242d3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-900/60 border border-purple-700/60 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Analyse IA du Document</h4>
                  <p className="text-[10px] text-gray-400">Google Gemini 3.8 Multimodal</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiDrawer(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#232c3e] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed space-y-3 font-sans">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <p className="text-gray-300 font-medium text-xs">
                    Lecture et analyse multimodale du PDF en cours...
                  </p>
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Gemini extrait les sections clés, les thématiques et les points d'architecture.
                  </p>
                </div>
              ) : analysisError ? (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Erreur d'analyse</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{analysisError}</p>
                  <button
                    onClick={handleAnalyzeWithGemini}
                    className="mt-2.5 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white text-[11px] font-semibold transition"
                  >
                    Réessayer
                  </button>
                </div>
              ) : analysisResult ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#0e131d] border border-[#212b3c] text-gray-300 whitespace-pre-wrap leading-relaxed text-[11.5px]">
                    {analysisResult}
                  </div>

                  {onOpenInAIChat && (
                    <button
                      onClick={() =>
                        onOpenInAIChat(
                          `À partir de l'analyse du PDF '${file.name}', propose une implémentation de code concrète.`
                        )
                      }
                      className="w-full mt-2 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Générer du code depuis cette spécification</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Cliquez sur "Analyser avec Gemini" pour obtenir une synthèse instantanée de ce PDF.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
