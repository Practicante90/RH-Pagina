const apiProgramacion = "http://192.168.0.115:3001/api/programacionCursos";
const apiEmpleados = "http://192.168.0.115:3001/api/empleados";
const apiGuardar = "http://192.168.0.115:3001/api/empleadosPorCurso";

let notificationTimeout;
let empleadosSeleccionados = [];

function showNotification(message, type = "success", duration = 5000) {
    const notification = document.getElementById("notification");
    const messageEl = document.getElementById("notification-message");
    const closeBtn = document.getElementById("notification-close");

    clearTimeout(notificationTimeout);

    notification.className = "notification " + type;
    messageEl.textContent = message;
    notification.style.display = "block";
    notification.style.animation = "slideIn 0.3s forwards";

    notificationTimeout = setTimeout(() => {
        notification.style.animation = "slideOut 0.3s forwards";
        setTimeout(() => {
            notification.style.display = "none";
            notification.style.animation = "";
        }, 300);
    }, duration);

    closeBtn.onclick = () => {
        clearTimeout(notificationTimeout);
        notification.style.animation = "slideOut 0.3s forwards";
        setTimeout(() => {
            notification.style.display = "none";
            notification.style.animation = "";
        }, 300);
    };
}

async function cargarProgramacion() {
    try {
        const res = await fetch(apiProgramacion);
        const data = await res.json();
        const select = document.getElementById("programacion");
        data.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = `${p.nombre_curso} - ${p.nombre_capacitador} (Inicio: ${p.fecha_inicio})`;
            select.appendChild(option);
        });
    } catch (error) {   
        showNotification("Error al cargar la programación", "error");
    }
}

async function cargarEmpleados() {
    try {
        const res = await fetch(apiEmpleados);
        const data = await res.json();
        const datalist = document.getElementById("empleadosList");
        data.forEach(e => {
            const option = document.createElement("option");
            option.value = `${e.nombres} ${e.apellido_paterno} ${e.apellido_materno}`;
            option.dataset.id = e.id;
            datalist.appendChild(option);
        });
    } catch (error) {
        showNotification("Error al cargar empleados", "error");
    }
}

document.getElementById("empleado_id").addEventListener("change", function () {
    const input = this.value.trim();
    if (!input) return;

    const option = Array.from(document.getElementById("empleadosList").options)
                        .find(opt => opt.value === input);
    if (!option) return;

    const empleadoId = option.dataset.id;
    if (empleadosSeleccionados.some(e => e.id === empleadoId)) {
        this.value = "";
        return;
    }

    empleadosSeleccionados.push({ id: empleadoId, nombre: input });
    mostrarEmpleadosSeleccionados();
    this.value = "";
});

function mostrarEmpleadosSeleccionados() {
    const contenedor = document.getElementById("empleados-seleccionados");
    contenedor.innerHTML = "";
    empleadosSeleccionados.forEach(e => {
        const div = document.createElement("div");
        div.className = "empleado-chip";
        div.textContent = e.nombre;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "x";
        btn.onclick = () => {
            empleadosSeleccionados = empleadosSeleccionados.filter(emp => emp.id !== e.id);
            mostrarEmpleadosSeleccionados();
        };
        div.appendChild(btn);
        contenedor.appendChild(div);
    });
}

document.getElementById("formCapacitador").addEventListener("submit", async (e) => {
    e.preventDefault();

    const programacionValue = document.getElementById("programacion").value;
    const calificacionValue = document.getElementById("calificacion").value.trim();
    const observacionesValue = document.getElementById("observaciones").value.trim();

    for (let emp of empleadosSeleccionados) {
        const formData = {
            programacion_id: programacionValue,
            empleado_id: emp.id,
            asistencia: document.getElementById("asistencia").checked,
            aprobado: document.getElementById("aprobado").checked,
            calificacion: parseFloat(calificacionValue),
            observaciones: observacionesValue,
            certificado_enviado: document.getElementById("certificado_enviado").checked,
        };

        try {
            const res = await fetch(apiGuardar, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                const errorText = await res.text();
                showNotification("Error al guardar: " + errorText, "error");
                return;
            }
        } catch (error) {
            showNotification("Error de conexión con el servidor", "error");
            return;
        }
    }

    showNotification("Registro(s) guardado(s) correctamente", "success");
    empleadosSeleccionados = [];
    mostrarEmpleadosSeleccionados();
    e.target.reset();
});

cargarProgramacion();
cargarEmpleados();
