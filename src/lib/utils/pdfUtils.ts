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
 * In a real application, you would:
 * 1. Use pdf.js to parse the PDF
 * 2. Extract text from each page
 * 3. Handle various PDF formats and structures
 * 
 * For this demo, we're using a simplified approach
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // In a real application, we would use pdf.js to extract text
    // For this demo, we'll return a placeholder message
    
    // Simulating a slight delay to mimick processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if file and file.name exist before proceeding
    if (!file || !file.name) {
      console.error('Invalid file object or missing filename');
      return 'Error: Invalid file or missing filename';
    }
    
    // For demo purposes, return some dummy text based on the file name
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('engineer') || fileName.includes('developer')) {
      return `
        John Doe
        Senior Software Engineer
        john.doe@example.com | (555) 123-4567

        Summary:
        Experienced engineering manager with 8+ years leading development teams and delivering complex software products. 
        Strong technical background in full-stack development, cloud architecture, and agile methodologies.

        Experience:
        Engineering Manager - Tech Company Inc. (2019-Present)
        • Led a team of 12 engineers across frontend, backend, and DevOps
        • Improved deployment frequency by 300% while reducing bugs by implementing CI/CD
        • Mentored junior engineers and implemented career growth frameworks
        • Collaborated with product managers to prioritize and deliver key features

        Senior Software Engineer - Software Corp (2015-2019)
        • Technical lead for customer-facing applications
        • Architected and built microservices infrastructure
        • Reduced API response times by 40% through optimization
        • Onboarded and mentored 5 new team members

        Education:
        Bachelor of Science in Computer Science - Tech University (2015)

        Skills:
        • Leadership: Team management, mentoring, performance reviews
        • Technical: JavaScript/TypeScript, React, Node.js, AWS, Python
        • Process: Agile methodologies, CI/CD, code reviews
        • Soft skills: Communication, stakeholder management, cross-team collaboration
      `;
    } else if (fileName.includes('manager') || fileName.includes('lead')) {
      return `
        Jane Smith
        Engineering Manager
        jane.smith@example.com | (555) 987-6543

        Professional Summary:
        Results-driven engineering manager with 10+ years of experience leading technical teams and delivering high-impact software solutions. 
        Expertise in team leadership, project management, and technical architecture. 
        Passionate about building inclusive teams and developing engineering talent.

        Professional Experience:
        Engineering Director - Enterprise Solutions Inc. (2021-Present)
        • Direct and mentor a division of 25 engineers across 3 teams
        • Implemented strategic roadmap resulting in 45% revenue growth
        • Overhauled hiring process improving retention by 35%
        • Established engineering principles and best practices

        Engineering Manager - Tech Innovations LLC (2017-2021)
        • Managed team of 10 full-stack engineers
        • Delivered 4 major product releases ahead of schedule
        • Reduced technical debt by 30% through strategic refactoring
        • Improved team velocity by 25% through process improvements

        Senior Software Engineer - Code Solutions (2013-2017)
        • Led development of core platform features
        • Mentored junior developers and conducted technical interviews
        • Implemented automated testing reducing bugs by 40%

        Education & Certifications:
        • Master's in Computer Science - University of Technology
        • Certified Scrum Master (CSM)
        • AWS Solutions Architect Associate

        Technical Skills:
        • Programming: Java, Python, JavaScript, TypeScript
        • Frameworks: Spring Boot, React, Angular
        • Cloud: AWS, Azure, Kubernetes, Docker
        • Tools: JIRA, Confluence, GitHub, Jenkins

        Leadership Skills:
        • Team building and mentorship
        • Strategic planning and execution
        • Performance management
        • Cross-functional collaboration
        • Project and resource planning
      `;
    } else {
      return `
        Alex Johnson
        Software Professional
        alex.johnson@example.com | (555) 555-5555

        Professional Summary:
        Versatile technology professional with experience in software development and technical leadership.
        Strong problem-solving skills and ability to adapt to changing requirements.
        Effective communicator with a track record of successful project delivery.

        Work Experience:
        Technical Lead - Software Company (2018-Present)
        • Coordinated development activities for a team of 8 engineers
        • Implemented new technical practices improving code quality
        • Collaborated with product team to define requirements
        • Delivered multiple successful projects on schedule

        Developer - Tech Startup (2015-2018)
        • Contributed to core product development
        • Built features used by thousands of customers
        • Participated in code reviews and technical planning

        Education:
        • Bachelor's Degree in Information Technology

        Skills:
        • Software Development
        • Team Leadership
        • Project Management
        • Communication
        • Problem Solving
      `;
    }
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