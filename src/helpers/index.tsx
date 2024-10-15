type Foo = {[key: string | number]: string | number | object }[]

export const arrayToObject = (array:Foo, keyField:string) => 
  Object.fromEntries(array.map(item => [item[keyField], item]));

/*
const people:Foo = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];

const peopleById = arrayToObject(people, "id");

console.log(peopleById); 

// Output: { 1: { id: 1, name: "Alice" }, 2: { id: 2, name: "Bob" }, 3: { id: 3, name: "Charlie" } }
*/