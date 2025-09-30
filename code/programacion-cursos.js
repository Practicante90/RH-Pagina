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

let empleadosSeleccionados = [];
let capacitadoresGlobal = [];
let cursosGlobal = [];
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

// Cargar capacitadores
async function cargarCapacitadores() {
    try {
        const res = await fetch('http://192.168.0.115:3001/api/capacitadores');
        const data = await res.json();
        capacitadoresGlobal = data;
        data.forEach(c => {
            const option = document.createElement('option');
            option.value = `${c.clave} - ${c.nombres} ${c.apellido_paterno}`;
            option.dataset.id = c.id;
            capacitadoresList.appendChild(option);
        });
    } catch (err) {
        showNotification('Error al cargar capacitadores', 'error');
    }
}

// Cargar cursos
async function cargarCursos() {
    try {
        const res = await fetch('http://192.168.0.115:3001/api/cursos');
        const data = await res.json();
        cursosGlobal = data;
        data.forEach(c => {
            const option = document.createElement('option');
            option.value = c.nombre;
            option.dataset.id = c.id;
            cursosList.appendChild(option);
        });
    } catch (err) {
        showNotification('Error al cargar cursos', 'error');
    }
}

// Cargar empleados
async function cargarEmpleados() {
    try {
        const res = await fetch('http://192.168.0.115:3001/api/empleados');
        const data = await res.json();
        empleadosGlobal = data;
        const datalist = document.getElementById('empleadosList');
        data.forEach(e => {
            const option = document.createElement('option');
            option.value = `${e.nombres} ${e.apellido_paterno} ${e.apellido_materno}`;
            option.dataset.id = e.id;
            datalist.appendChild(option);
        });
    } catch (err) {
        showNotification('Error al cargar empleados', 'error');
    }
}

// Manejo de selección de empleados
document.getElementById('empleado_input').addEventListener('change', function () {
    const input = this.value.trim();
    if (!input) return;

    const option = Array.from(document.getElementById('empleadosList').options)
                        .find(opt => opt.value === input);
    if (!option) return;

    const empleadoId = option.dataset.id;
    if (empleadosSeleccionados.some(e => e.id === empleadoId)) {
        this.value = "";
        return;
    }

    empleadosSeleccionados.push({ id: empleadoId, nombre: input });
    mostrarEmpleadosSeleccionados();
    this.value = "";
});

function mostrarEmpleadosSeleccionados() {
    const contenedor = document.getElementById('empleados-seleccionados');
    contenedor.innerHTML = '';
    empleadosSeleccionados.forEach(e => {
        const div = document.createElement('div');
        div.className = 'empleado-chip';
        div.textContent = e.nombre;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'x';
        btn.onclick = () => {
            empleadosSeleccionados = empleadosSeleccionados.filter(emp => emp.id !== e.id);
            mostrarEmpleadosSeleccionados();
        };
        div.appendChild(btn);
        contenedor.appendChild(div);
    });
}

// Form submit
formProgramacion.addEventListener('submit', async (e) => {
    e.preventDefault();

    const capacitador_id = parseInt(hiddenCapacitadorId.value);
    const curso_id = parseInt(hiddenCursoId.value); 
    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const duracion_horas = parseInt(document.getElementById('duracion_horas').value);
    const status = document.getElementById('status').value;

    if (!capacitador_id || !curso_id || empleadosSeleccionados.length === 0) {
        showNotification('Selecciona un capacitador, curso y al menos un empleado', 'error');
        return;
    }

    for (let emp of empleadosSeleccionados) {
        try {
            const res = await fetch('http://192.168.0.115:3001/api/programacionCursos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    capacitador_id,
                    curso_id,
                    fecha_inicio,
                    duracion_horas,
                    status,
                    empleado_id: emp.id
                })
            });
            if (!res.ok) {
                const errorText = await res.text();
                showNotification('Error al guardar: ' + errorText, 'error');
                return;
            }
        } catch (err) {
            showNotification('Error de conexión con la API', 'error');
            return;
        }
    }

    showNotification('Programación guardada correctamente', 'success');
    formProgramacion.reset();
    empleadosSeleccionados = [];
    mostrarEmpleadosSeleccionados();
});

// Actualizar hidden inputs
capacitadorInput.addEventListener('input', () => {
    const match = capacitadoresGlobal.find(c => `${c.clave} - ${c.nombres} ${c.apellido_paterno}` === capacitadorInput.value);
    hiddenCapacitadorId.value = match ? match.id : '';
});

cursoInput.addEventListener('input', () => {
    const match = cursosGlobal.find(c => c.nombre === cursoInput.value);
    hiddenCursoId.value = match ? match.id : '';
});

// Inicialización
cargarCapacitadores();
cargarCursos();
cargarEmpleados();
