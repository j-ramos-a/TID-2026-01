fn parsear_registro_clave_valor(linea: &str) -> (&str, &str) {
    let separador = linea.find(':').unwrap_or(linea.len());

    let clave = &linea[..separador];
    let valor = if separador < linea.len() {
        &linea[separador + 1..]
    } else {
        ""
    };

    (clave.trim(), valor.trim()) // Retorna referencias (vistas) a la memoria original
}

fn main() {
    let registro: String = String::from("HTTP_STATUS : 404_NOT_FOUND");
    let (clave, valor) = parsear_registro_clave_valor(&registro);

    println!("Etiqueta: [{clave}]");
    println!("Contenido: [{valor}]");
    println!("Línea completa original: {registro}"); // ✅ La cadena original sigue intacta
}