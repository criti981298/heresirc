const form = document.querySelector<HTMLFormElement>('#brief-form');
const formStatus = document.querySelector<HTMLElement>('#form-status');
const result = document.querySelector<HTMLElement>('#brief-result');
const preview = document.querySelector<HTMLTextAreaElement>('#brief-preview');
const copyButton = document.querySelector<HTMLButtonElement>('#copy-brief');
const emailButton = document.querySelector<HTMLAnchorElement>('#email-brief');
if (form && result && preview && formStatus) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('nombre') || '').trim();
    const email = String(data.get('email') || '').trim();
    const paquete = String(data.get('paquete') || '').trim();
    const descripcion = String(data.get('descripcion') || '').trim();
    const message = `Hola, soy ${name}.\n\nMi correo: ${email}\nMe interesa: ${paquete}\n\nSobre mi proyecto:\n${descripcion}\n\nMe gustaría conocer una propuesta para mi sitio web.`;
    preview.value = message;
    result.hidden = false;
    formStatus.textContent = 'Resumen preparado. Todavía no se ha enviado ningún dato.';
    if (emailButton && form.dataset.email) {
      emailButton.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent('Nuevo proyecto web - HERESIRC')}&body=${encodeURIComponent(message)}`;
      emailButton.hidden = false;
    }
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
  });
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(preview.value);
      formStatus.textContent = 'Resumen copiado al portapapeles.';
    } catch (_) {
      preview.focus(); preview.select();
      formStatus.textContent = 'Selecciona y copia el texto del cuadro.';
    }
  });
}
