const formCurso = document.getElementById('formCurso');
const mensajeCurso = document.getElementById('mensajeCurso');
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

formCurso.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  if (!nombre || !descripcion) {
    showNotification('Todos los campos son obligatorios.', 'error');
    return;
  }

  try {
    const response = await fetch('http://192.168.0.115:3001/api/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion })
    });

    if (response.ok) {
      showNotification('Curso guardado correctamente', 'success');
      formCurso.reset();
    } else {
      showNotification('Error al guardar el curso', 'error');
    }
  } catch (error) {
    console.error(error);
    showNotification('Error en la conexión con la API', 'error');
  }
});
