const form = document.querySelector('.form-empleado');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const empleado = {
    clave: document.getElementById('clave').value,
    apellido_paterno: document.getElementById('apellido_paterno').value,
    apellido_materno: document.getElementById('apellido_materno').value,
    nombres: document.getElementById('nombres').value,
    visa: document.getElementById('visa').value,
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
      alert('Empleado registrado correctamente!');
      form.reset();
    } else {
      alert('Error al registrar empleado');
    }
  } catch (error) {
    console.error(error);
    alert('Error de conexión con la API');
  }
});
