import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, Loader2 } from 'lucide-react';

// Configure worker using official CDN matching exactly the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Helper utility to format raw byte count into clean strings (e.g. "12.4 MB")
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Modern PDF Upload & Preview Card (ChatGPT / Gemini / Google Drive inspired)
 * Features a pristine Red Folded-Corner PDF badge with real-time page count extraction via pdfjs-dist.
 * Includes an interactive floating high-resolution hover preview of Page 1!
 */
const PdfPreviewCard = ({
  file,
  onRemove,
  onClick,
  className = ''
}) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Abort controller ref for clean unmounting & memory cleanup
  const abortControllerRef = useRef(null);

  // Extract underlying raw file resource or URL
  const targetResource = useMemo(() => {
    if (file instanceof File || (typeof File !== 'undefined' && file?.constructor?.name === 'File')) {
      return file;
    }
    return file?.file || file?.fileUrl || null;
  }, [file]);

  useEffect(() => {
    const name = file?.fileName || file?.name || 'Document.pdf';
    const size = file?.fileSize || file?.size || 0;
    setFileName(name);
    setFileSizeStr(formatFileSize(size));

    setLoading(true);
    setThumbnail(null);
    setPageCount(null);

    if (!targetResource) {
      setLoading(false);
      return;
    }

    let pdfDoc = null;
    let isMounted = true;
    abortControllerRef.current = new AbortController();

    const generatePdfPreview = async () => {
      try {
        let loadingTask;

        if (typeof targetResource === 'object' && typeof targetResource.arrayBuffer === 'function') {
          const buffer = await targetResource.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: buffer });
        } else if (typeof targetResource === 'string') {
          loadingTask = pdfjsLib.getDocument(targetResource);
        } else {
          setLoading(false);
          return;
        }

        pdfDoc = await loadingTask.promise;
        if (!isMounted) return;

        const totalPages = pdfDoc.numPages;
        setPageCount(totalPages);

        // Fetch ONLY page 1 for immediate memory-efficient rendering
        const firstPage = await pdfDoc.getPage(1);
        if (!isMounted) return;

        // Render at high DPI scale for razor-sharp floating tooltip preview
        const viewport = firstPage.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await firstPage.render({ canvasContext: context, viewport: viewport }).promise;
        if (!isMounted) return;

        const imageUrl = canvas.toDataURL('image/png', 0.95);
        setThumbnail(imageUrl);
        setLoading(false);

        canvas.width = 0;
        canvas.height = 0;
      } catch (err) {
        console.error('⚠️ PDF thumbnail extraction note:', err.message);
        if (isMounted) {
          setLoading(false);
        }
      } finally {
        if (pdfDoc && typeof pdfDoc.destroy === 'function') {
          pdfDoc.destroy().catch(() => {});
        }
      }
    };

    generatePdfPreview();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pdfDoc && typeof pdfDoc.destroy === 'function') {
        pdfDoc.destroy().catch(() => {});
      }
    };
  }, [targetResource]);

  return (
    <div
      onClick={() => onClick && onClick(file)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-[14px] bg-[#1a1c23]/95 hover:bg-[#20232c] dark:bg-[#16181d]/95 dark:hover:bg-[#1c1f26] border border-white/[0.08] hover:border-white/[0.15] shadow-md min-w-[180px] max-w-[260px] w-full transition-all duration-200 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Floating Large Page 1 Tooltip Preview on Hover */}
      {thumbnail && isHovered && (
        <div className="absolute left-0 bottom-full mb-2 z-50 p-1.5 rounded-2xl bg-[#121419]/95 border border-white/15 shadow-2xl backdrop-blur-xl w-40 h-52 flex flex-col items-center pointer-events-none transition-all duration-200">
          <div className="w-full flex-1 rounded-xl overflow-hidden bg-white border border-slate-700 shadow-inner flex items-center justify-center">
            <img
              src={thumbnail}
              alt="Page 1 Preview"
              className="w-full h-full object-contain bg-white"
            />
          </div>
          <span className="text-[9px] font-extrabold text-slate-300 mt-1 tracking-wider uppercase">
            Page 1 Preview
          </span>
        </div>
      )}

      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Compact Solid Red Folded-Corner PDF Badge */}
        <div className="relative w-[32px] h-[38px] rounded-[9px] bg-gradient-to-b from-[#ff385c] via-[#f3203f] to-[#d81130] flex flex-col items-center justify-center shrink-0 shadow-md border border-red-400/30 group-hover:scale-[1.03] transition-transform duration-200">
          {/* Authentic folded upper-right paper ear */}
          <div className="absolute top-0 right-0 w-[10px] h-[10px] bg-[#8f051c]/90 rounded-bl-[4px] border-l border-b border-white/30 shadow-sm" />
          
          {loading ? (
            <Loader2 size={13} className="animate-spin text-white mb-0.5" />
          ) : (
            <span className="text-[8.5px] font-black uppercase tracking-wider text-white drop-shadow-sm mt-0.5">
              PDF
            </span>
          )}
        </div>

        {/* File Name & Size Details */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span
            className="text-xs font-bold text-slate-100 truncate tracking-tight leading-snug group-hover:text-white transition-colors"
            title={fileName}
          >
            {fileName}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 mt-0.5">
            <span>{fileSizeStr}</span>
            {pageCount && (
              <>
                <span className="text-slate-600 font-bold">•</span>
                <span className="text-slate-300 font-semibold">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </span>
              </>
            )}
            {loading && (
              <>
                <span className="text-slate-600 font-bold">•</span>
                <span className="text-slate-400 italic text-[9px] animate-pulse">reading...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Remove (X) Button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file?.fileId || file?.fileName || file?.name);
          }}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-95 rounded-full transition-all cursor-pointer shrink-0 ml-0.5"
          title="Remove file"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};

export default PdfPreviewCard;
