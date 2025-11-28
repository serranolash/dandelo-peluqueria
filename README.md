# Dandelo Peluquería – PWA Rock/Metal + Gestión de Turnos

Ahora el panel admin incluye:

- Sección **Turnos agendados** con tarjetas.
- Cada turno muestra: cliente, fecha, hora, servicio, estilista, contacto, precio y estado.
- Estados posibles: `pendiente`, `confirmado`, `cancelado`.
- Botones para **Confirmar** o **Cancelar** (ideal si hay emergencias y hay que avisar rápido).
- Filtro "Solo pendientes" para enfocarse en lo que falta resolver.

Los turnos se leen del mismo LocalStorage que escribe el front de cliente (`dandelo_appointments`).

Estética: fondo oscuro psicodélico + logo de león estilo rock/metal.
