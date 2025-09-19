const tbody = document.getElementById('empleados-curso-body');
const modal = document.getElementById('modalEditarCurso');
const spanClose = modal.querySelector('.close');
const formEditar = document.getElementById('formEditarCurso');
const inputEmpleado = document.getElementById('empleado_input');
const hiddenEmpleadoId = document.getElementById('edit_empleado_id');
const datalistEmpleados = document.getElementById('empleadosList');
const selectProgramacion = document.getElementById('programacion_select');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

const apiEmpleadosCurso = "http://192.168.0.115:3001/api/empleadosPorCurso";
const apiProgramacion = "http://192.168.0.115:3001/api/programacionCursos";
const apiEmpleados = "http://192.168.0.115:3001/api/empleados";
const apiActualizar = "http://192.168.0.115:3001/api/empleadosPorCurso";

let empleadosGlobal = [];
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
                                
async function cargarEmpleadosCurso() {
    try {
        const res = await fetch(apiEmpleadosCurso);
        const data = await res.json();
        tbody.innerHTML = '';

        data.forEach(reg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.nombre_empleado || 'N/A'}</td>
                <td>${reg.nombre_curso || 'N/A'}</td>
                <td>${reg.nombre_capacitador || 'N/A'}</td>
                <td>${reg.fecha_inicio ? new Date(reg.fecha_inicio).toLocaleDateString() : 'N/A'}</td>
                <td>${reg.asistencia ? 'Sí' : 'No'}</td>
                <td>${reg.aprobado ? 'Sí' : 'No'}</td>
                <td>${reg.calificacion !== null ? reg.calificacion : 'N/A'}</td>
                <td>${reg.observaciones || 'N/A'}</td>
                <td>${reg.certificado_enviado ? 'Sí' : 'No'}</td>
                <td>${reg.estatus || 'N/A'}</td>
                <td><button class="btn-edit" data-id="${reg.id}">✏️</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModal(btn.dataset.id));
        }); 
        

    } catch (error) {
        console.error(error);
        showNotification('Error al cargar registros', 'error');
    }
}

async function cargarEmpleados(selectedId = null) {
    try {
        const res = await fetch(apiEmpleados);
        const data = await res.json();
        empleadosGlobal = data;

        datalistEmpleados.innerHTML = '';
        data.forEach(emp => {
            const option = document.createElement('option');
            option.value = `${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}`;
            option.dataset.id = emp.id;
            datalistEmpleados.appendChild(option);

            if (emp.id === selectedId) {
                inputEmpleado.value = option.value;
                hiddenEmpleadoId.value = emp.id;
            }
        });
    } catch (error) {
        console.error(error);
        showNotification('Error al cargar empleados', 'error');
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
        const res = await fetch(`${apiEmpleadosCurso}/${id}`);
        const reg = await res.json();

        document.getElementById('edit_id').value = reg.id;
        document.getElementById('edit_calificacion').value = reg.calificacion || '';
        document.getElementById('edit_observaciones').value = reg.observaciones || '';
        document.getElementById('edit_asistencia').checked = reg.asistencia || false;
        document.getElementById('edit_aprobado').checked = reg.aprobado || false;
        document.getElementById('edit_certificado_enviado').checked = reg.certificado_enviado || false;
        document.getElementById('edit_estatus').value = reg.estatus || '';

        await cargarEmpleados(reg.empleado_id);
        await cargarProgramaciones(reg.programacion_id);

        modal.style.display = 'block';
    } catch (error) {
        console.error(error);
        showNotification('Error al abrir modal', 'error');
    }
}

inputEmpleado.addEventListener('input', () => {
    const match = empleadosGlobal.find(emp => {
        const text = `${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}`;
        return text === inputEmpleado.value;
    });

    hiddenEmpleadoId.value = match ? match.id : '';
});

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit_id').value;
    const empleado_id = parseInt(hiddenEmpleadoId.value);
    const programacion_id = parseInt(selectProgramacion.value);

    const registroActualizado = {
        empleado_id,
        programacion_id,
        asistencia: document.getElementById('edit_asistencia').checked,
        aprobado: document.getElementById('edit_aprobado').checked,
        calificacion: document.getElementById('edit_calificacion').value || null,
        observaciones: document.getElementById('edit_observaciones').value,
        certificado_enviado: document.getElementById('edit_certificado_enviado').checked,
        estatus: document.getElementById('edit_estatus').value
    };

    try {
        const res = await fetch(`${apiActualizar}/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(registroActualizado)
        });

        if (res.ok) {
            showNotification('Registro actualizado correctamente');
            modal.style.display = 'none';
            cargarEmpleadosCurso();
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
    const table = document.querySelector('.empleados-table');
    const wb = XLSX.utils.book_new();

    const cloneTable = table.cloneNode(true);
    cloneTable.querySelectorAll('tr').forEach(tr => {
        tr.removeChild(tr.lastElementChild);
    });

    const ws = XLSX.utils.table_to_sheet(cloneTable);
    XLSX.utils.book_append_sheet(wb, ws, 'EmpleadosCurso');
    XLSX.writeFile(wb, 'EmpleadosPorCurso.xlsx');
});

document.getElementById('btnExportPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Registros de Empleados por Curso', 14, 15);

    const table = document.createElement('table');
    table.innerHTML = document.querySelector('.empleados-table').innerHTML;

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

    doc.save('EmpleadosPorCurso.pdf');
});

window.addEventListener('DOMContentLoaded', cargarEmpleadosCurso);
