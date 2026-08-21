// // //here we laern enum

// // enum State {
// //     connecting,
// //     disconnected,
// //     connected,
// // }
// // fn main() {
// //     let systemConnection = State::connecting;
// //     match systemConnection{
// //         State::connected=>println!("Your system is connected "),
// //         State::disconnected=>println!("Your system is disconnected"),
// //         State::connecting=>println!("i am connecting"),
// //     }
// // }

// // enum Traffic {
// //     Red,
// //     Green,
// //     Yellow,
// // }
// // fn main() {
// //     let light = Traffic::Green;
// //     match light {
// //         Traffic::Red => println!("You have to stop"),
// //         Traffic::Green => println!("you can go"),
// //         Traffic::Yellow => println!("Please stop "),
// //     }
// // }

// enum Messsage {
//     Quit,                    //no Data
//     Text(String),            //Tuples
//     Move { x: i32, y: i32,z:i32 }, //structure
// }

// fn matching(msg: &Messsage) {
//     match msg {

//         Messsage::Text(content) => println!("our {}", content),
//         _=>{},
//         //  Messsage::Quit => println!("thre is no Messsage"),
//         // Messsage::Move { x, y,z } => println!("value is {} {} {}", x, y,z),
//     }
// }
// fn main() {
//     let msg1 = Messsage::Text(String::from("Dev "));
//     let msg2 = Messsage::Quit;
//     let msg3 = Messsage::Move { x: 20, y: 40,z:60 };
//     matching(&msg1);
//     matching(&msg2);
//     matching(&msg3);
// }

// // 30

// enum Option<T> {
//     Some(T),
//     None,
//     Hell { x: i32, y: i32 },
// }

// fn matching<T: std::fmt::Display>(msg: &Option<T>) {
//     match msg {
//         Option::Some(value) => println!("{}", value),
//         Option::None => println!("Nothing to display"),
//         Option::Hell { x, y } => println!("{}{}", x, y),
//     }
// }

// fn main() {
//     let m1 = Option::Some(10);
//     let m2 = Option::Some(String::from("Hello ji"));
//     let m3: Option<i32> = Option::None;
//     let m4: Option<i32> = Option::Hell { x: 20, y: 40 };
//     matching(&m1);
//     matching(&m2);
//     matching(&m3);
//     matching(&m4);
// }

// fn divide (x:i32,y:i32)->Result<i32, String>{
//     if y==0{
//         return Result::Err(String::from("Division is not possible "));
//     }
//     else
//     return Result::Ok(x / y);
// }
// fn main(){
//      let Result =divide(10,2);
//      match Result{
//         Result ::ok(value)=>println!("{}",value),
//         Result::Err(error)=>println!("{}",error),
//      }
// }



enum Traffic {
    Red,
    Yellow,
    Green,
}

impl Traffic {
    fn new() -> Self {
        Traffic::Red
    }
    fn next(&self) -> Traffic {
        match self {
            Traffic::Red => Traffic::Green,
            Traffic::Green => Traffic::Yellow,
            Traffic::Yellow => Traffic::Red,
        }
    }

    //duration 

    fn duration(&self) -> i32 {
        match self {
            Traffic::Red => 60,
            Traffic::Green => 45,
            Traffic::Yellow => 10,
        }
    }
    //can cross

    fn can_cross(&self) -> bool {
        match self {
            Traffic::Green => true,
            _ => false,
        }
    }
}

fn main() {
    let light = Traffic::new();
    let  dur = light.duration();
    println!("{}", dur);
    println!("{}", light.can_cross()); 
}
