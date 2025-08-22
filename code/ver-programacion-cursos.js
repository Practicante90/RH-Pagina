const tbody = document.getElementById('programacion-body');
const modal = document.getElementById('modalEditar');
const spanClose = document.querySelector('.close');
const formEditar = document.getElementById('formEditarProgramacion');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

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

let capacitadoresGlobal = [];
let cursosGlobal = [];

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
        const data = await response.json();

        data.forEach(prog => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prog.id}</td>
                <td>${prog.nombre_capacitador}</td>
                <td>${prog.nombre_curso}</td>
                <td>${prog.fecha_inicio}</td>
                <td>${prog.duracion_horas}</td>
                <td>${prog.status}</td>
                <td><button class="btn-edit" data-id="${prog.id}">✏️</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModal(btn.dataset.id));
        });

    } catch (error) {
        console.error('Error al cargar programación:', error);
        showNotification('Error al cargar la lista de programación', 'error');
    }
}

async function cargarCapacitadoresDatalist(selectedId = null) {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/capacitadores');
        const capacitadores = await response.json();
        capacitadoresGlobal = capacitadores;

        const datalist = document.getElementById('editCapacitadoresList');
        datalist.innerHTML = '';
        capacitadores.forEach(cap => {
            const option = document.createElement('option');
            option.value = `${cap.clave} - ${cap.nombres} ${cap.apellido_paterno}`;
            option.dataset.id = cap.id;
            datalist.appendChild(option);

            if (cap.id === selectedId) {
                document.getElementById('edit_capacitador_input').value = option.value;
                document.getElementById('edit_capacitador_id').value = cap.id;
            }
        });

    } catch (error) {
        console.error('Error al cargar capacitadores:', error);
        showNotification('Error al cargar la lista de capacitadores', 'error');
    }
}

async function cargarCursosDatalist(selectedId = null) {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/cursos');
        const cursos = await response.json();
        cursosGlobal = cursos;

        const datalist = document.getElementById('editCursosList');
        datalist.innerHTML = '';
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre;
            option.dataset.id = curso.id;
            datalist.appendChild(option);

            if (curso.id === selectedId) {
                document.getElementById('edit_curso_input').value = option.value;
                document.getElementById('edit_curso_id').value = curso.id;
            }
        });

    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showNotification('Error al cargar la lista de cursos', 'error');
    }
}

async function abrirModal(id) {
    try {
        const response = await fetch(`http://192.168.0.115:3001/api/programacionCursos/${id}`);
        const prog = await response.json();

        document.getElementById('edit_id').value = id;
        document.getElementById('edit_fecha_inicio').value = formatDateForInput(prog.fecha_inicio);
        document.getElementById('edit_duracion_horas').value = prog.duracion_horas;
        document.getElementById('edit_status').value = prog.status;

        await cargarCapacitadoresDatalist(prog.capacitador_id);
        await cargarCursosDatalist(prog.curso_id);

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error al obtener programación:', error);
        showNotification('Error al cargar datos de la programación', 'error');
    }
}

document.getElementById('edit_capacitador_input').addEventListener('input', () => {
    const match = capacitadoresGlobal.find(cap => {
        const text = `${cap.clave} - ${cap.nombres} ${cap.apellido_paterno}`;
        return text === document.getElementById('edit_capacitador_input').value;
    });
    document.getElementById('edit_capacitador_id').value = match ? match.id : '';
});

document.getElementById('edit_curso_input').addEventListener('input', () => {
    const match = cursosGlobal.find(curso => {
        return curso.nombre === document.getElementById('edit_curso_input').value;
    });
    document.getElementById('edit_curso_id').value = match ? match.id : '';
});

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit_id').value;
    const capacitador_id = parseInt(document.getElementById('edit_capacitador_id').value);
    const curso_id = parseInt(document.getElementById('edit_curso_id').value);
    const fecha_inicio = document.getElementById('edit_fecha_inicio').value;
    const duracion_horas = parseInt(document.getElementById('edit_duracion_horas').value);
    const status = document.getElementById('edit_status').value;

    if (!capacitador_id) {
        showNotification('Selecciona un capacitador válido de la lista.', 'error');
        return;
    }

    if (!curso_id) {
        showNotification('Selecciona un curso válido de la lista.', 'error');
        return;
    }

    if (!fecha_inicio) {
        showNotification('La fecha de inicio es obligatoria.', 'error');
        return;
    }

    if (!duracion_horas || duracion_horas <= 0) {
        showNotification('La duración debe ser mayor a 0 horas.', 'error');
        return;
    }

    try {
        const response = await fetch(`http://192.168.0.115:3001/api/programacionCursos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                capacitador_id,
                curso_id,
                fecha_inicio,
                duracion_horas,
                status
            })
        });

        if (response.ok) {
            showNotification('Programación actualizada correctamente');
            modal.style.display = 'none';
            cargarProgramacion();
        } else {
            const errorText = await response.text();
            showNotification('Error al actualizar programación: ' + errorText, 'error');
        }
    } catch (error) {
        console.error(error);
        showNotification('Error de conexión con la API', 'error');
    }
});

window.addEventListener('DOMContentLoaded', cargarProgramacion);
