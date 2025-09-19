import { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  X,
  Loader2
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface UserDocument {
  id: number;
  type: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

interface DocumentViewerProps {
  document: UserDocument;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reset state when document changes or modal opens
  useEffect(() => {
    if (isOpen && document) {
      setPageNumber(1);
      setScale(1.0);
      setRotation(0);
      setLoadError(null);
      
      // Set initial loading state based on document type
      const isPDF = document.mimeType?.includes('pdf') || document.fileName.toLowerCase().endsWith('.pdf');
      setIsLoading(isPDF); // Only show loading for PDFs, images will handle their own loading
    }
  }, [document, isOpen]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setLoadError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setLoadError('Failed to load PDF document');
    setIsLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const downloadDocument = useCallback(() => {
    window.open(document.filePath, '_blank');
  }, [document.filePath]);

  const resetView = useCallback(() => {
    setPageNumber(1);
    setScale(1.0);
    setRotation(0);
  }, []);

  // Check if document is a PDF
  const isPDF = document.mimeType?.includes('pdf') || document.fileName.toLowerCase().endsWith('.pdf');

  // Check if document is an image
  const isImage = document.mimeType?.includes('image') || 
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(document.fileName);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col" data-testid="document-viewer-modal">
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold truncate pr-4" data-testid="document-title">
                {document.fileName}
              </DialogTitle>
              <div className="flex items-center space-x-4 mt-1">
                <Badge variant="secondary" className="text-xs" data-testid="document-size">
                  {formatFileSize(document.fileSize)}
                </Badge>
                <Badge variant="outline" className="text-xs" data-testid="document-date">
                  {new Date(document.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar for PDF controls */}
        {isPDF && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm" data-testid="text-page-info">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={zoomOut} data-testid="button-zoom-out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm" data-testid="text-zoom-level">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="sm" onClick={zoomIn} data-testid="button-zoom-in">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={rotate} data-testid="button-rotate">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadDocument} data-testid="button-download">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Document content */}
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg flex items-center justify-center p-1">
          {isLoading && (
            <div className="flex items-center space-x-2" data-testid="loading-indicator">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading document...</span>
            </div>
          )}

          {loadError && (
            <div className="text-center space-y-4" data-testid="error-message">
              <p className="text-red-600">{loadError}</p>
              <Button onClick={downloadDocument} data-testid="button-download-error">
                Download to view externally
              </Button>
            </div>
          )}

          {!loadError && isPDF && (
            <div className="bg-white shadow-lg" data-testid="pdf-content">
              <Document
                file={document.filePath}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="p-4">Loading PDF...</div>}
                error={<div className="p-4 text-red-600">Failed to load PDF</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          )}

          {!loadError && isImage && (
            <div className="max-w-full max-h-full flex items-center justify-center" data-testid="image-content">
              {isLoading && <div className="flex items-center space-x-2"><Loader2 className="w-6 h-6 animate-spin" /><span>Loading image...</span></div>}
              <img
                src={document.filePath}
                alt={document.fileName}
                className={`max-w-full max-h-full object-contain shadow-lg rounded ${isLoading ? 'hidden' : ''}`}
                style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setLoadError('Failed to load image');
                  setIsLoading(false);
                }}
              />
            </div>
          )}

          {!loadError && !isPDF && !isImage && (
            <div className="text-center space-y-4" data-testid="unsupported-format">
              <p className="text-gray-600">Preview not available for this file type</p>
              <Button onClick={downloadDocument} data-testid="button-download-unsupported">
                Download to view
              </Button>
            </div>
          )}
        </div>

        {/* Bottom controls for images and PDFs */}
        {(isPDF || isImage) && (
          <div className="flex items-center justify-center space-x-2 mt-4 flex-shrink-0">
            {!isPDF && (
              <>
                <Button variant="outline" size="sm" onClick={zoomOut} data-testid="button-zoom-out-image">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm" data-testid="text-zoom-level-image">{Math.round(scale * 100)}%</span>
                <Button variant="outline" size="sm" onClick={zoomIn} data-testid="button-zoom-in-image">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={rotate} data-testid="button-rotate-image">
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={resetView} data-testid="button-reset-view">
              Reset View
            </Button>
            {!isPDF && (
              <Button variant="outline" size="sm" onClick={downloadDocument} data-testid="button-download-image">
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}