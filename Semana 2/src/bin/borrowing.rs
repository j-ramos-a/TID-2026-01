fn validar_formato_clave(clave: &String) -> bool {
    let longitud_correcta: bool = clave.len() >= 8;
    let contiene_simbolo: bool = clave.contains('-') || clave.contains('_');
    let contiene_digito: bool = clave.chars().any(|c| c.is_ascii_digit());

    longitud_correcta && contiene_simbolo && contiene_digito
}

fn main() {
    let token: String = String::from("clave-fdsd-9021");
    let es_segura: bool = validar_formato_clave(&token); 

    if es_segura {
        println!("El token '{token}' cumple con las reglas de seguridad.");
    }
}