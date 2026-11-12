// Carga los paquetes de la raíz de composición. El cableado real empieza en la Fase 1.
import "@cv-tailor/adapter-ai";
import "@cv-tailor/adapter-cv-template";
import "@cv-tailor/adapter-pdf-reader";
import "@cv-tailor/adapter-pdf-renderer";
import "@cv-tailor/adapter-persistence";
import "@cv-tailor/application";

export function compose(): void {
  // Los casos de uso se conectan con los adaptadores a partir de la Fase 1.
}
