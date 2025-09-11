const form = document.getElementById("calificacionForm");
const programacionSelect = document.getElementById("programacion");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notification-message");
const notificationClose = document.getElementById("notification-close");

async function cargarProgramaciones() {
  try {
    const res = await fetch("http://192.168.0.115:3001/api/programacionCursos"); 
    if (!res.ok) throw new Error("Error al cargar programaciones");

    const programaciones = await res.json();

    programacionSelect.innerHTML = ""; // limpiar
    programaciones.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${p.nombre_curso} - ${p.nombre_capacitador} (${new Date(p.fecha_inicio).toLocaleDateString()})`;
      programacionSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    showNotification("No se pudieron cargar las programaciones ❌", "error");
  }
}

function showNotification(message, type = "success") {
  notificationMessage.textContent = message;
  notification.className = "notification " + (type !== "success" ? type : "");
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      notification.style.display = "none";
      notification.style.animation = "slideIn 0.3s ease-out";
    }, 300);
  }, 3000);
}

notificationClose.addEventListener("click", () => {
  notification.style.display = "none";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    programacion_id: programacionSelect.value,
    calificacion: document.getElementById("calificacion").value,
    observaciones: document.getElementById("observaciones").value
  };

  try {
    const res = await fetch("http://192.168.0.115:3001/api/calificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Error al registrar");

    await res.json();
    showNotification("Calificación registrada correctamente ✅", "success");
    form.reset();
    cargarProgramaciones(); 
  } catch (err) {
    console.error(err);
    showNotification("Error al registrar la calificación ❌", "error");
  }
});

cargarProgramaciones();
