// DOMContentLoaded para asegurar que el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const feedback = document.getElementById('feedback');
    const saludo = document.getElementById('saludo');

    // Al cargar, recuperar el nombre guardado en Local Storage (si existe)
    const storedName = localStorage.getItem('nombreUsuario');
    if (storedName) {
        saludo.textContent = `¡Bienvenido de nuevo, ${storedName}!`;
    } else {
        saludo.textContent = 'Por favor, registra tus datos en el formulario.';
    }

    // Evento de envío del formulario
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Validación nativa
        if (!form.checkValidity()) {
            feedback.textContent = 'Por favor completa correctamente todos los campos requeridos.';
            feedback.style.color = "#d90429";
            form.reportValidity(); // Muestra mensajes nativos
            return;
        }

        // Obtener valores
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const edad = document.getElementById('edad').value.trim();
        const pais = document.getElementById('pais').value;

        // Guardar nombre en Local Storage
        localStorage.setItem('nombreUsuario', nombre);

        // Feedback visual
        feedback.textContent = '¡Datos guardados correctamente!';
        feedback.style.color = "#38b000";
        saludo.textContent = `¡Bienvenido, ${nombre}!`;

        // Limpiar el formulario después de un breve retraso
        setTimeout(() => {
            form.reset();
            feedback.textContent = '';
        }, 2000);
    });
});