const tbody = document.getElementById('empleados-body');

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
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="18">Error al cargar empleados</td></tr>`;
  }
}

window.addEventListener('DOMContentLoaded', cargarEmpleados);
