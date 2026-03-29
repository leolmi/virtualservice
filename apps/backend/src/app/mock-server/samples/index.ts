// NORTHWIND
import * as __customers from './northwind/customers.json';
import * as __categories from './northwind/categories.json';
import * as __employees from './northwind/employees.json';
import * as __orders from './northwind/orders.json';
import * as __products from './northwind/products.json';
import * as __regions from './northwind/regions.json';
import * as __shippers from './northwind/shippers.json';
import * as __suppliers from './northwind/suppliers.json';
// ITALIA
import * as __regioni from './italia/regioni.json';
import * as __comuni from './italia/comuni.json';
// NATIONS
import * as __countries from './nations/countries.json';
import * as __nations from './nations/nations.json';
// CURRENCIES
import * as __currencies from './currencies/currencies.json';
// US
import * as __usStates from './us/states.json';
// HTTP
import * as __httpCodes from './http/codes.json';
// LOREM
import * as __lorem from './lorem/lorem.json';
// COLORS
import * as __colors from './colors/colors.json';


export default {
  northwind: {
    customers: __customers,
    categories: __categories,
    employees: __employees,
    orders: __orders,
    products: __products,
    regions: __regions,
    shippers: __shippers,
    suppliers: __suppliers,
  },
  italia: {
    regioni: __regioni,
    comuni: __comuni,
  },
  nations: {
    countries: __countries,
    nations: __nations,
  },
  currencies: {
    list: __currencies,
  },
  us: {
    states: __usStates,
  },
  http: {
    codes: __httpCodes,
  },
  lorem: __lorem,
  colors: {
    list: __colors,
  },
}
