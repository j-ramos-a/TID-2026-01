# Primera semana de avance: 
Desarrolle los capítulos del 1 al 3 del libro interactivo (https://rust-book.cs.brown.edu).
Esta etapa me sirvió como profundización sobre aquellos temas que ya manejaba pero me ayudaron a dominar con mayor facilidad.
Tambien desarrolle los rutlings respectivos.
## Cosas que aprendi:
- Mayor manejo e entendimiento de las variables del tipo Result
- Comprensión sobre el funcionamiento de match
- Familiarizar con variables array y tuples
- Modulo cmp y metodo Ordering
- Conoci y entendi lo que eran las etiquetas para los ciclos loop
## Que no entendi?
- Manejo de overflow en variables u/isize utilizando metodos wrapping_add, checked_, overflowing_, saturating_.
  No logro encontrar una verdadera utilidad a estos métodos, para la próxima semana haré unos pequeños programas
  practicos para analizarlos.

## Para la proxima semana:
- Terminar capitulo 4 del libro
- Desarrollar un ejercicios utilizando structs e implementaciones en rust, a través de un ejercicio de recepción de vectores.
- Desarrollar tres programas mas entorno a las instrucciones del profesor para los experimentos.

# Segunda semana:
## Que es move, borrowing, referencias mutables y slice?

Primero debemos considerar que rust es un lenguaje que maneja en tiempo de compilación la liberación y manejo de la memoria, por lo que mantiene varias medidas de seguridad y anti-ambiguedad para lograrlo.
- Move: Ocurre cuando le entregamos a una funcion un tipo de dato que no mantiene referencia ni copy (posterior en el ámbito) por lo que esta variable pierde todos los permisos (R, W, O). Por lo que al cerrar el ámbito de la función, se libera esta memoria (que fue traspasada a una variable que solo vive en la funcion misma) al cerrar el ámbito
- Borrowing: Es la forma en que accedes a una variable a través de una referencia, por ende no se le retiran los permisos, lo que permite tener acceso a la lectura de esta sin perder lo importante (variable inicial)
- Referencias mutables: Son aquellas referencias que nos permiten tener acceso al permiso de escritura al dato original desde esta nueva variable. Unicamente se puede mantener una referencia en pie, para evitar paralelismos y punteros que no lleven a nada.
- Slice: Es una referencia que posee una longitud y la respectiva dirección de memoria, que nos lleva a una secuencia de caracteres ya sean tipo String o Vec. Al ser simplemente un puntero con permiso de lectura impide tambien la modificación del dato original.
