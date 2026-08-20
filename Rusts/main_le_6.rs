// //here we laern enum

// enum State {
//     connecting,
//     disconnected,
//     connected,
// }
// fn main() {
//     let systemConnection = State::connecting;
//     match systemConnection{
//         State::connected=>println!("Your system is connected "),
//         State::disconnected=>println!("Your system is disconnected"),
//         State::connecting=>println!("i am connecting"),
//     }
// }

// enum Traffic {
//     Red,
//     Green,
//     Yellow,
// }
// fn main() {
//     let light = Traffic::Green;
//     match light {
//         Traffic::Red => println!("You have to stop"),
//         Traffic::Green => println!("you can go"),
//         Traffic::Yellow => println!("Please stop "),
//     }
// }

enum Messsage {
    Quit,                    //no Data
    Text(String),            //Tuples
    Move { x: i32, y: i32,z:i32 }, //structure
}

fn matching(msg: &Messsage) {
    match msg {
       
        Messsage::Text(content) => println!("our {}", content),
         Messsage::Quit => println!("thre is no Messsage"),
        Messsage::Move { x, y,z } => println!("value is {} {} {}", x, y,z),
    }
}
fn main() {
    let msg1 = Messsage::Text(String::from("Dev "));
    let msg2 = Messsage::Quit;
    let msg3 = Messsage::Move { x: 20, y: 40,z:60 };
    matching(&msg1);
    matching(&msg2);
    matching(&msg3);
}


// 30