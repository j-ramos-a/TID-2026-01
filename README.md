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
- Borrowing: Es la forma en que accedes a una variable a través de una referencia, por ende no se le retira el permiso R, sin embargo no puede ocurrir escritura ni permisos OWN para evitar punteros inconsistentes con la variable original, lo que permite tener acceso a la lectura de esta sin perder lo importante (variable inicial), los permisos se recuperan al liberar la referencia 
- Referencias mutables: Son aquellas referencias que nos permiten tener acceso al permiso de escritura al dato original desde esta nueva variable. Unicamente se puede mantener una referencia en pie, para evitar paralelismos y punteros que no lleven a nada.
- Slice: Es una referencia (compuesta por una dirección de memoria y una longitud) que permite acceder a una secuencia de elementos dentro de una colección (String, arreglo o Vec) sin asumir su propiedad. Al tratarse de un préstamo sobre una porción del dato original, suspende temporalmente los permisos W y O del contenedor mientras el slice siga en uso.

# Tercera semana:
## 1. ¿Qué es Ethereum?
Ethereum es una máquina de estado global, única y determinista (*World State Machine*), ejecutada de forma descentralizada por una red de nodos mediante la Máquina Virtual de Ethereum (EVM). La red opera como una computadora mundial distribuida donde las transacciones son el único mecanismo capaz de hacer avanzar su estado de un punto al siguiente.

---

## 2. Componentes Base y Definiciones

### Cuentas (Accounts)
Existen dos tipos de cuentas bajo el mismo formato de dirección de 20 bytes (`0x...`)
* **EOA (Externally Owned Account):** Cuentas controladas por usuarios del mundo real mediante un par de claves criptográficas (pública/privada). No tienen código asociado ni almacenamiento son las únicas entidades capaces de iniciar transacciones en la red.
* **Cuentas de Contrato (Smart Contracts):** Cuentas autónomas controladas exclusivamente por su propio código compilado (*bytecode*). Poseen balance en Ether y almacenamiento persistente de variables. No poseen clave privada ni actúan por sí solas, permanecen inactivas hasta que una transacción externa activa su ejecución.

### Transacciones
Mensajes binarios firmados digitalmente (algoritmo ECDSA: componentes $r, s, v$) emitidos por una EOA y transmitidos por la red. Sus campos esenciales son:
* **Nonce:** Contador secuencial de transacciones enviadas por la cuenta, preserva el orden lógico de inclusión y previene ataques de repetición.
* **To:** Dirección de destino (otra EOA o un contrato). Si se envía a la dirección cero (`0x0`), el protocolo interpreta que la transacción es de creación/despliegue de un nuevo contrato.
* **Value:** Cantidad de Ether (denominada en Wei, donde $1\text{ ETH} = 10^{18}\text{ Wei}$) transferida al destinatario.
* **Data / Calldata:** Si el destino es un contrato, viajan el selector de función (primeros 4 bytes del hash Keccak-256) y los argumentos serializados bajo la especificación ABI.

### Máquina Virtual de Ethereum (EVM)
El entorno de ejecución aislado, determinista y Turing-completo donde se procesa el código de los contratos inteligentes. En la ejecución de transacciones si ocurre un error, el estado se revierte exactamente a como estaba antes de la transacción.

### Gas y Modelo Económico (EIP-1559)
El gas es la unidad virtual utilizada para cuantificar el costo computacional de almacenamiento y ejecución en la EVM, resolviendo el problema de la parada y evitando ataques de denegación de servicio (DoS).
* **Gas Limit:** Límite máximo de unidades de gas autorizado para consumir en la transacción.
* **Base Fee:** Tarifa mínima obligatoria por unidad de gas fijada por el protocolo. Se calcula dinámicamente bloque a bloque según la saturación de espacio y se quema de forma permanente al procesar la transacción.
* **Priority Fee (Propina):** Pago voluntario por unidad de gas que se entrega directamente al validador para incentivar la priorización e inclusión del bloque.

## Avance
Se realizo lectura guiada de las clases y lectura sobre Ethereum, ademas de la actividad final y la evaluación entregada por el profesor (Coffee.sol y counter.sol). Para el desarrollo de estas se realizo con el apoyo del LLM Gemini 3.8, para la comprensión de los ejercicios de cada clase y la guía en el desarrollo de las actividades finales, con tal de comprender los métodos y funciones completamente.
