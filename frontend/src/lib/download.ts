/**
 * Triggers an instant client-side download of the editor content as a UTF-8 .txt file.
 * No server roundtrip required.
 */
export function downloadTextLocally(content: string, filename = 'tempnote.txt'): void {
  // Ensure the blob is strictly UTF-8 text with no conversion
  const blob = new Blob([content], {
    type: 'text/plain;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
