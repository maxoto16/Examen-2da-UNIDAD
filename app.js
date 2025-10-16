// --- Lógica principal del sistema de asistencia escolar ---
// Variables de estado
let grupos = JSON.parse(localStorage.getItem('grupos') || '[]');
let asistencias = JSON.parse(localStorage.getItem('asistencias') || '{}');
let grupoActual = null;

// Navegación de paneles
document.getElementById('panel-btn').onclick = () => mostrarPanel('panel-section');
document.getElementById('reporte-btn').onclick = () => mostrarPanel('reporte-section');
document.getElementById('estadisticas-btn').onclick = () => mostrarPanel('estadisticas-section');

function mostrarPanel(id) {
  for (const sec of document.querySelectorAll('main section')) sec.classList.remove('active');
  document.getElementById(id).classList.add('active');
  if (id === 'estadisticas-section') renderEstadisticas();
  if (id === 'reporte-section') renderReporteVista();
}

// ---- CRUD de Grupos ----
function crearGrupo() {
  const nombre = document.getElementById('grupo-nombre').value.trim();
  if (!nombre) return alert('Ingresa un nombre de grupo.');
  if (grupos.some(g => g.nombre === nombre)) return alert('El grupo ya existe.');
  grupos.push({ nombre, alumnos: [] });
  guardarDatos();
  renderGrupos();
  document.getElementById('grupo-nombre').value = '';
}

function eliminarGrupo(idx) {
  if (!confirm('¿Eliminar grupo?')) return;
  grupos.splice(idx, 1);
  guardarDatos();
  renderGrupos();
  document.getElementById('alumnos-panel').innerHTML = '';
}

function renderGrupos() {
  const div = document.getElementById('grupos-list');
  div.innerHTML = '<h3>Grupos</h3>';
  grupos.forEach((g, idx) => {
    div.innerHTML += `
      <div class="grupo-item">
        <span>${g.nombre}</span>
        <div>
          <button onclick="eliminarGrupo(${idx})">Eliminar</button>
          <button onclick="abrirGrupo(${idx})" style="background:var(--primary);">Abrir</button>
        </div>
      </div>
    `;
  });
}
renderGrupos();

function abrirGrupo(idx) {
  grupoActual = idx;
  renderAlumnosPanel();
}

// ---- CRUD de Alumnos ----
function agregarAlumno() {
  const nombre = document.getElementById('alumno-nombre').value.trim();
  if (!nombre) return alert('Ingresa el nombre del alumno.');
  if (grupos[grupoActual].alumnos.includes(nombre)) return alert('El alumno ya existe.');
  grupos[grupoActual].alumnos.push(nombre);
  guardarDatos();
  renderAlumnosPanel();
  document.getElementById('alumno-nombre').value = '';
}

function eliminarAlumno(idx) {
  if (!confirm('¿Eliminar alumno?')) return;
  grupos[grupoActual].alumnos.splice(idx, 1);
  guardarDatos();
  renderAlumnosPanel();
}

function renderAlumnosPanel() {
  const grupo = grupos[grupoActual];
  if (!grupo) return;
  let html = `<h3>Alumnos de "${grupo.nombre}"</h3>
    <div style="margin-bottom:1rem;">
      <input type="text" id="alumno-nombre" placeholder="Nombre del alumno">
      <button onclick="agregarAlumno()">Agregar Alumno</button>
    </div>
    <div>
      <button onclick="marcarAsistenciaHoy()">Marcar asistencia hoy</button>
    </div>
    <div>`;
  grupo.alumnos.forEach((al, idx) => {
    html += `
      <div class="alumno-row">
        <span>${al}</span>
        <button onclick="eliminarAlumno(${idx})" style="background:var(--danger);font-size:0.9em;">🗑️</button>
      </div>`;
  });
  html += '</div>';
  document.getElementById('alumnos-panel').innerHTML = html;
}

// ---- Registro de Asistencia ----
function marcarAsistenciaHoy() {
  const grupo = grupos[grupoActual];
  if (!grupo) return;
  let fecha = new Date().toISOString().slice(0,10);
  let registro = asistencias[fecha] = asistencias[fecha] || {};
  registro[grupo.nombre] = registro[grupo.nombre] || {};
  let html = `<h3>Asistencia para "${grupo.nombre}" (${fecha})</h3>`;
  grupo.alumnos.forEach(al => {
    let estado = registro[grupo.nombre][al] || '';
    html += `
      <div class="alumno-row">
        <span>${al}</span>
        <button class="estado-btn presente${estado==='Presente'?' selected':''}" onclick="seleccionarEstado('${fecha}','${grupo.nombre}','${al}','Presente')">Presente</button>
        <button class="estado-btn ausente${estado==='Ausente'?' selected':''}" onclick="seleccionarEstado('${fecha}','${grupo.nombre}','${al}','Ausente')">Ausente</button>
        <button class="estado-btn retardo${estado==='Retardo'?' selected':''}" onclick="seleccionarEstado('${fecha}','${grupo.nombre}','${al}','Retardo')">Retardo</button>
      </div>`;
  });
  document.getElementById('alumnos-panel').innerHTML = html;
}

function seleccionarEstado(fecha, grupo, alumno, estado) {
  asistencias[fecha][grupo][alumno] = estado;
  guardarDatos();
  marcarAsistenciaHoy();
}

// ---- Reportes ----
function descargarReporte(tipo) {
  let fechaHoy = new Date();
  let fechas = Object.keys(asistencias);
  let inicio;
  if (tipo === 'semanal') {
    inicio = new Date(fechaHoy); inicio.setDate(fechaHoy.getDate()-6);
  } else {
    inicio = new Date(fechaHoy); inicio.setDate(fechaHoy.getDate()-29);
  }
  let filas = [];
  grupos.forEach(g => {
    g.alumnos.forEach(al => {
      let fila = [g.nombre, al];
      fechas.forEach(f => {
        let d = new Date(f);
        if (d>=inicio && d<=fechaHoy) {
          let est = (asistencias[f][g.nombre]||{})[al]||'';
          fila.push(est);
        }
      });
      filas.push(fila);
    });
  });
  let contenido = `Grupo,Alumno,${fechas.filter(f=> {
    let d = new Date(f);
    return d>=inicio && d<=fechaHoy;
  }).join(',')}\n`;
  filas.forEach(fila => contenido += fila.join(',')+'\n');
  // Descarga como archivo
  let blob = new Blob([contenido],{type:'text/csv'});
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reporte_${tipo}_${fechaHoy.toISOString().slice(0,10)}.csv`;
  link.click();
}

function renderReporteVista() {
  let div = document.getElementById('reporte-vista');
  div.innerHTML = "<p>Descarga tu reporte semanal o mensual en formato CSV desde los botones arriba.</p>";
}

// ---- Estadísticas Visuales ----
function renderEstadisticas() {
  const canvas = document.getElementById('estadisticas-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 320;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  let data = { Presente: 0, Ausente: 0, Retardo: 0, Total: 0 };
  Object.values(asistencias).forEach(grp => {
    Object.values(grp).forEach(alus => {
      Object.values(alus).forEach(est => {
        if (est) { data[est]++; data.Total++; }
      });
    });
  });
  let porcentajes = {
    Presente: data.Total?Math.round(data.Presente/data.Total*100):0,
    Ausente: data.Total?Math.round(data.Ausente/data.Total*100):0,
    Retardo: data.Total?Math.round(data.Retardo/data.Total*100):0,
  };
  // Dibujar barras
  let colores = [ 'var(--accent)', 'var(--danger)', 'var(--warning)' ];
  let labels = [ 'Presente', 'Ausente', 'Retardo' ];
  let max = Math.max(porcentajes.Presente, porcentajes.Ausente, porcentajes.Retardo, 100);
  labels.forEach((lab,i) => {
    let val = porcentajes[lab];
    ctx.fillStyle = colores[i];
    ctx.fillRect(80+i*140, 320-val*3, 100, val*3);
    ctx.fillStyle = '#222';
    ctx.font = "20px Segoe UI";
    ctx.fillText(lab, 80+i*140, 315);
    ctx.fillText(val+'%', 110+i*140, 320-val*3-10);
  });
  ctx.font = "16px Segoe UI";
  ctx.fillText('Porcentajes generales de asistencia', 120, 30);
}

// ---- Utilidades ----
function guardarDatos() {
  localStorage.setItem('grupos', JSON.stringify(grupos));
  localStorage.setItem('asistencias', JSON.stringify(asistencias));
}

window.onload = () => {
  mostrarPanel('panel-section');
};