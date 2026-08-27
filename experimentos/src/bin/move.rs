fn construir_correo(usuario: String, dominio: &str) -> String {
    let mut email: String = usuario; 
    email.push_str(dominio);
    email 
}
fn main() {
    let nombre_usuario = String::from("joaquin.ramos");
    let correo_final = construir_correo(nombre_usuario, "@uai.cl");

    println!("Correo asignado: {correo_final}");

    // println!("Usuario: {nombre_usuario}"); // 'nombre_usuario' ya no existe aquí
}
