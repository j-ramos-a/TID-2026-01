use std::io;
use std::cmp::Ordering;

fn main() {
    println!("Guess the number!");

    let aleatorio:u32 = rand::random_range(0..=100);

    println!("Please input your guess. {aleatorio}");

    let mut guess = String::new();

    if let Err(_) = io::stdin().read_line(&mut guess) {
        println!("Error al leer de la consola");
        return;
    }

    let guess: u32 = match guess.trim().parse() {
        Ok(adivinado) => adivinado,
        Err(_) => {
            println!("Ingrese un número válido");
            return; 
        }
    };
    println!("You guessed: {guess}");


    match guess.cmp(&aleatorio) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
    
}
