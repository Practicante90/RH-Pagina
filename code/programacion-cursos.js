const formProgramacion = document.getElementById('formProgramacion');
const capacitadorInput = document.getElementById('capacitador_input');
const cursoInput = document.getElementById('curso_input');
const hiddenCapacitadorId = document.getElementById('capacitador_id');
const hiddenCursoId = document.getElementById('curso_id');
const capacitadoresList = document.getElementById('capacitadoresList');
const cursosList = document.getElementById('cursosList');
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

async function cargarCapacitadores() {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/capacitadores');
        const capacitadores = await response.json();
        capacitadoresGlobal = capacitadores;

        capacitadores.forEach(cap => {
            const option = document.createElement('option');
            option.value = `${cap.clave} - ${cap.nombres} ${cap.apellido_paterno}`;
            option.dataset.id = cap.id;
            capacitadoresList.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar capacitadores:', error);
        showNotification('Error al cargar la lista de capacitadores', 'error');
    }
}
        
async function cargarCursos() {
    try {
        const response = await fetch('http://192.168.0.115:3001/api/cursos');
        const cursos = await response.json();
        cursosGlobal = cursos;

        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre;
            option.dataset.id = curso.id;
            cursosList.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showNotification('Error al cargar la lista de cursos', 'error');
    }
}

capacitadorInput.addEventListener('input', () => {
    const match = capacitadoresGlobal.find(cap => {
        const text = `${cap.clave} - ${cap.nombres} ${cap.apellido_paterno}`;
        return text === capacitadorInput.value;
    });
    hiddenCapacitadorId.value = match ? match.id : '';
});

cursoInput.addEventListener('input', () => {
    const match = cursosGlobal.find(curso => {
        return curso.nombre === cursoInput.value;
    });
    hiddenCursoId.value = match ? match.id : '';
});

formProgramacion.addEventListener('submit', async (e) => {
    e.preventDefault();

    const capacitador_id = parseInt(hiddenCapacitadorId.value);
    const curso_id = parseInt(hiddenCursoId.value); 
    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const duracion_horas = parseInt(document.getElementById('duracion_horas').value);
    const status = document.getElementById('status').value;

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
        const response = await fetch('http://192.168.0.115:3001/api/programacionCursos', {
            method: 'POST',
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
            showNotification('Programación de curso guardada correctamente.');
            formProgramacion.reset();
            hiddenCapacitadorId.value = '';
            hiddenCursoId.value = '';
        } else {
            const errorText = await response.text();
            showNotification('Error al guardar la programación: ' + errorText, 'error');
        }
    } catch (error) {
        console.error(error);
        showNotification('Error de conexión con la API', 'error');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    cargarCapacitadores();
    cargarCursos();
});
