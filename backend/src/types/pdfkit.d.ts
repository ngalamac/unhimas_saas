declare module 'pdfkit' {
  // Minimal typing shim for development. Replace with @types/pdfkit if available.
  interface PDFKitOptions { [key: string]: any }
  class PDFDocument {
    constructor(options?: PDFKitOptions);
    pipe(dest: any): any;
    text(text: string, x?: number, y?: number, options?: any): this;
    end(): void;
    // Allow any other methods used in the codebase
    [key: string]: any;
  }
  export default PDFDocument;
}
