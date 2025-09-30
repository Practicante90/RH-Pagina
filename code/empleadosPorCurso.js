const selectProgramacion = document.getElementById('programacion');
const tbody = document.getElementById('empleados-curso-body');
const formCapacitador = document.getElementById('formCapacitador');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

const apiEmpleadosCurso = "http://192.168.0.115:3001/api/empleadosPorCurso";
const apiProgramacion = "http://192.168.0.115:3001/api/programacionCursos";
const apiEmpleados = "http://192.168.0.115:3001/api/empleados";

let programacionesGlobal = [];
let empleadosGlobal = [];

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

async function cargarProgramaciones() {
    try {
        const res = await fetch(apiProgramacion);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Programaciones cargadas:', data); 
        programacionesGlobal = data;

        const courseMap = {};
        data.forEach(p => {
            if (!courseMap[p.nombre_curso]) {
                courseMap[p.nombre_curso] = {
                    id: p.id,
                    nombre_capacitador: p.nombre_capacitador,
                    fecha_inicio: p.fecha_inicio,
                    ids: [p.id] 
                };
            } else {
                courseMap[p.nombre_curso].ids.push(p.id);
            }
        });

        selectProgramacion.innerHTML = '<option value="">Seleccione un curso</option>';
        Object.keys(courseMap).forEach(nombre_curso => {
            const p = courseMap[nombre_curso];
            const option = document.createElement('option');
            option.value = nombre_curso; 
            option.textContent = nombre_curso; 
            option.dataset.ids = JSON.stringify(p.ids); 
            selectProgramacion.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar programaciones:', error);
        showNotification('Error al cargar programaciones', 'error');
    }
}

async function cargarEmpleadosCurso(nombreCurso) {
    try {
        console.log('Cargando datos para nombre_curso:', nombreCurso);
        const selectedOption = selectProgramacion.selectedOptions[0];
        const programacionIds = JSON.parse(selectedOption.dataset.ids || '[]');
        console.log('Programacion IDs:', programacionIds); 

        const res = await fetch(apiProgramacion);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const allCursos = await res.json();
        const cursos = allCursos.filter(c => programacionIds.includes(c.id));
        console.log('Datos de cursos filtrados:', cursos); 

        const empleadosCursoRes = await fetch(apiEmpleadosCurso);
        const empleadosCursoData = await empleadosCursoRes.json();
        console.log('Datos de empleadosPorCurso:', empleadosCursoData); 

        tbody.innerHTML = '';

        if (cursos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">No hay registros para este curso</td></tr>';
            showNotification('No hay registros para este curso', 'info');
            return;
        }

        cursos.forEach(curso => {
            const empleadoAsignado = curso.empleado_asignado || 'N/A';
            const nombreCapacitador = curso.nombre_capacitador || 'N/A';
            const fechaInicio = curso.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString() : 'N/A';
            const programacionId = curso.id;

            const existingRecord = empleadosCursoData.find(reg => reg.programacion_id === programacionId) || {};
            const recordId = existingRecord.id || Date.now() + Math.floor(Math.random() * 1000); 

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${nombreCapacitador}</td>
                <td>${empleadoAsignado}</td>
                <td>${fechaInicio}</td>
                <td><input type="checkbox" name="asistencia_${recordId}" ${existingRecord.asistencia ? 'checked' : ''}></td>
                <td><input type="checkbox" name="aprobado_${recordId}" ${existingRecord.aprobado ? 'checked' : ''}></td>
                <td><input type="number" name="calificacion_${recordId}" step="0.01" min="0" max="100" value="${existingRecord.calificacion || ''}"></td>
                <td><textarea name="observaciones_${recordId}">${existingRecord.observaciones || ''}</textarea></td>
                <td><input type="checkbox" name="certificado_enviado_${recordId}" ${existingRecord.certificado_enviado ? 'checked' : ''}></td>
                <td>
                    <select name="estatus_${recordId}">
                        <option value="pendiente" ${existingRecord.estatus === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="impartido" ${existingRecord.estatus === 'impartido' ? 'selected' : ''}>Impartido</option>
                    </select>
                </td>
                <input type="hidden" name="id_${recordId}" value="${recordId}">
                <input type="hidden" name="programacion_id_${recordId}" value="${programacionId}">
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error al cargar datos del curso:', error);
        showNotification('Error al cargar datos del curso', 'error');
        tbody.innerHTML = '<tr><td colspan="9">Error al cargar datos</td></tr>';
    }
}

selectProgramacion.addEventListener('change', () => {
    const nombreCurso = selectProgramacion.value;
    console.log('Curso seleccionado, nombre_curso:', nombreCurso); 
    if (nombreCurso) {
        cargarEmpleadosCurso(nombreCurso);
    } else {
        tbody.innerHTML = '';
        showNotification('Por favor, seleccione un curso', 'info');
    }
});

formCapacitador.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formCapacitador);
    const updates = [];

    formData.forEach((value, key) => {
        const [field, id] = key.split('_');
        if (!updates[id]) {
            updates[id] = { 
                id: parseInt(formData.get(`id_${id}`)),
                programacion_id: parseInt(formData.get(`programacion_id_${id}`))
            };
        }
        if (field === 'asistencia' || field === 'aprobado' || field === 'certificado') {
            updates[id][field] = value === 'on';
        } else if (field === 'calificacion') {
            updates[id][field] = value ? parseFloat(value) : null;
        } else if (field === 'observaciones' || field === 'estatus') {
            updates[id][field] = value;
        }
    });

    try {
        for (const update of updates.filter(Boolean)) {
            console.log('Enviando actualización:', update); 
            const isNewRecord = update.id >= 1_000_000_000; 
            const method = isNewRecord ? 'POST' : 'PUT';
            const url = isNewRecord ? apiEmpleadosCurso : `${apiEmpleadosCurso}/${update.id}`;
            const body = { ...update };
            if (isNewRecord) delete body.id; 

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const text = await res.text();
                showNotification(`Error al ${isNewRecord ? 'crear' : 'actualizar'} registro ${update.id}: ${text}`, 'error');
                return;
            }
        }
        showNotification('Registros guardados correctamente');
        cargarEmpleadosCurso(selectProgramacion.value);
    } catch (error) {
        console.error('Error al guardar registros:', error);
        showNotification('Error de conexión', 'error');
    }
});

window.addEventListener('DOMContentLoaded', cargarProgramaciones);