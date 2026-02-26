declare module "pdfmake/build/pdfmake" {
  export interface PdfMakeCreation {
    download: (fileName?: string) => Promise<void>;
    open: () => Promise<void>;
    getBlob: () => Promise<Blob>;
    getBuffer: () => Promise<Uint8Array>;
  }

  export interface PdfMakeStatic {
    fonts: Record<string, Record<string, string>>;
    addVirtualFileSystem: (vfs: Record<string, string>) => void;
    addFonts: (fonts: Record<string, Record<string, string>>) => void;
    createPdf: (docDefinition: unknown) => PdfMakeCreation;
  }

  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>;
  export default vfs;
}
