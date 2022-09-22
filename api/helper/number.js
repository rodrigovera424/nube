// ----------- Methods - Begin ----------

const numeros_random = (min,max,quantity) => {
    let new_array = [];
    for (let i = 0; i < quantity; i++) {
      let random_number = Math.floor(Math.random() * max + min);
      new_array.push(random_number);
    }
    return new_array;
}
  
const numeros_quantity = (min,max,quantity) => {
    let arr = numeros_random(min,max,quantity);
    const count = {};
    arr.forEach(element => {
      count[element] = (count[element] || 0) + 1;
    });
    return count;
}

process.on("message", (information) => {
    if (information.message == "start") {
        const count = numeros_quantity(information.min,information.max,information.quantity);
        process.send(count);
    }
});
  
// ----------- Methods - End ------------