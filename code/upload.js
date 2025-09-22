const formUpload = document.getElementById('formUpload');
const previewSection = document.getElementById('previewSection');
const filePreview = document.getElementById('filePreview');
const btnConfirm = document.getElementById('btnConfirm');

let previewData = [];

formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formUpload);

    filePreview.innerHTML = "Procesando...";
    previewSection.style.display = "block";

    try {
        const res = await fetch('/procesar', { method: 'POST', body: formData });
        const data = await res.json();

        previewData = data.archivos_preview || [];
        filePreview.innerHTML = '';

        previewData.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `CURP: ${item.curp} | Correo: ${item.correo}`;
            filePreview.appendChild(li);
        });

    } catch (err) {
        filePreview.textContent = "Error: " + err;
        console.error(err);
    }
});

btnConfirm.addEventListener('click', async () => {
    if (previewData.length === 0) return;

    try {
        const res = await fetch('/enviar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                archivos: previewData.map(a => a.nombre),
            })
        });
        const data = await res.json();
        alert(data.mensaje || "Correo enviado");
    } catch (err) {
        alert("Error enviando correos: " + err);
        console.error(err);
    }
});
