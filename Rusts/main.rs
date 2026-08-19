// // fn main() {
// //     // Define the name variable
// //     // let name = "Alice";

// //     // Print the name using a placeholder
// //     // println!("Hello, {}!", name);
// //    let str = String::from("Hello");
// //     finder (str);
// //     let a =10;
// //    let b =40;
// //    let ans = add_number(a,b);
// //    println!("{}",ans);
// //     // println!("{}",str);
// //     println!("{}",a);
// // }

// // fn add_number(x:i32 ,y:i32)->i32{
// //     return  x +y;
// //     // println!("{}",x+y);
// // }
// // fn finder (s:String){
// //     println!("{}",s);

// //     //drop
// // }

// fn main() {
//     let mut str = String::from("Strike is comming");

//     mutable_borrow(&mut str);

//     println!("{}", str);
// }

// fn immutable_borrow(s: &String) {
//     println!("{}", s);
// }

// fn mutable_borrow(s: &mut String) {
//     s.push_str(" hi");
//     println!("{}", s);
// }

// // 40

//non primitve data int type 
// 11.11->25
fn main(){
    //  let mut a = " Rohit"; //wehere did this memory allocate => not in the stack  in the code as static
    //  a.push_str("Neigi");
    //  println!("{}",a);
    //  let  a =[10,20,30];
    //  println!("{:?}",a);
    // let mut arr :Vec<i32>= Vec::new();
    // arr.push(300);
    // println!("{:?}",arr)

    // let mut arr  = vec ![10,20,30];
    // let newline = "next";
    // arr.push(90);
    //  println!("{:?}",arr);
    //  println!("{}",arr.len());
    //  println!("{:p}",arr.as_ptr());
    //  println!("{:p}",&arr);
    //   println!("{:p}",&arr[0]);
    //    println!("{:p}",&arr[1]);
    // //    for num in 0..=3{
    // //     println!("{}",arr[num]);
    // //    }
    // //    println!("{}",newline);
    // //    for num in arr{
    // //     println!("{}",num);
    // //    }
    //     println!("{}",newline);

    //    for num in  &mut arr{
    //     *num +=2;
    //     println!("{}",num);
    //    }
       

//     let mut v: Vec <String>=Vec ::new ();
//      v.push(String::from("Rohit"));
//      v.push(String::from("Dev"));
//      v.push(String::from("Arka"));
//      v.push(String::from("Devika"));
//       v.insert(2,String::from("Manish ji"));
// println!("{:?}",v);

 let   v = vec ![60,32,5,65];
//   let a = &v[1..3]; //let a: &[i32]= &v[1..3];
//    println!("{:?}",a);

let sum = add_number(&v[0..2]);
println!("{}",sum);


}

 fn add_number(arr:&[i32])->i32{
    let mut sum =0;
    for num in arr{
        sum += *num;
    }
    sum
 }