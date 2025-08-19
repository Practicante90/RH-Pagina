const tablaCursos = document.getElementById('tablaCursos');
const modal = document.getElementById('modalEditar');
const closeModal = document.querySelector('.close');
const formEditar = document.getElementById('formEditarCurso');

async function cargarCursos() {
  try {
    const response = await fetch('http://192.168.0.115:3001/api/cursos');
    const cursos = await response.json();

    tablaCursos.innerHTML = cursos.map(curso => `
      <tr>
        <td>${curso.id}</td>
        <td>${curso.nombre}</td>
        <td>${curso.descripcion}</td>
        <td><button class="editar-btn" data-id="${curso.id}" data-nombre="${curso.nombre}" data-descripcion="${curso.descripcion}">✏️</button></td>
      </tr>
    `).join('');

    document.querySelectorAll('.editar-btn').forEach(btn => {
      btn.addEventListener('click', () => abrirModalEditar(btn.dataset));
    });

  } catch (error) {
    console.error(error);
    tablaCursos.innerHTML = `<tr><td colspan="4">Error al cargar los cursos</td></tr>`;
  }
}

function abrirModalEditar(data) {
  document.getElementById('cursoId').value = data.id;
  document.getElementById('cursoNombre').value = data.nombre;
  document.getElementById('cursoDescripcion').value = data.descripcion;
  modal.style.display = 'block';
}

closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; }

formEditar.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cursoId').value;
  const nombre = document.getElementById('cursoNombre').value;
  const descripcion = document.getElementById('cursoDescripcion').value;

  try {
    const response = await fetch(`http://192.168.0.115:3001/api/cursos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion })
    });

    if(response.ok){
      alert('Curso actualizado correctamente');
      modal.style.display = 'none';
      cargarCursos();
    } else {
      alert('Error al actualizar curso');
    }

  } catch (error) {
    console.error(error);
    alert('Error de conexión');
  }
});

cargarCursos();
