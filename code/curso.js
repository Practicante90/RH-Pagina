const formCurso = document.getElementById('formCurso');
const mensajeCurso = document.getElementById('mensajeCurso');

formCurso.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  if (!nombre || !descripcion) {
    mostrarMensaje('Todos los campos son obligatorios.', 'error');
    return;
  }

  try {
    const response = await fetch('http://192.168.0.115:3001/api/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion })
    });

    if (response.ok) {
      mostrarMensaje('Curso guardado correctamente', 'exito');
      formCurso.reset();
    } else {
      mostrarMensaje('Error al guardar el curso', 'error');
    }
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error en la conexión con la API', 'error');
  }
});

function mostrarMensaje(texto, tipo) {
  mensajeCurso.textContent = texto;
  mensajeCurso.className = `mensaje ${tipo}`;
  mensajeCurso.style.display = 'block';

  setTimeout(() => {
    mensajeCurso.style.display = 'none';
  }, 4000);
}
