const tbody = document.getElementById('programacion-body');
const modal = document.getElementById('modalEditar');
const spanClose = document.querySelector('.close');
const formEditar = document.getElementById('formEditarProgramacion');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

let capacitadoresGlobal = [];
let cursosGlobal = [];
let empleadosGlobal = [];
let empleadosSeleccionadosEditar = [];
let currentGroupRecords = [];

function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        hideNotification();
    }, 5000);
}   

function hideNotification() {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
        notification.style.display = 'none';
        notification.style.animation = '';
    }, 300);
}

notificationClose.addEventListener('click', hideNotification);

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d)) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        }
        return '';
    }
    return d.toISOString().split('T')[0];
}

async function cargarProgramacion() {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/programacionCursos');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Programaciones cargadas:', data);

        const groupedCourses = {};
        data.forEach(prog => {
            const key = `${prog.nombre_curso}|${prog.nombre_capacitador}`;
            if (!groupedCourses[key]) {
                groupedCourses[key] = {
                    id: prog.id,
                    nombre_curso: prog.nombre_curso,
                    nombre_capacitador: prog.nombre_capacitador,
                    fecha_inicio: prog.fecha_inicio,
                    duracion_horas: prog.duracion_horas,
                    status: prog.status,
                    empleados: [],
                    programacion_ids: []
                };
            }
            groupedCourses[key].empleados.push({
                id: prog.id,
                empleado_asignado: prog.empleado_asignado || 'N/A',
                empleado_id: prog.empleado_id
            });
            groupedCourses[key].programacion_ids.push(prog.id);
        });

        tbody.innerHTML = '';

        Object.values(groupedCourses).forEach(group => {
            const tr = document.createElement('tr');
            const empleadosHTML = group.empleados.map(e => e.empleado_asignado).join('<br>');

            tr.innerHTML = `
                <td>${group.programacion_ids[0]}</td>
                <td>${group.nombre_capacitador}</td>
                <td>${group.nombre_curso}</td>
                <td>${group.fecha_inicio ? formatDateForInput(group.fecha_inicio) : ''}</td>
                <td>${group.duracion_horas}</td>
                <td>${group.status}</td>
                <td>${empleadosHTML}</td>
                <td><button class="btn-edit" data-ids='${JSON.stringify(group.programacion_ids)}' data-empleados='${JSON.stringify(group.empleados)}'>✏️</button></td>
            `;
            tbody.appendChild(tr);
        });

        const buttons = document.querySelectorAll('.btn-edit');
        console.log('Botones de editar creados:', buttons.length);
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                console.log(`Botón editar clicado #${index + 1}`, {
                    ids: btn.dataset.ids,
                    empleados: btn.dataset.empleados
                });
                try {
                    abrirModal(JSON.parse(btn.dataset.ids), JSON.parse(btn.dataset.empleados));
                } catch (error) {
                    console.error('Error al parsear datos del botón:', error);
                    showNotification('Error al abrir el modal: datos inválidos', 'error');
                }
            });
        });

    } catch (error) {
        console.error('Error al cargar programación:', error);
        showNotification('Error al cargar la lista de programación', 'error');
    }
}

async function cargarCapacitadoresDatalist(selectedName = null) {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/capacitadores');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const capacitadores = await response.json();
        capacitadoresGlobal = capacitadores;

        const datalist = document.getElementById('editCapacitadoresList');
        datalist.innerHTML = '';

        capacitadores.forEach(cap => {
            const option = document.createElement('option');
            option.value = `${cap.clave} - ${cap.nombres} ${cap.apellido_paterno}`.trim();
            option.dataset.id = cap.id;
            datalist.appendChild(option);
        });

        const input = document.getElementById('edit_capacitador_input');
        const hiddenInput = document.getElementById('edit_capacitador_id');

        const normalizedSelectedName = selectedName ? selectedName.trim().toLowerCase().replace(/\s+/g, ' ') : '';
        const matchedCapacitador = capacitadores.find(cap => {
            const nombres = cap.nombres.trim().toLowerCase();
            const fullName = `${cap.nombres} ${cap.apellido_paterno}`.trim().toLowerCase().replace(/\s+/g, ' ');
            return nombres === normalizedSelectedName || fullName === normalizedSelectedName;
        });

        if (matchedCapacitador) {
            input.value = `${matchedCapacitador.clave} - ${matchedCapacitador.nombres} ${matchedCapacitador.apellido_paterno}`.trim();
            hiddenInput.value = matchedCapacitador.id;
        } else {
            input.value = selectedName || '';
            hiddenInput.value = '';
            if (selectedName) {
                console.warn(`No se encontró capacitador con nombre "${selectedName}".`);
                showNotification('Por favor, selecciona un capacitador válido del datalist', 'warning');
            }
        }
    } catch (error) {
        console.error('Error al cargar capacitadores:', error);
        showNotification('Error al cargar la lista de capacitadores', 'error');
        document.getElementById('edit_capacitador_input').value = selectedName || '';
        document.getElementById('edit_capacitador_id').value = '';
    }
}

async function cargarCursosDatalist(selectedId = null, selectedName = null) {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/cursos');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const cursos = await response.json();
        cursosGlobal = cursos;

        const datalist = document.getElementById('editCursosList');
        datalist.innerHTML = '';

        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre.trim();
            option.dataset.id = curso.id;
            datalist.appendChild(option);
        });

        const input = document.getElementById('edit_curso_input');
        const hiddenInput = document.getElementById('edit_curso_id');

        const matchedCurso = cursos.find(curso => curso.id === selectedId);
        if (matchedCurso) {
            input.value = matchedCurso.nombre.trim();
            hiddenInput.value = matchedCurso.id;
        } else {
            const normalizedSelectedName = selectedName ? selectedName.trim().toLowerCase().replace(/\s+/g, ' ') : '';
            const matchedByName = cursos.find(curso => 
                curso.nombre.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedSelectedName
            );
            if (matchedByName) {
                input.value = matchedByName.nombre.trim();
                hiddenInput.value = matchedByName.id;
            } else {
                input.value = selectedName || '';
                hiddenInput.value = selectedId || '';
                if (selectedName || selectedId) {
                    console.warn(`No se encontró curso con ID ${selectedId} o nombre "${selectedName}".`);
                    showNotification('Por favor, selecciona un curso válido del datalist', 'warning');
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showNotification('Error al cargar la lista de cursos', 'error');
        document.getElementById('edit_curso_input').value = selectedName || '';
        document.getElementById('edit_curso_id').value = '';
    }
}

async function cargarEmpleadosDatalist(selectedEmpleadoIds = []) {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/empleados');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        empleadosGlobal = data;

        const datalist = document.getElementById('editEmpleadosList');
        datalist.innerHTML = '';
        data.forEach(e => {
            const option = document.createElement('option');
            option.value = `${e.apellido_paterno} ${e.apellido_materno || ''} ${e.nombres} - ${e.VISA}`.trim();
            option.dataset.id = e.id;
            datalist.appendChild(option);
        });

        empleadosSeleccionadosEditar = selectedEmpleadoIds.map(id => {
            const emp = data.find(e => e.id === id);
            return emp ? {
                id: emp.id,
                nombre: `${emp.apellido_paterno} ${emp.apellido_materno || ''} ${emp.nombres} - ${emp.VISA}`.trim()
            } : null;
        }).filter(Boolean);
        mostrarEmpleadosSeleccionados();
    } catch (error) {
        console.error('Error al cargar empleados:', error);
        showNotification('Error al cargar empleados', 'error');
    }
}

function mostrarEmpleadosSeleccionados() {
    const contenedor = document.getElementById('edit_empleados_seleccionados');
    contenedor.innerHTML = '';
    empleadosSeleccionadosEditar.forEach(e => {
        const div = document.createElement('div');
        div.className = 'empleado-chip';
        div.textContent = e.nombre;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'x';
        btn.onclick = () => {
            empleadosSeleccionadosEditar = empleadosSeleccionadosEditar.filter(emp => emp.id !== e.id);
            document.getElementById('edit_empleados_input').value = '';
            mostrarEmpleadosSeleccionados();
        };
        div.appendChild(btn);
        contenedor.appendChild(div);
    });
}

document.getElementById('edit_empleados_input').addEventListener('change', function() {
    const input = this.value.trim();
    if (!input) return;

    const option = Array.from(document.getElementById('editEmpleadosList').options)
                        .find(opt => opt.value === input);
    if (!option) return;

    const empleadoId = option.dataset.id;
    if (empleadosSeleccionadosEditar.some(emp => emp.id === empleadoId)) {
        showNotification('Este empleado ya está seleccionado', 'warning');
        this.value = '';
        return;
    }

    empleadosSeleccionadosEditar.push({ id: empleadoId, nombre: input });
    mostrarEmpleadosSeleccionados();
    this.value = '';
});

async function abrirModal(programacionIds, empleados) {
    try {
        if (!programacionIds || !programacionIds.length || !empleados) {
            throw new Error('Datos inválidos: programacionIds o empleados no definidos');
        }

        console.log('Abriendo modal con:', { programacionIds, empleados });

        currentGroupRecords = empleados.map(emp => ({
            programacion_id: emp.id,
            empleado_id: emp.empleado_id,
            empleado_asignado: emp.empleado_asignado
        }));

        const defaultId = programacionIds[0];
        const response = await fetch(`http://192.168.0.115:3001/api/programacionCursos/${defaultId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const prog = await response.json();
        console.log('Datos del curso:', prog);

        document.getElementById('edit_id').value = defaultId;
        document.getElementById('edit_fecha_inicio').value = formatDateForInput(prog.fecha_inicio);
        document.getElementById('edit_duracion_horas').value = prog.duracion_horas || '';
        document.getElementById('edit_status').value = prog.status || 'Programado';

        await cargarCapacitadoresDatalist(prog.nombre_capacitador);
        await cargarCursosDatalist(prog.curso_id, prog.nombre_curso);
        empleadosSeleccionadosEditar = [];
        const empleadoIds = empleados.map(emp => emp.empleado_id).filter(Boolean);
        await cargarEmpleadosDatalist(empleadoIds);

        console.log('Empleados seleccionados:', empleadosSeleccionadosEditar);
        modal.style.display = 'block';
        console.log('Modal debería estar visible');
    } catch (error) {
        console.error('Error en abrirModal:', error);
        showNotification('Error al abrir el modal: ' + error.message, 'error');
    }
}

document.getElementById('edit_capacitador_input').addEventListener('input', () => {
    const input = document.getElementById('edit_capacitador_input').value.trim();
    const match = capacitadoresGlobal.find(cap => {
        const text = `${cap.clave} - ${cap.nombres} ${cap.apellido_paterno}`.trim();
        return text === input;
    }); 
    document.getElementById('edit_capacitador_id').value = match ? match.id : '';
});

document.getElementById('edit_curso_input').addEventListener('input', () => {
    const input = document.getElementById('edit_curso_input').value.trim();
    const match = cursosGlobal.find(curso => curso.nombre.trim() === input);
    document.getElementById('edit_curso_id').value = match ? match.id : '';
});

spanClose.onclick = () => {
    modal.style.display = 'none';
    console.log('Modal cerrado por botón de cerrar');
};

window.onclick = e => {
    if (e.target == modal) {
        modal.style.display = 'none';
        console.log('Modal cerrado por clic fuera');
    }
};

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const capacitador_id = parseInt(document.getElementById('edit_capacitador_id').value);
    const curso_id = parseInt(document.getElementById('edit_curso_id').value);
    const fecha_inicio = document.getElementById('edit_fecha_inicio').value;
    const duracion_horas = parseInt(document.getElementById('edit_duracion_horas').value);
    const status = document.getElementById('edit_status').value;

    if (!capacitador_id) { showNotification('Selecciona un capacitador válido', 'error'); return; }
    if (!curso_id) { showNotification('Selecciona un curso válido', 'error'); return; }
    if (!fecha_inicio) { showNotification('La fecha de inicio es obligatoria', 'error'); return; }
    if (!duracion_horas || duracion_horas <= 0) { showNotification('Duración debe ser mayor a 0', 'error'); return; }
    if (!empleadosSeleccionadosEditar.length) { showNotification('Selecciona al menos un empleado', 'error'); return; }

    try {
        for (let i = 0; i < currentGroupRecords.length; i++) {
            const programacionId = currentGroupRecords[i].programacion_id;
            const empleadoId = empleadosSeleccionadosEditar[i]?.id || null;

            console.log('Datos a enviar para programacion_id:', programacionId, {
                capacitador_id,
                curso_id,
                fecha_inicio,
                duracion_horas,
                status,
                empleado_id: empleadoId
            });

            const response = await fetch(`http://192.168.0.115:3001/api/programacionCursos/${programacionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    capacitador_id,
                    curso_id,
                    fecha_inicio,
                    duracion_horas,
                    status,
                    empleado_id: empleadoId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                showNotification(`Error al actualizar programacion_id ${programacionId}: ${errorText}`, 'error');
                return;
            }
        }

        showNotification('Programación actualizada correctamente');
        modal.style.display = 'none';
        cargarProgramacion();
    } catch (error) {
        console.error('Error de conexión con la API:', error);
        showNotification('Error de conexión con la API', 'error');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Iniciando cargarProgramacion');
    cargarProgramacion();
});