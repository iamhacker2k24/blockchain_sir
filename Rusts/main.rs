fn main() {
    // Define the name variable
    let name = "Alice";

    // Print the name using a placeholder
    println!("Hello, {}!", name);
    let a =10;
   let b =40;
   let ans = add_number(a,b);
   println!("{}",ans);
}

fn add_number(x:i32 ,y:i32)->i32{
    return  x +y;
    // println!("{}",x+y);
}