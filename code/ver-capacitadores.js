const tbody = document.getElementById('capacitadores-body');
const modal = document.getElementById('modalEditarCapacitador');
const spanClose = document.querySelector('.close');
const formEditar = document.getElementById('formEditarCapacitador');
const inputEmpleado = document.getElementById('empleado_input');
const hiddenEmpleadoId = document.getElementById('edit_empleado_id');
const datalistEmpleados = document.getElementById('empleadosList');

let empleadosGlobal = []; 

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

async function cargarCapacitadores() {
  try {
    const response = await fetch('http://192.168.0.115:3001/api/capacitadores');
    const data = await response.json();
    tbody.innerHTML = '';

    data.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.clave}</td>
        <td>${c.nombres}</td>
        <td>${c.apellido_paterno}</td>
        <td>${c.fecha_alta}</td>
        <td>${c.estatus}</td>
        <td><button class="btn-edit" data-id="${c.id}">✏️</button></td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => abrirModal(btn.dataset.id));
    });

  } catch (error) {
    console.error('Error al cargar capacitadores:', error);
  }
}

async function cargarEmpleadosDatalist(selectedId = null) {
  try {
    const response = await fetch('http://192.168.0.115:3001/api/empleados');
    const empleados = await response.json();
    empleadosGlobal = empleados;

    datalistEmpleados.innerHTML = '';
    empleados.forEach(emp => {
      const option = document.createElement('option');
      option.value = `${emp.clave} - ${emp.nombres} ${emp.apellido_paterno}`;
      option.dataset.id = emp.id;
      datalistEmpleados.appendChild(option);

      if (emp.id === selectedId) {
        inputEmpleado.value = option.value;
        hiddenEmpleadoId.value = emp.id;
      }
    });

  } catch (error) {
    console.error('Error al cargar empleados:', error);
  }
}

async function abrirModal(id) {
  try {
    const response = await fetch(`http://192.168.0.115:3001/api/capacitadores/${id}`);
    const c = await response.json();

    document.getElementById('edit_id').value = id;
    document.getElementById('edit_fecha_alta').value = formatDateForInput(c.fecha_alta);
    document.getElementById('edit_estatus').value = c.estatus;

    await cargarEmpleadosDatalist(c.empleado_id);

    modal.style.display = 'block';
  } catch (error) {
    console.error('Error al obtener capacitador:', error);
  }
}

inputEmpleado.addEventListener('input', () => {
  const match = empleadosGlobal.find(emp => {
    const text = `${emp.clave} - ${emp.nombres} ${emp.apellido_paterno}`;
    return text === inputEmpleado.value;
  });
  hiddenEmpleadoId.value = match ? match.id : '';
});

spanClose.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target == modal) modal.style.display = 'none'; };

formEditar.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('edit_id').value;
  const empleado_id = parseInt(hiddenEmpleadoId.value);
  if (!empleado_id) {
    alert('Selecciona un empleado válido de la lista.');
    return;
  }

  const capacitadorActualizado = {
    empleado_id,
    fecha_alta: document.getElementById('edit_fecha_alta').value,
    estatus: document.getElementById('edit_estatus').value.trim()
  };

  try {
    const response = await fetch(`http://192.168.0.115:3001/api/capacitadores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capacitadorActualizado)
    });

    if (response.ok) {
      alert('Capacitador actualizado correctamente');
      modal.style.display = 'none';
      cargarCapacitadores();
    } else {
      const errorText = await response.text();
      alert('Error al actualizar capacitador: ' + errorText);
    }
  } catch (error) {
    console.error(error);
    alert('Error de conexión con la API');
  }
});

// Inicializar
window.addEventListener('DOMContentLoaded', cargarCapacitadores);
