use std::collections::HashMap;

struct LogPeticion { 
    ip: String,
    codigo: u16,
    tiempo_ms: u32,
}

#[derive(Debug)]
struct EstadisticasIP {
    total_peticiones: u32,
    peticiones_fallidas: u32, 
    tiempo_total_ms: u32,
}

impl LogPeticion {
    fn desde_linea(linea: &str) -> Result<Self, String> {
        let partes: Vec<&str> = linea.split(",").collect();
        if partes.len() < 4 {
            return Err(String::from("Formato Invalido"));
        }
        let ip: String = partes[0].to_string();
        let codigo: u16 = match partes[2].trim().parse() {
            Ok(num) => num,
            Err(_) => return Err(String::from("Ingreso fallido")),
        };
        let tiempo_ms: u32 = match partes[3].trim().parse() {
            Ok(num) => num,
            Err(_) => return Err(String::from("Ingreso fallido")),
        };
        Ok(LogPeticion { 
            ip,
            codigo,
            tiempo_ms,
        })
    }
}

fn main() {
    let logs_crudos = vec![
        "192.168.1.5,GET,200,45",
        "10.0.0.12,POST,403,120",
        "192.168.1.5,POST,500,800",
        "LINEA_CORRUPTA_SIN_SENTIDO", 
        "10.0.0.12,GET,404,15",
        "192.168.1.5,GET,200,30",
        "10.0.0.12,POST,503,250",
        "10.0.0.15,GET,200,hola",      
        "10.0.0.15,GET,200,50",
    ];

    let mut base_datos: HashMap<String, EstadisticasIP> = HashMap::new();

    for linea in logs_crudos {
        match LogPeticion::desde_linea(linea) {
            Ok(log) => {
                let es_fallida = if log.codigo >= 400 { 1 } else { 0 };

                if let Some(stats) = base_datos.get_mut(&log.ip) {
                    stats.total_peticiones += 1;
                    stats.peticiones_fallidas += es_fallida;
                    stats.tiempo_total_ms += log.tiempo_ms;
                } else {
                    base_datos.insert(
                        log.ip,
                        EstadisticasIP {
                            total_peticiones: 1,
                            peticiones_fallidas: es_fallida,
                            tiempo_total_ms: log.tiempo_ms,
                        },
                    );
                }
            }
            Err(e) => {
                println!("Error al procesar la línea \"{}\": {}", linea, e);
            }
        }
    }

    println!("\n--- Inventario Completo de IPs ---");
    println!("{:#?}", base_datos);

    println!("\n--- Alertas de Seguridad ---");
    for (ip, stats) in &base_datos {
        if stats.peticiones_fallidas > 2 {
            println!(
                "⚠️ [ALERTA] La IP {} superó el límite con {} peticiones fallidas.",
                ip, stats.peticiones_fallidas
            );
        }
    }
}