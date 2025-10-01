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
            throw new Error(`Error HTTP: ${res.status}`);
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
            throw new Error(`Error HTTP: ${res.status}`);
        }
        const allCursos = await res.json();
        const cursos = allCursos.filter(c => programacionIds.includes(c.id));
        console.log('Datos de cursos filtrados:', cursos);

        const empleadosCursoRes = await fetch(apiEmpleadosCurso);
        if (!empleadosCursoRes.ok) {
            throw new Error(`Error HTTP: ${empleadosCursoRes.status}`);
        }
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
            const recordId = existingRecord.id || null;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${nombreCapacitador}</td>
                <td>${empleadoAsignado}</td>
                <td>${fechaInicio}</td>
                <td><input type="checkbox" name="asistencia_${recordId || programacionId}" ${existingRecord.asistencia ? 'checked' : ''}></td>
                <td><input type="checkbox" name="aprobado_${recordId || programacionId}" ${existingRecord.aprobado ? 'checked' : ''}></td>
                <td><input type="number" name="calificacion_${recordId || programacionId}" step="0.01" min="0" max="100" value="${existingRecord.calificacion || ''}"></td>
                <td><textarea name="observaciones_${recordId || programacionId}">${existingRecord.observaciones || ''}</textarea></td>
                <td><input type="checkbox" name="certificado_enviado_${recordId || programacionId}" ${existingRecord.certificado_enviado ? 'checked' : ''}></td>
                <td>
                    <select name="estatus_${recordId || programacionId}">
                        <option value="pendiente" ${existingRecord.estatus === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="impartido" ${existingRecord.estatus === 'impartido' ? 'selected' : ''}>Impartido</option>
                    </select>
                </td>
                <input type="hidden" name="id_${recordId || programacionId}" value="${recordId || ''}">
                <input type="hidden" name="programacion_id_${recordId || programacionId}" value="${programacionId}">
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
    const updates = {};

    // Registrar todos los datos del formulario para depuración
    console.log('Datos del formulario:');
    formData.forEach((value, key) => {
        console.log(`Clave: ${key}, Valor: ${value}`);
    });

    // Inicializar updates con valores por defecto para checkboxes
    const rows = tbody.querySelectorAll('tr');
    console.log('Número de filas en la tabla:', rows.length);
    rows.forEach((row, index) => {
        const uniqueIdInput = row.querySelector(`input[name^="id_"]`);
        if (uniqueIdInput) {
            const id = uniqueIdInput.name.split('_')[1];
            console.log(`Fila ${index}: id=${id}, programacion_id=${formData.get(`programacion_id_${id}`)}`);
            updates[id] = {
                id: parseInt(formData.get(`id_${id}`)) || null,
                programacion_id: parseInt(formData.get(`programacion_id_${id}`)) || null,
                asistencia: false,
                aprobado: false,
                certificado_enviado: false // Valor por defecto
            };
            // Verificar explícitamente el checkbox de certificado_enviado
            const certificadoValue = formData.get(`certificado_enviado_${id}`);
            updates[id].certificado_enviado = certificadoValue === 'on';
            console.log(`Certificado enviado para id=${id}: ${updates[id].certificado_enviado}`);
        } else {
            console.warn(`Fila ${index}: No se encontró input con name^="id_"`);
        }
    });

    // Procesar datos del formulario
    formData.forEach((value, key) => {
        const [field, id] = key.split('_');
        if (updates[id] && field !== 'certificado_enviado') { // Evitar procesar certificado_enviado aquí
            if (field === 'asistencia' || field === 'aprobado') {
                updates[id][field] = value === 'on';
            } else if (field === 'calificacion') {
                updates[id][field] = value ? parseFloat(value) : null;
            } else if (field === 'observaciones' || field === 'estatus') {
                updates[id][field] = value;
            }
        } else if (!updates[id]) {
            console.warn(`Campo ignorado: ${key}, no se encontró ID en updates`);
        }
    });

    console.log('Objeto updates:', updates);
    const validUpdates = Object.values(updates).filter(update => update.programacion_id);
    console.log('Valid updates:', validUpdates);

    if (validUpdates.length === 0) {
        showNotification('No hay datos para guardar', 'info');
        return;
    }

    try {
        for (const update of validUpdates) {
            console.log('Enviando actualización:', update);
            const isNewRecord = !update.id;
            const method = isNewRecord ? 'POST' : 'PUT';
            const url = isNewRecord ? apiEmpleadosCurso : `${apiEmpleadosCurso}/${update.id}`;
            const body = { ...update };
            if (isNewRecord) delete body.id;

            console.log('URL:', url);
            console.log('Método:', method);
            console.log('Cuerpo:', JSON.stringify(body));

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const responseText = await res.text();
            console.log('Estado de respuesta:', res.status);
            console.log('Texto de respuesta:', responseText);

            if (!res.ok) {
                throw new Error(`Error al ${isNewRecord ? 'crear' : 'actualizar'} registro ${update.id || 'nuevo'}: ${responseText}`);
            }
        }
        showNotification('Registros guardados correctamente');
        cargarEmpleadosCurso(selectProgramacion.value);
    } catch (error) {
        console.error('Error al guardar registros:', error);
        showNotification(error.message, 'error');
    }
});

window.addEventListener('DOMContentLoaded', cargarProgramaciones);