const _ = require('lodash');
const _northwind = {
  customers: require('./northwind/customers.json'),
  categories: require('./northwind/categories.json'),
  employees: require('./northwind/employees.json'),
  orders: require('./northwind/orders.json'),
  products: require('./northwind/products.json'),
  regions: require('./northwind/regions.json'),
  shippers: require('./northwind/shippers.json'),
  suppliers: require('./northwind/suppliers.json'),
};
const _italia = {
  regioni: require('./italia/regioni.json'),
  comuni: require('./italia/comuni.json')
};
const _nations = {
  countries: require('./nations/countries.json'),
  nations: require('./nations/nations.json')
};

exports.northwind = () => _.cloneDeep(_northwind);

exports.nations = () => _.cloneDeep(_nations);

exports.italia = () => _.cloneDeep(_italia);

// exports.help = {
//   northwind: {
//     type: 'method',
//     args: 'none',
//     result: 'gets a new instance of the northwind db object'
//   }
// }
