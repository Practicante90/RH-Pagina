const tbody = document.getElementById('calificaciones-body');
const modal = document.getElementById('modalEditarCalificacion');
const spanClose = modal.querySelector('.close');
const formEditar = document.getElementById('formEditarCalificacion');
const selectProgramacion = document.getElementById('programacion_select');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

const apiCalificaciones = "http://192.168.0.115:3001/api/calificaciones";
const apiProgramacion = "http://192.168.0.115:3001/api/programacionCursos";

let programacionesGlobal = [];

function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => hideNotification(), 5000);
}

function hideNotification() {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
        notification.style.display = 'none';
        notification.style.animation = '';
    }, 300);
}

notificationClose.addEventListener('click', hideNotification);

async function cargarCalificaciones() {
    try {
        const res = await fetch(apiCalificaciones);
        const data = await res.json();
        tbody.innerHTML = '';

        data.forEach(cal => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cal.id}</td>
                <td>${cal.nombre_curso || 'N/A'}</td>
                <td>${cal.nombre_capacitador || 'N/A'}</td>
                <td>${cal.fecha_inicio ? new Date(cal.fecha_inicio).toLocaleDateString() : 'N/A'}</td>
                <td>${cal.calificacion !== null ? cal.calificacion : 'N/A'}</td>
                <td>${cal.observaciones || 'N/A'}</td>
                <td><button class="btn-edit" data-id="${cal.id}">✏️</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModal(btn.dataset.id));
        });

    } catch (error) {
        console.error(error);
        showNotification('Error al cargar calificaciones', 'error');
    }
}

async function cargarProgramaciones(selectedId = null) {
    try {
        const res = await fetch(apiProgramacion);
        const data = await res.json();
        programacionesGlobal = data;

        selectProgramacion.innerHTML = '';
        data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.nombre_curso} - ${p.nombre_capacitador} (Inicio: ${new Date(p.fecha_inicio).toLocaleDateString()})`;
            selectProgramacion.appendChild(option);

            if (p.id === selectedId) {
                selectProgramacion.value = p.id;
            }
        });
    } catch (error) {
        console.error(error);
        showNotification('Error al cargar programaciones', 'error');
    }
}

async function abrirModal(id) {
    try {
        const res = await fetch(`${apiCalificaciones}/${id}`);
        const cal = await res.json();

        document.getElementById('edit_id').value = cal.id;
        document.getElementById('edit_calificacion').value = cal.calificacion || '';
        document.getElementById('edit_observaciones').value = cal.observaciones || '';

        await cargarProgramaciones(cal.programacion_id);

        modal.style.display = 'block';
    } catch (error) {
        console.error(error);
        showNotification('Error al abrir modal', 'error');
    }
}

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit_id').value;
    const programacion_id = parseInt(selectProgramacion.value);

    const calificacionActualizada = {
        programacion_id,
        calificacion: document.getElementById('edit_calificacion').value,
        observaciones: document.getElementById('edit_observaciones').value
    };

    try {
        const res = await fetch(`${apiCalificaciones}/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(calificacionActualizada)
        });

        if (res.ok) {
            showNotification('Calificación actualizada correctamente');
            modal.style.display = 'none';
            cargarCalificaciones();
        } else {
            const text = await res.text();
            showNotification('Error al actualizar: ' + text, 'error');
        }
    } catch (error) {
        console.error(error);
        showNotification('Error de conexión', 'error');
    }
});

document.getElementById('btnExportExcel').addEventListener('click', () => {
    const table = document.querySelector('.calificaciones-table');
    const wb = XLSX.utils.book_new();

    const cloneTable = table.cloneNode(true);
    cloneTable.querySelectorAll('tr').forEach(tr => {
        tr.removeChild(tr.lastElementChild);
    });

    const ws = XLSX.utils.table_to_sheet(cloneTable);
    XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
    XLSX.writeFile(wb, 'Calificaciones.xlsx');
    showNotification('Archivo Excel exportado correctamente');
});

document.getElementById('btnExportPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Registros de Calificaciones', 14, 15);

    const table = document.createElement('table');
    table.innerHTML = document.querySelector('.calificaciones-table').innerHTML;

    table.querySelectorAll('tr').forEach(tr => {
        tr.removeChild(tr.lastElementChild); 
    });

    Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
        if (tr.style.display === 'none') tr.remove();
    });

    doc.autoTable({
        startY: 25,
        html: table,
        theme: 'striped',
        headStyles: { fillColor: [26, 75, 188] },
        styles: { fontSize: 8 }
    });

    doc.save('Calificaciones.pdf');
    showNotification('Archivo PDF exportado correctamente');
});

window.addEventListener('DOMContentLoaded', cargarCalificaciones);
