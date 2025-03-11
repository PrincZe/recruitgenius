/**
 * PDF utility functions
 * 
 * This file contains utilities for working with PDF files, including text extraction.
 * Uses PDF.js to extract actual text content from uploaded PDF files.
 */

import * as pdfjs from 'pdfjs-dist';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';

// Set the worker source path
// In a production environment, consider hosting this worker file yourself
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

/**
 * Extract text from a PDF file
 * 
 * This function extracts the actual text content from a PDF file using PDF.js.
 * It handles arrayBuffer conversion, page iteration, and text content extraction.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Check if file exists
    if (!file) {
      console.error('File object is null or undefined');
      return 'Error: Invalid file object';
    }

    console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);
    
    // Convert file to ArrayBuffer for PDF.js
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document using PDF.js
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    console.log(`Extracted ${fullText.length} characters of text from PDF`);
    
    // Extract candidate name from filename as fallback if text extraction fails
    let candidateName = '';
    try {
      candidateName = file.name.replace('.pdf', '')
                        .replace(/[_-]/g, ' ')
                        .replace(/\d/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
      
      // If candidateName is in ALL CAPS, convert to Title Case
      if (candidateName === candidateName.toUpperCase()) {
        candidateName = candidateName.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    } catch (nameError) {
      console.warn('Could not extract name from filename:', nameError);
      candidateName = 'Candidate';
    }
    
    // If text extraction failed or returned very little text, use metadata approach as fallback
    if (fullText.length < 50) {
      console.warn('PDF text extraction yielded insufficient text. Using fallback approach.');
      
      // Generate an email from the name (fallback)
      const candidateEmail = candidateName 
        ? candidateName.toLowerCase().replace(/\s+/g, '.') + '@example.com'
        : 'candidate@example.com';
      
      return `
# RESUME METADATA (FALLBACK - PDF TEXT EXTRACTION FAILED)
Candidate Name: ${candidateName}
Candidate Email: ${candidateEmail}
Filename: ${file.name}
File Size: ${Math.round(file.size / 1024)} KB

# WARNING: ACTUAL PDF TEXT EXTRACTION FAILED
The system was unable to extract sufficient text from this PDF. 
This may be due to the PDF being scanned, image-based, or having security restrictions.
      `;
    }
    
    // Return the actual extracted text with some metadata
    return `
# RESUME TEXT FOR ${candidateName}
Filename: ${file.name}
File Size: ${Math.round(file.size / 1024)} KB
Pages: ${pdf.numPages}

# EXTRACTED TEXT CONTENT
${fullText}
    `;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return `Error extracting text from PDF: ${error instanceof Error ? error.message : String(error)}. Please try again.`;
  }
};

/**
 * Convert PDF to an image for preview
 */
export const generatePdfPreview = async (file: File): Promise<string> => {
  try {
    // Convert file to ArrayBuffer for PDF.js
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document using PDF.js
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Create a canvas to render the page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set the dimensions
    const viewport = page.getViewport({ scale: 0.5 }); // Scale to make it smaller
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render the page to the canvas
    await page.render({ canvasContext: context as any, viewport }).promise;
    
    // Convert the canvas to a data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    // Return a placeholder image on error
    return '/pdf-placeholder.svg';
  }
}; 