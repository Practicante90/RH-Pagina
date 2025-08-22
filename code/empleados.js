    const form = document.querySelector('.form-empleado');
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

    form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const requiredFields = [
        'clave', 'apellido_paterno', 'apellido_materno', 'nombres', 'VISA',
        'puesto', 'area', 'fecha_ingreso', 'escolaridad', 'fecha_nacimiento',
        'curp', 'email', 'turno', 'fecha_alta', 'estatus', 'tipo_nomina', 'planta'
    ];

    for (let field of requiredFields) {
        const value = document.getElementById(field).value.trim();
        if (!value) {
        showNotification(`Por favor, complete el campo "${field.replace('_', ' ')}".`, 'error');
        return;
        }
    }

    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Por favor, ingrese un correo electrónico válido.', 'error');
        return;
    }

    const empleado = {
        clave: document.getElementById('clave').value,
        apellido_paterno: document.getElementById('apellido_paterno').value,
        apellido_materno: document.getElementById('apellido_materno').value,
        nombres: document.getElementById('nombres').value,
        VISA: document.getElementById('VISA').value,
        puesto: document.getElementById('puesto').value,
        area: document.getElementById('area').value,
        fecha_ingreso: document.getElementById('fecha_ingreso').value,
        escolaridad: document.getElementById('escolaridad').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        curp: document.getElementById('curp').value,
        email: document.getElementById('email').value,
        turno: document.getElementById('turno').value,
        fecha_alta: document.getElementById('fecha_alta').value,
        estatus: document.getElementById('estatus').value,
        tipo_nomina: document.getElementById('tipo_nomina').value,
        planta: document.getElementById('planta').value
    };

    try {
        const response = await fetch('http://192.168.0.115:3001/api/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empleado)
        });

        if (response.ok) {
            showNotification('Empleado registrado correctamente!');
            form.reset();
        } else {
            const errorText = await response.text(); 
            console.error('Error del servidor:', errorText);
            showNotification('Error al registrar empleado: ' + errorText, 'error');
        }
        } catch (error) {
        console.error(error);
        showNotification('Error de conexión con la API', 'error');
    }
    });
