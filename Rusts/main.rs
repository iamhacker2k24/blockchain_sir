// fn main() {
//     // Define the name variable
//     // let name = "Alice";

//     // Print the name using a placeholder
//     // println!("Hello, {}!", name);
//    let str = String::from("Hello");
//     finder (str);
//     let a =10;
//    let b =40;
//    let ans = add_number(a,b);
//    println!("{}",ans);
//     // println!("{}",str);
//     println!("{}",a);
// }

// fn add_number(x:i32 ,y:i32)->i32{
//     return  x +y;
//     // println!("{}",x+y);
// }
// fn finder (s:String){
//     println!("{}",s);

//     //drop
// }


fn main (){
    let str  = String::from ("Strike is commig");
    // only read me 
   immutable_borrow(&str);
println!("{}", str)
}
fn immutable_borrow (s:&String){
 println!("{}",s)       
}

// 40