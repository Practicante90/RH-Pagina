const tbody = document.getElementById('capacitadores-body');
const modal = document.getElementById('modalEditarCapacitador');
const spanClose = document.querySelector('.close');
const formEditar = document.getElementById('formEditarCapacitador');
const inputEmpleado = document.getElementById('empleado_input');
const hiddenEmpleadoId = document.getElementById('edit_empleado_id');
const datalistEmpleados = document.getElementById('empleadosList');
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
    showNotification('Error al cargar la lista de capacitadores', 'error');
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
    showNotification('Error al cargar la lista de empleados', 'error');
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
    showNotification('Error al cargar datos del capacitador', 'error');
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
    showNotification('Selecciona un empleado válido de la lista.', 'error');
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
      showNotification('Capacitador actualizado correctamente');
      modal.style.display = 'none';
      cargarCapacitadores();
    } else {
      const errorText = await response.text();
      showNotification('Error al actualizar capacitador: ' + errorText, 'error');
    }
  } catch (error) {
    console.error(error);
    showNotification('Error de conexión con la API', 'error');
  }
});

window.addEventListener('DOMContentLoaded', cargarCapacitadores);

// Funciones de exportación
document.getElementById('btnExportExcel').addEventListener('click', () => {
    const table = document.querySelector('.capacitadores-table');
    const wb = XLSX.utils.book_new();

    const cloneTable = table.cloneNode(true);
    cloneTable.querySelectorAll('tr').forEach(tr => {
        tr.removeChild(tr.lastElementChild);
    });

    const ws = XLSX.utils.table_to_sheet(cloneTable);
    XLSX.utils.book_append_sheet(wb, ws, 'Capacitadores');
    XLSX.writeFile(wb, 'Capacitadores.xlsx');
    showNotification('Archivo Excel exportado correctamente');
});

document.getElementById('btnExportPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Lista de Capacitadores', 14, 15);

    const table = document.createElement('table');
    table.innerHTML = document.querySelector('.capacitadores-table').innerHTML;

    table.querySelectorAll('tr').forEach(tr => {
        tr.removeChild(tr.lastElementChild); 
    });

    Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
        if (tr.style.display === 'none') tr.remove();
    });

    doc.autoTable({
        startY: 25,
        html: table,
        theme: 'striped',
        headStyles: { fillColor: [26, 75, 188] },
        styles: { fontSize: 8 }
    });

    doc.save('Capacitadores.pdf');
    showNotification('Archivo PDF exportado correctamente');
});
