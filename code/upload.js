const formUpload = document.getElementById('formUpload');
const previewSection = document.getElementById('previewSection');
const filePreview = document.getElementById('filePreview');
const btnConfirm = document.getElementById('btnConfirm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let previewData = [];

function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    toast.classList.toggle('error', isError);
    toast.classList.toggle('success', !isError);

    const timeout = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 5000);

    toastClose.onclick = () => {
        clearTimeout(timeout);
        toast.classList.remove('show');
        toast.classList.add('hidden');
    };
}

formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formUpload);

    filePreview.innerHTML = "Procesando...";
    previewSection.style.display = "block";

    try {
        const res = await fetch('/procesar', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.mensaje || `Error procesando el archivo (estado ${res.status})`);
        }
        const data = await res.json();

        previewData = data.archivos_preview || [];
        renderPreview();
    } catch (err) {
        filePreview.textContent = `Error: ${err.message}`;
        showToast(`Error: ${err.message}`, true);
        console.error("Error en /procesar:", err);
    }
});

function renderPreview() {
    filePreview.innerHTML = '';
    previewData.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'file-item';
        const fileLink = item.preview
            ? `<a href="${item.preview}" target="_blank">${item.nombre}</a>`
            : `<span>${item.nombre}</span>`;
        li.innerHTML = `
            ${fileLink}
            <span>CURP: ${item.curp}</span>
            <span>Correo: ${item.correo}</span>
            <button class="remove-btn" data-index="${index}"><i class="fas fa-times"></i></button>
        `;
        filePreview.appendChild(li);
    });

    document.querySelectorAll('.remove-btn').forEach((button) => {
        button.addEventListener('click', (e) => {
            const index = e.target.closest('button').dataset.index;
            previewData.splice(index, 1);
            renderPreview();
        });
    });
}

btnConfirm.addEventListener('click', async () => {
    if (previewData.length === 0) {
        showToast('No hay archivos para enviar', true);
        return;
    }

    try {
        const res = await fetch('/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                archivos: previewData.map((a) => a.nombre),
            }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.mensaje || `Error enviando correos (estado ${res.status})`);
        }
        const data = await res.json();
        showToast(data.mensaje || 'Correos enviados correctamente', false);
        previewData = [];
        filePreview.innerHTML = '';
        previewSection.style.display = 'none';
    } catch (err) {
        console.error("Error en /enviar:", err);
        showToast(`Error enviando correos: ${err.message}`, true);
    }
});