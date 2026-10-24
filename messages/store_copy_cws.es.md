Funciones:
- Simula la fecha y la hora para todos los métodos de los objetos Date e Intl.DateTimeFormat, y para Temporal.Now si el navegador lo admite.
- La zona horaria se puede cambiar, con compatibilidad total con los cambios de horario de verano.
- El reloj se puede detener y reanudar.
- Opción para recargar automáticamente la página tras cambiar la fecha.
- Permisos mínimos: solo afecta a la pestaña actual después de hacer clic en el icono de la extensión.

Limitaciones:
- La extensión solo afecta a JavaScript.
- Algunas funciones o animaciones pueden comportarse de forma extraña si el reloj está detenido.
- La extensión no funciona en iframes con el atributo sandbox.

Uso:
- Abre la pestaña en la que quieres cambiar la hora.
- Haz clic en el icono de Extensiones de la barra de herramientas y, a continuación, en Time Travel.
- Elige una fecha en el calendario y ajusta la hora si es necesario, o introduce directamente una fecha y una hora (consulta los ejemplos más abajo).
- Confirma con Intro o haciendo clic en el botón de aplicar, que muestra una vista previa del cambio que se aplicará (p. ej., "Cambiar fecha a 27 abr 2025, 12:40"). La primera vez que se activa la extensión en una pestaña, hay que recargar la página una vez para que se apliquen los cambios.
- Cualquier Date, Intl.DateTimeFormat o Temporal.Now de JavaScript en la pestaña actual devolverá ahora la fecha y hora simuladas que hayas establecido. Las demás pestañas y orígenes no se ven afectados.

Para restablecer la hora del sistema, haz clic en el icono de la extensión y desactiva el interruptor "Simular fecha de JavaScript", o vacía el campo de entrada y pulsa Intro.

Cuando la fecha simulada está activada, el reloj avanza a partir de la hora configurada. La hora actual de la página se muestra en "La página ve:", que también muestra la hora real mientras la extensión está desactivada.
Puedes detener el reloj activando el interruptor "Detener el reloj". La fecha simulada se restablecerá al último valor que hayas establecido.

Para cambiar la zona horaria, activa "Cambiar zona horaria" y selecciona una zona horaria en la lista desplegable.
Cuando está activada, los objetos Date, Intl.DateTimeFormat y Temporal.Now usan esta zona horaria en lugar de la del sistema.
La fecha y la hora introducidas también se interpretan entonces como hora local en la zona horaria seleccionada (la etiqueta del campo muestra p. ej. "Establecer fecha y hora (London)").
Al cambiar a otra zona horaria se conservan la fecha y la hora locales introducidas, lo que puede cambiar el instante representado (salvo que el campo de entrada contenga un instante UTC).

Una insignia junto a la hora efectiva de la página muestra el desfase UTC en uso, con un icono que indica si la fecha cae en horario de verano o en horario estándar.
Al pasar el cursor sobre la insignia se muestran más detalles.

Ejemplos de fechas y formatos:
- 2025-04-27 12:40 - Hora local
- 2025-03-30 00:59:55 - Suponiendo que la zona horaria de tu sistema sea Europe/London (GMT), 5 segundos antes del salto de una hora a las 2 de la madrugada (horario de verano)
- 2025-04-27T12:40Z - Establece el equivalente local de la hora UTC indicada
- 2025-04-27T12:40+1130 - Establece el equivalente local de una hora con un desfase de zona horaria de +11:30. Ten en cuenta que la zona horaria real no cambia
- 2025-03-25T12:40:00.120 - Hora local con milisegundos
- 1731493140025 - Marca de tiempo UNIX

Esta extensión es software de código abierto distribuido bajo la licencia MIT.
