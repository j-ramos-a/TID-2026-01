fn procesar_cola_mensajes<'a>(cola: &'a mut Vec<String>) -> &'a String {
    cola.push(String::from("ALERTA_CRITICA"));
    let mensaje_urgente = &cola[0];

    mensaje_urgente
}

fn main() {
    let mut mensajes = vec![
        String::from("PING_HEARTBEAT"),
        String::from("CONEXION_ESTABLECIDA"),
    ];

    let primer_mensaje = procesar_cola_mensajes(&mut mensajes);

    println!("Primer mensaje: {primer_mensaje}");
    println!("Total en cola: {}", mensajes.len());
}