// struct Rectangle {
//     width: i32,
//     height: i32,
// }

// struct square {
//     length:i32
// }

// fn area(rec:&Rectangle)->i32{
//     rec.height*rec.width
// }

// fn main() {
//     let r1 = Rectangle {
//         width: 100,
//         height: 20,
//     };
//      println!("{}",area(&r1));
// }

struct Rectangle {
    width: i32,
    height: i32,
}
impl Rectangle {
    fn new(width: i32, height: i32) -> Self {
        Self { width, height }
    }
    fn area(&self) -> i32 {
        self.height * self.width
    }
    fn length(&self) -> i32 {
        self.height
    }
    fn double(&mut self) {
        self.height *= 2;
        self.width *= 3;
    }
    fn compare(&self, other: &Rectangle) -> bool {
        self.height * self.width > other.height * other.width
    }
}
fn main() {
    // let mut r1 = Rectangle {
    //     width: 100,
    //     height: 20,
    // };
    let mut r1 = Rectangle::new(10, 20);
    let  r2 = Rectangle::new(15, 18);
    println!("{}", r1.area());
    println!("{}",r1.compare(&r2));
    r1.double();
    println!("{}", r1.length());
}
