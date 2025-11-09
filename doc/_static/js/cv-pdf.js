document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cv-pdf");
  if (!container || typeof pdfjsLib === "undefined") {
    return;
  }

  const pdfUrl = container.dataset.pdf;
  if (!pdfUrl) {
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";

  const renderPage = (pdfDocument, pageNumber) => {
    pdfDocument.getPage(pageNumber).then((page) => {
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      container.appendChild(canvas);

      page
        .render({ canvasContext: context, viewport })
        .promise.then(() => {
          if (pageNumber < pdfDocument.numPages) {
            renderPage(pdfDocument, pageNumber + 1);
          }
        })
        .catch((error) => {
          console.error("Error rendering page", error);
        });
    });
  };

  pdfjsLib
    .getDocument(pdfUrl)
    .promise.then((pdfDocument) => {
      renderPage(pdfDocument, 1);
    })
    .catch((error) => {
      console.error("Error loading PDF", error);
    });
});
