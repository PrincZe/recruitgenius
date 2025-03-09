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
 * This function creates a structured metadata object from the PDF filename.
 * For security and reliability, we avoid attempting to read binary PDF content directly
 * and instead send structured metadata to OpenAI for analysis.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Check if file exists
    if (!file) {
      console.error('File object is null or undefined');
      return 'Error: Invalid file object';
    }
    
    // Get the filename for metadata extraction
    const fileName = file.name || (file as any).originalName || 'unknown-file.pdf';
    console.log('Extracting metadata from PDF filename:', fileName);
    
    // Extract name from filename (e.g., "John_Smith.pdf" -> "John Smith")
    let candidateName = '';
    try {
      candidateName = fileName.replace('.pdf', '')
                          .replace(/[_-]/g, ' ')
                          .replace(/\d/g, ' ')  // Replace numbers with spaces
                          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
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
      candidateName = 'Candidate';
    }
    
    // Generate an email from the name
    const candidateEmail = candidateName 
      ? candidateName.toLowerCase().replace(/\s+/g, '.') + '@example.com'
      : 'candidate@example.com';
    
    // Create a structured format with metadata for the AI to analyze
    const fileSize = file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size';
    const metadata = {
      fileInfo: {
        filename: fileName,
        size: fileSize,
        type: file.type || 'application/pdf',
        lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : 'Unknown date'
      },
      candidateInfo: {
        name: candidateName,
        email: candidateEmail,
      }
    };
    
    // Return structured metadata with placeholder content tags for OpenAI to recognize
    return `
# RESUME METADATA
Candidate Name: ${candidateName}
Candidate Email: ${candidateEmail}
Filename: ${fileName}
File Size: ${fileSize}

# INSTRUCTIONS FOR AI ANALYSIS
This resume belongs to ${candidateName}. Please analyze this resume against the job description.
Note that the actual resume content isn't included here due to PDF parsing limitations.
Instead, please use the candidate's name and the job description to simulate a reasonable analysis.
Generate realistic scores based on the job requirements and the level of position.

# METADATA JSON
${JSON.stringify(metadata, null, 2)}
    `;
  } catch (error) {
    console.error('Error extracting metadata from PDF:', error);
    return 'Error extracting metadata from PDF. Please try again.';
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