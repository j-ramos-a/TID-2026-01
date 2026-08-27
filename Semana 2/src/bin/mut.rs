fn formatear_alerta(alerta: &mut String) {
    if alerta.len() == 0 {
        alerta.replace_range(.., "SIN DETALLES");
    } else {
        alerta.push_str(" [ESTADO: PENDIENTE]");
        alerta.push('!');
    }
}

fn main() {
    let mut mensaje = String::from("Falla en el disco");
    formatear_alerta(&mut mensaje); 
    println!("{mensaje}"); 

    let mut mensaje_vacio: String = String::new();
    formatear_alerta(&mut mensaje_vacio);

    println!("{mensaje_vacio}"); 
}