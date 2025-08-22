const tbody = document.getElementById('empleados-body');
const modal = document.getElementById('modalEditar');
const spanClose = document.querySelector('.close');
const formEditar = document.getElementById('formEditarEmpleado');

// Elementos de notificación
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Función para ocultar notificaciones
function hideNotification() {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
        notification.style.display = 'none';
        notification.style.animation = '';
    }, 300);
}

// Event listener para cerrar notificación
notificationClose.addEventListener('click', hideNotification);

function formatDateForInput(dateString) {
  if (!dateString) return "";

  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  if (dateString.includes("/")) {
    const [day, month, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }


  return dateString;
}

async function cargarEmpleados() {
  try {
    const response = await fetch('http://192.168.0.115:3001/api/empleados');
    if (!response.ok) throw new Error('Error al obtener empleados');

    const empleados = await response.json();
    tbody.innerHTML = '';

    empleados.forEach(emp => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${emp.id}</td>
        <td>${emp.clave}</td>
        <td>${emp.apellido_paterno}</td>
        <td>${emp.apellido_materno || ''}</td>
        <td>${emp.nombres}</td>
        <td>${emp.VISA}</td>
        <td>${emp.puesto}</td>
        <td>${emp.area}</td>
        <td>${emp.fecha_ingreso}</td>
        <td>${emp.escolaridad || ''}</td>
        <td>${emp.fecha_nacimiento}</td>
        <td>${emp.curp}</td>
        <td>${emp.email || ''}</td>
        <td>${emp.turno || ''}</td>
        <td>${emp.fecha_alta}</td>
        <td>${emp.estatus}</td>
        <td>${emp.tipo_nomina}</td>
        <td>${emp.planta}</td>
        <td><button class="btn-edit" data-id="${emp.id}">✏️</button></td>
      `;

      tbody.appendChild(tr);
    });

    // Listener botones editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        abrirModal(id);
      });
    });

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="19">Error al cargar empleados</td></tr>`;
    showNotification('Error al cargar la lista de empleados', 'error');
  }
}

async function abrirModal(id) {
  try {
    const response = await fetch(`http://192.168.0.115:3001/api/empleados/${id}`);
    const emp = await response.json();

    document.getElementById('edit_id').value = emp.id;
    document.getElementById('edit_clave').value = emp.clave;
    document.getElementById('edit_apellido_paterno').value = emp.apellido_paterno;
    document.getElementById('edit_apellido_materno').value = emp.apellido_materno || '';
    document.getElementById('edit_nombres').value = emp.nombres;
    document.getElementById('edit_VISA').value = emp.VISA;
    document.getElementById('edit_puesto').value = emp.puesto;
    document.getElementById('edit_area').value = emp.area;
    document.getElementById('edit_fecha_ingreso').value = formatDateForInput(emp.fecha_ingreso);
    document.getElementById('edit_escolaridad').value = emp.escolaridad || '';
    document.getElementById('edit_fecha_nacimiento').value = formatDateForInput(emp.fecha_nacimiento);
    document.getElementById('edit_curp').value = emp.curp;
    document.getElementById('edit_email').value = emp.email || '';
    document.getElementById('edit_turno').value = emp.turno || '';
    document.getElementById('edit_fecha_alta').value = formatDateForInput(emp.fecha_alta);
    document.getElementById('edit_estatus').value = emp.estatus;
    document.getElementById('edit_tipo_nomina').value = emp.tipo_nomina;
    document.getElementById('edit_planta').value = emp.planta;

    modal.style.display = 'block';
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    showNotification('Error al cargar datos del empleado', 'error');
  }
}

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

formEditar.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit_id').value;

  const empleadoActualizado = {
    clave: document.getElementById('edit_clave').value.trim(),
    apellido_paterno: document.getElementById('edit_apellido_paterno').value.trim(),
    apellido_materno: document.getElementById('edit_apellido_materno').value.trim(),
    nombres: document.getElementById('edit_nombres').value.trim(),
    VISA: document.getElementById('edit_VISA').value.trim(),
    puesto: document.getElementById('edit_puesto').value.trim(),
    area: document.getElementById('edit_area').value.trim(),
    fecha_ingreso: document.getElementById('edit_fecha_ingreso').value,
    escolaridad: document.getElementById('edit_escolaridad').value.trim(),
    fecha_nacimiento: document.getElementById('edit_fecha_nacimiento').value,
    curp: document.getElementById('edit_curp').value.trim(),
    email: document.getElementById('edit_email').value.trim(),
    turno: document.getElementById('edit_turno').value,
    fecha_alta: document.getElementById('edit_fecha_alta').value,
    estatus: document.getElementById('edit_estatus').value.trim(),
    tipo_nomina: document.getElementById('edit_tipo_nomina').value.trim(),
    planta: document.getElementById('edit_planta').value
  };

  try {
    const response = await fetch(`http://192.168.0.115:3001/api/empleados/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empleadoActualizado)
    });

    if (response.ok) {
      showNotification('Empleado actualizado correctamente');
      modal.style.display = 'none';
      cargarEmpleados();
    } else {
      const errorText = await response.text();
      showNotification('Error al actualizar empleado: ' + errorText, 'error');
    }
  } catch (error) {
    console.error(error);
    showNotification('Error de conexión con la API', 'error');
  }
});

window.addEventListener('DOMContentLoaded', cargarEmpleados);
