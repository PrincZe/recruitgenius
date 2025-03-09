/**
 * PDF utility functions
 * 
 * This file contains utilities for working with PDF files, including text extraction.
 * In a production application, you would use a library like pdf.js to extract text directly.
 * For simplicity in this demo, we're using a placeholder approach.
 */

/**
 * Extract text from a PDF file
 * 
 * This function attempts to extract text from a PDF file.
 * For a hackathon, we'll use a simplified approach that tries to read the first 
 * few lines to at least extract a potential name and email.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Check if file exists
    if (!file) {
      console.error('File object is null or undefined');
      return 'Error: Invalid file object';
    }
    
    // Get the filename for logging
    const fileName = file.name || (file as any).originalName || 'unknown-file';
    console.log('Extracting text from PDF with filename:', fileName);
    
    // For hackathon: Try to extract candidate name from filename
    let candidateName = '';
    try {
      // Extract name from filename (e.g., "John_Smith.pdf" -> "John Smith")
      candidateName = fileName.replace('.pdf', '')
                             .replace(/[_-]/g, ' ')
                             .replace(/\d/g, '')  // Remove numbers
                             .trim();
      
      // If candidateName is in ALL CAPS, convert to Title Case
      if (candidateName === candidateName.toUpperCase()) {
        candidateName = candidateName.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      console.log('Extracted candidate name from filename:', candidateName);
    } catch (nameError) {
      console.warn('Could not extract name from filename:', nameError);
    }
    
    // Generate an email from the name
    const candidateEmail = candidateName 
      ? candidateName.toLowerCase().replace(/\s+/g, '.') + '@example.com'
      : 'candidate@example.com';
    
    // Try to read the file if it's a text-based PDF
    if (window.FileReader && file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
          try {
            const content = event.target?.result as string || '';
            
            // Return content and format with candidate name/email for the AI to use
            const extractedText = `
Name: ${candidateName}
Email: ${candidateEmail}

${content.substring(0, 2000)}...
            `;
            
            console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
            return resolve(extractedText);
          } catch (error) {
            console.error('Error reading PDF content:', error);
            // Fallback to basic info
            return resolve(`
Name: ${candidateName}
Email: ${candidateEmail}

This PDF could not be parsed for text content.
            `);
          }
        };
        
        reader.onerror = function() {
          console.error('Error reading file');
          resolve(`
Name: ${candidateName}
Email: ${candidateEmail}

This PDF could not be read.
          `);
        };
        
        // Read as text - may work for some PDFs, but not all
        reader.readAsText(file);
      });
    }
    
    // Fallback if FileReader is not available
    return `
Name: ${candidateName}
Email: ${candidateEmail}

Resume content could not be extracted. This is a fallback placeholder.
    `;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Error extracting text from PDF. Please try again.';
  }
};

/**
 * Convert PDF to an image for preview
 */
export const generatePdfPreview = async (file: File): Promise<string> => {
  // In a real application, you would use pdf.js to render the first page as an image
  // For this demo, we'll return a placeholder image
  return '/pdf-placeholder.svg';
}; 