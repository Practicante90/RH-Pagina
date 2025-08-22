const apiEmpleados = 'http://192.168.0.115:3001/api/empleados';
const apiCursos = 'http://192.168.0.115:3001/api/cursos';
const apiCapacitadores = 'http://192.168.0.115:3001/api/capacitadores';
const apiProgramacion = 'http://192.168.0.115:3001/api/programacionCursos'

async function actualizarStats() {
  try {
    
    const resEmp = await fetch(apiEmpleados);
    const empleados = resEmp.ok ? await resEmp.json() : [];
    document.getElementById('empleados-count').textContent = empleados.length;

    const resCursos = await fetch(apiCursos);
    const cursos = resCursos.ok ? await resCursos.json() : [];
    document.getElementById('cursos-count').textContent = cursos.length;

    const resCap = await fetch(apiCapacitadores);
    const capacitadores = resCap.ok ? await resCap.json() : [];
    document.getElementById('capacitadores-count').textContent = capacitadores.length;

    const resProm = await fetch(apiProgramacion);
    const programacion = resProm.ok ? await resProm.json() : [];
    document.getElementById('programacion-count').textContent = programacion.length

  } catch (error) {
    console.error(error);
    document.getElementById('empleados-count').textContent = 'Error';
    document.getElementById('cursos-count').textContent = 'Error';
    document.getElementById('capacitadores-count').textContent = 'Error';
    document.getElementById('programacion-count').textContent = 'Error'
  }
}

window.addEventListener('DOMContentLoaded', actualizarStats);
