const apiUrl = 'http://192.168.0.115:3001/api/empleados';

async function obtenerEmpleados() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Error al obtener los empleados');
    }
    const empleados = await response.json();
    document.getElementById('empleados-count').textContent = empleados.length;
  } catch (error) {
    console.error(error);
    document.getElementById('empleados-count').textContent = 'Error';
  }
}

window.addEventListener('DOMContentLoaded', obtenerEmpleados);
