// NORTHWIND
import __customers from './northwind/customers.json';
import __categories from './northwind/categories.json';
import __employees from './northwind/employees.json';
import __orders from './northwind/orders.json';
import __products from './northwind/products.json';
import __regions from './northwind/regions.json';
import __shippers from './northwind/shippers.json';
import __suppliers from './northwind/suppliers.json';
// ITALIA
import __regioni from './italia/regioni.json';
import __comuni from './italia/comuni.json';
// NATIONS
import __countries from './nations/countries.json';
import __nations from './nations/nations.json';
// CURRENCIES
import __currencies from './currencies/currencies.json';
// US
import __usStates from './us/states.json';
// HTTP
import __httpCodes from './http/codes.json';
// LOREM
import __lorem from './lorem/lorem.json';
// COLORS
import __colors from './colors/colors.json';


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
