export function generateStaticParams() {
  // For static export, we'll pre-render the demo recording page
  return [
    { id: 'demo-recording' }
  ];
} 