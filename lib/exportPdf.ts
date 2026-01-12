import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  filename?: string;
  margin?: number;
  scale?: number;
  format?: 'a4' | 'letter';
}

/**
 * Export a HTML element to PDF
 * Note: For best results, use elements with inline styles (hex colors)
 * to avoid issues with unsupported CSS color functions like oklch() or lab()
 * 
 * @param element - The HTML element to export
 * @param options - Export options
 */
export async function exportToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    filename = 'CV.pdf',
    margin = 10,
    scale = 2,
    format = 'a4',
  } = options;

  // Get page dimensions based on format
  const pageWidth = format === 'a4' ? 210 : 216; // mm
  const pageHeight = format === 'a4' ? 297 : 279; // mm

  // Calculate content dimensions (in mm)
  const contentWidth = pageWidth - 2 * margin;

  try {
    // Capture the element as canvas with high quality
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Calculate dimensions for PDF
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: format,
    });

    // If content is taller than one page, we need to split it
    const pageContentHeight = pageHeight - 2 * margin;

    // Add image
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight / pageContentHeight);

    if (totalPages === 1) {
      // Single page - add image directly
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    } else {
      // Multiple pages - we need to slice the canvas
      const canvasPageHeight = (canvas.width * pageContentHeight) / contentWidth;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Create a new canvas for this page portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(
          canvasPageHeight,
          canvas.height - page * canvasPageHeight
        );

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          // Draw the portion of original canvas onto this page canvas
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            page * canvasPageHeight,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            canvas.width,
            pageCanvas.height
          );

          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          const pageImgHeight = (pageCanvas.height * contentWidth) / pageCanvas.width;
          
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
        }
      }
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw new Error('Không thể xuất PDF. Vui lòng thử lại.');
  }
}
