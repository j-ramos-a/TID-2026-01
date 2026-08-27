fn procesar_cola_mensajes<'a, 'b>(cola: &'a mut Vec<String>) -> &'b String {
    let mensaje_urgente = &cola[0];
    cola.push(String::from("ALERTA_CRITICA"));
    drop(cola);

    mensaje_urgente
}

fn main() {
    let mut mensajes = vec![
        String::from("PING_HEARTBEAT"),
        String::from("CONEXION_ESTABLECIDA"),
    ];

    procesar_cola_mensajes(&mut mensajes);
}