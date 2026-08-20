
struct Book {
    name: String,
    author: String,
    page_count: i32,
    price: i32,
}

fn main() {
    // let name = String::from("How to wins friends and influensers");
    // let author =  String::from("dale careneggie");
    // let page_count =120;
    // let price = 400;

    let book1 = Book {
        name: String::from("how to friends and influence peoplrl"),
        author: String::from("dale careggie"),
        page_count: 200,
        price: 500,
    };
    let book2 = Book {
        name: String::from("Rich Dad"),
        author: String::from("Robbart"),
        page_count: 200,
        price: 500,
    };
    let book3 = Book {
        name: String::from("do beloki katha "),
        author: String::from("Munsi prem chandra"),
        page_count: 200,
        price: 1000,
    };
    // let a = (32,96,"rohit bhiys");
    // let a = (String::from("How to win friends and influence people"),String::from("Dale carneggie"),200);
    // let b= 1;
    let books = vec![book1, book2, book3];
    for temp in &books {
        println!(
            "name :{}, author:{} ,pagecount:{} ,price:{} ",
            temp.name, temp.author, temp.page_count, temp.price
        );
    }
    // println!("{}",a.1);
    // println!("{}", book2.name);
    // println!("{}", book2.author);
    // println!("{}", book2.page_count);
    // println!("{}", book2.price);
}
// 30
