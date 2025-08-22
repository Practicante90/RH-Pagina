const formCapacitador = document.getElementById('formCapacitador');
const mensajeCapacitador = document.getElementById('mensajeCapacitador');
const empleadosList = document.getElementById('empleadosList');
const empleadoInput = document.getElementById('empleado_id');
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

async function cargarEmpleados() {
  try {
    const response = await fetch('http://192.168.0.115:3001/api/empleados');
    const empleados = await response.json();

    empleados.forEach(emp => {
      const option = document.createElement('option');
      option.value = `${emp.id} - ${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}`;
      empleadosList.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar empleados:', error);
    showNotification('Error al cargar la lista de empleados', 'error');
  }
}

cargarEmpleados();

formCapacitador.addEventListener('submit', async (e) => {
  e.preventDefault();

  const empleado_id = empleadoInput.value.split(' - ')[0].trim();
  const fecha_alta = document.getElementById('fecha_alta').value.trim();
  const estatus = document.getElementById('estatus').value.trim();

  if (!empleado_id || !estatus) {
    showNotification('Todos los campos son obligatorios.', 'error');
    return;
  }

  try {
    const response = await fetch('http://192.168.0.115:3001/api/capacitadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empleado_id, fecha_alta, estatus })
    });

    if (response.ok) {
      showNotification('Capacitador guardado correctamente.', 'success');
      formCapacitador.reset();
    } else {
      showNotification('Error al guardar el capacitador.', 'error');
    }
  } catch (error) {
    console.error(error);
    showNotification('Error en la conexión con la API.', 'error');
  }
});
