const tbody = document.getElementById('empleados-body');
const searchInput = document.getElementById('searchInput');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');
const tableContainer = document.getElementById('table-container');

const apiEmpleados = "http://192.168.0.115:3001/api/empleados";
const apiEmpleadosCurso = "http://192.168.0.115:3001/api/empleadosPorCurso";

let empleadosGlobal = [];
let registrosGlobal = [];

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

async function cargarDatos() {
    try {
        // Cargar empleados
        const resEmpleados = await fetch(apiEmpleados);
        empleadosGlobal = await resEmpleados.json();

        // Cargar registros de empleados por curso
        const resRegistros = await fetch(apiEmpleadosCurso);
        registrosGlobal = await resRegistros.json();
    } catch (error) {
        console.error(error);
        showNotification('Error al cargar datos', 'error');
    }
}

function renderizarEmpleados(empleados) {
    tbody.innerHTML = '';
    tableContainer.style.display = empleados.length > 0 ? 'block' : 'none';

    empleados.forEach(emp => {
        const fullName = `${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}`;
        const tr = document.createElement('tr');
        tr.dataset.id = emp.id;
        tr.innerHTML = `
            <td><span class="empleado-link" data-id="${emp.id}">${fullName}</span></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.empleado-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const empleadoId = e.target.dataset.id;
            toggleDetallesEmpleado(empleadoId, e.target.closest('tr'));
        });
    });
}

function toggleDetallesEmpleado(empleadoId, parentTr) {
    let subTr = parentTr.nextElementSibling;
    if (subTr && subTr.classList.contains('detalle-empleado-row')) {
        subTr.style.display = subTr.style.display === 'table-row' ? 'none' : 'table-row';
        return;
    }

    const empleado = empleadosGlobal.find(emp => emp.id === parseInt(empleadoId));
    if (!empleado) return;

    subTr = document.createElement('tr');
    subTr.classList.add('detalle-empleado-row');
    const td = document.createElement('td');
    td.colSpan = 1;
    td.innerHTML = `
        <div class="detalle-empleado-container">
            <table class="detalle-empleado-table">
                <tbody>
                    <tr>
                        <td><strong>Clave:</strong></td>
                        <td>${empleado.clave || 'N/A'}</td>
                        <td><strong>Nombre Completo:</strong></td>
                        <td>${empleado.nombres} ${empleado.apellido_paterno} ${empleado.apellido_materno}</td>
                    </tr>
                    <tr>
                        <td><strong>VISA:</strong></td>
                        <td>${empleado.VISA || 'N/A'}</td>
                        <td><strong>CURP:</strong></td>
                        <td>${empleado.curp || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Puesto:</strong></td>
                        <td>${empleado.puesto || 'N/A'}</td>
                        <td><strong>Área:</strong></td>
                        <td>${empleado.area || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha de Ingreso:</strong></td>
                        <td>${empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString() : 'N/A'}</td>
                        <td><strong>Escolaridad:</strong></td>
                        <td>${empleado.escolaridad || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha de Nacimiento:</strong></td>
                        <td>${empleado.fecha_nacimiento ? new Date(empleado.fecha_nacimiento).toLocaleDateString() : 'N/A'}</td>
                        <td><strong>Email:</strong></td>
                        <td>${empleado.email || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Turno:</strong></td>
                        <td>${empleado.turno || 'N/A'}</td>
                        <td><strong>Fecha de Alta:</strong></td>
                        <td>${empleado.fecha_alta ? new Date(empleado.fecha_alta).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Estatus:</strong></td>
                        <td>${empleado.estatus || 'N/A'}</td>
                        <td><strong>Tipo de Nómina:</strong></td>
                        <td>${empleado.tipo_nomina || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Planta:</strong></td>
                        <td>${empleado.planta || 'N/A'}</td>
                        <td></td>
                        <td><button class="btn-cursos" data-id="${empleado.id}">Ver Cursos</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    subTr.appendChild(td);
    parentTr.after(subTr);

    subTr.querySelector('.btn-cursos').addEventListener('click', (e) => {
        toggleCursos(empleadoId, subTr);
    });
}

function toggleCursos(empleadoId, parentTr) {
    let subTr = parentTr.nextElementSibling;
    if (subTr && subTr.classList.contains('sub-row')) {
        subTr.style.display = subTr.style.display === 'table-row' ? 'none' : 'table-row';
        return;
    }

    const cursos = registrosGlobal.filter(reg => reg.nombre_empleado === empleadosGlobal.find(emp => emp.id === parseInt(empleadoId))?.nombres + ' ' + empleadosGlobal.find(emp => emp.id === parseInt(empleadoId))?.apellido_paterno + ' ' + empleadosGlobal.find(emp => emp.id === parseInt(empleadoId))?.apellido_materno);

    subTr = document.createElement('tr');
    subTr.classList.add('sub-row');
    const td = document.createElement('td');
    td.colSpan = 1;

    if (cursos.length === 0) {
        td.innerHTML = '<p>No hay cursos registrados para este empleado.</p>';
    } else {
        const subTable = document.createElement('table');
        subTable.classList.add('sub-table');
        subTable.innerHTML = `
            <thead>
                <tr>
                    <th>Curso</th>
                    <th>Aprobado</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const subTbody = subTable.querySelector('tbody');

        cursos.forEach(curso => {
            const cursoTr = document.createElement('tr');
            cursoTr.innerHTML = `
                <td><span class="curso-link" data-id="${curso.id}">${curso.nombre_curso || 'N/A'}</span></td>
                <td>${curso.aprobado ? 'Sí' : 'No'}</td>
            `;
            subTbody.appendChild(cursoTr);
        });

        td.appendChild(subTable);
    }

    subTr.appendChild(td);
    parentTr.after(subTr);

    document.querySelectorAll('.curso-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const registroId = e.target.dataset.id;
            toggleDetalles(registroId, e.target.closest('tr'));
        });
    });
}

function toggleDetalles(registroId, parentTr) {
    let detalleTr = parentTr.nextElementSibling;
    if (detalleTr && detalleTr.classList.contains('detalle-row')) {
        detalleTr.style.display = detalleTr.style.display === 'table-row' ? 'none' : 'table-row';
        return;
    }

    const curso = registrosGlobal.find(reg => reg.id === parseInt(registroId));
    if (!curso) return;

    detalleTr = document.createElement('tr');
    detalleTr.classList.add('detalle-row');
    const td = document.createElement('td');
    td.colSpan = 1;
    td.innerHTML = `
        <div class="detalle-curso-container">
            <table class="detalle-curso-table">
                <tbody>
                    <tr>
                        <td><strong>Nombre del Curso:</strong></td>
                        <td>${curso.nombre_curso || 'N/A'}</td>
                        <td><strong>Capacitador:</strong></td>
                        <td>${curso.nombre_capacitador || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Fecha de Inicio:</strong></td>
                        <td>${curso.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString() : 'N/A'}</td>
                        <td><strong>Asistencia:</strong></td>
                        <td>${curso.asistencia ? 'Sí' : 'No'}</td>
                    </tr>
                    <tr>
                        <td><strong>Aprobado:</strong></td>
                        <td>${curso.aprobado ? 'Sí' : 'No'}</td>
                        <td><strong>Calificación:</strong></td>
                        <td>${curso.calificacion !== null ? curso.calificacion : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Observaciones:</strong></td>
                        <td>${curso.observaciones || 'N/A'}</td>
                        <td><strong>Certificado Enviado:</strong></td>
                        <td>${curso.certificado_enviado ? 'Sí' : 'No'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    detalleTr.appendChild(td);
    parentTr.after(detalleTr);
}

searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const filtered = empleadosGlobal.filter(emp => {
        const fullName = `${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}`.toLowerCase();
        const visa = (emp.VISA || '').toLowerCase();
        return fullName.includes(term) || visa.includes(term);
    });
    renderizarEmpleados(filtered);
});

window.addEventListener('DOMContentLoaded', cargarDatos);