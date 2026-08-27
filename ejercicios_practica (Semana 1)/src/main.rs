use std::{cmp::Ordering, ops::ControlFlow::Break};
fn main() {
    println!("Hello, world!");
}

fn busqueda(matriz : &[[i32;5];5], valor_buscar : i32){
    'filas: for i in 0..=matriz[0].len()-1 {
        for j in 0..=matriz.len()-1{
            match matriz[i][j].cmp(&valor_buscar) {
                Ordering::Less => continue,
                Ordering::Equal => {
                println!("Encontrado");                
                break 'filas;},
                Ordering::Greater => continue,

            }
        }

    }
}

fn raiz(num : u32){
    let mut min = 1;
    let mut max = num;
    'biseccion: loop{
        if min > max {
            break 'biseccion ;
        }
        let medio = min + (max - min) / 2;
        let cuadrado = medio * medio;
        match cuadrado.cmp(&num){
            Ordering::Less => {
                min = medio + 1;
            },
            Ordering::Equal => {
                println!("{medio}");
                break 'biseccion;
            },
            Ordering::Greater =>{
                max = medio - 1;
            },
        }
        }
} 