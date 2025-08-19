const formCapacitador = document.getElementById('formCapacitador');
const mensajeCapacitador = document.getElementById('mensajeCapacitador');
const empleadosList = document.getElementById('empleadosList');
const empleadoInput = document.getElementById('empleado_id');

// Cargar empleados desde la API y llenar datalist
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
  }
}

// Llamamos al cargar la página
cargarEmpleados();

formCapacitador.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Solo tomamos el ID del empleado (antes del guion)
  const empleado_id = empleadoInput.value.split(' - ')[0].trim();
  const fecha_alta = document.getElementById('fecha_alta').value.trim();
  const estatus = document.getElementById('estatus').value.trim();

  if (!empleado_id || !estatus) {
    mensajeCapacitador.textContent = 'Todos los campos son obligatorios.';
    mensajeCapacitador.className = 'mensaje error';
    mensajeCapacitador.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('http://192.168.0.115:3001/api/capacitadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empleado_id, fecha_alta, estatus })
    });

    if (response.ok) {
      mensajeCapacitador.textContent = 'Capacitador guardado correctamente.';
      mensajeCapacitador.className = 'mensaje exito';
      mensajeCapacitador.style.display = 'block';
      formCapacitador.reset();
    } else {
      mensajeCapacitador.textContent = 'Error al guardar el capacitador.';
      mensajeCapacitador.className = 'mensaje error';
      mensajeCapacitador.style.display = 'block';
    }
  } catch (error) {
    console.error(error);
    mensajeCapacitador.textContent = 'Error en la conexión con la API.';
    mensajeCapacitador.className = 'mensaje error';
    mensajeCapacitador.style.display = 'block';
  }
});
