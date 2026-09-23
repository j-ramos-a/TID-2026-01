fn main() {
    struct Point { x: i32, y: i32 }

    let mut p = Point { x: 0, y: 0 };
    let x = &mut p.x;
    *x += 1;
    println!("{}, {}", p.x, p.y);
}