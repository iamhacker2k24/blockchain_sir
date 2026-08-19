 
 struct Book{
    name:String ,
    author :String,
    page_count:i32,
    price:i32
 }

fn main(){

    // let name = String::from("How to wins friends and influensers");
    // let author =  String::from("dale careneggie");
    // let page_count =120;
    // let price = 400;
    

    let book1 = Book{
        name:String::from("how to friends and influence peoplrl"),
        author:String::from("dale careggie"),
        page_count:200,
        price:500
    };
 let book2 = Book{
        name:String::from("Rich Dad"),
        author:String::from("Robbart"),
        page_count:200,
        price:500
    };
    let a = (32,96,"rohit bhiys");
    println!("{}",a.0);
println!("{}", book2.name);
}
// 30