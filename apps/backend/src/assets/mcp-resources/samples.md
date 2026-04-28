# VirtualService — Built-in `samples` datasets

The global `samples` object is preloaded inside every JS expression scope
(`response`, `dbo`, `schedulerFn`, `rules.expression`). It carries a curated
set of demo datasets you can use to seed `db` or to return directly from a
mock without filling the dbo by hand.

This document lists the **shape** (item schema) of every dataset. Use it to
plan responses without having to inspect the raw data.

> Tip: many simple mocks need no `dbo` at all — just reference
> `samples.northwind.products` (or similar) directly from the response.

## `samples.northwind` — Northwind sample database

Classic Microsoft Northwind dataset. Items are arrays of plain objects.

| Path | Length | Item keys |
|---|---|---|
| `samples.northwind.products` | 77 | `productID`, `supplierID`, `categoryID`, `quantityPerUnit`, `unitPrice`, `unitsInStock`, `unitsOnOrder`, `reorderLevel`, `discontinued`, `name` |
| `samples.northwind.categories` | 8 | `categoryID`, `description`, `name` |
| `samples.northwind.orders` | 830 | `orderID`, `customerID`, `employeeID`, `orderDate`, `requiredDate`, `shippedDate`, `shipVia`, `freight`, `shipName`, `shipAddress`, `details` (= line items) |
| `samples.northwind.customers` | 91 | `customerID`, `companyName`, `contactName`, `contactTitle`, `address` (object: `street`, `city`, `region`, `postalCode`, `country`, `phone`, `fax`) |
| `samples.northwind.employees` | 9 | `employeeID`, `lastName`, `firstName`, `title`, `titleOfCourtesy`, `birthDate`, `hireDate`, `address`, `notes`, `reportsTo`, `territoryIDs` |
| `samples.northwind.regions` | 4 | `regionID`, `name`, `territories` |
| `samples.northwind.shippers` | 3 | `shipperID`, `companyName`, `phone` |
| `samples.northwind.suppliers` | 29 | `supplierID`, `companyName`, `contactName`, `contactTitle`, `address` |

Note: keys are camelCase but use the historical Northwind capitalisation
(`productID`, `categoryID`, …). Stay consistent.

## `samples.italia` — Italian geography

| Path | Shape |
|---|---|
| `samples.italia.regioni` | `{ regioni: Array<{ nome, capoluoghi[], province[] }> }` (20 regioni) |
| `samples.italia.comuni` | `{ regioni: Array<{ nome, province: Array<{ nome, comuni[] }> }> }` |

Both are wrapped in a top-level `regioni` array — start your access with
`samples.italia.regioni.regioni` or `_.flatMap(samples.italia.regioni.regioni, …)`.

## `samples.nations`

| Path | Length | Item keys |
|---|---|---|
| `samples.nations.countries` | 250 | `name`, `topLevelDomain`, `alpha2Code`, `alpha3Code`, `callingCodes`, `capital`, `altSpellings`, `region`, `subregion`, `population`, `latlng`, `demonym`, `area`, `gini`, `timezones`, `borders`, `nativeName`, `numericCode`, `currencies`, `languages`, `translations`, `flag`, `regionalBlocs`, `cioc` (rich dataset) |
| `samples.nations.nations` | 243 | `name`, `code` (lightweight) |

## `samples.currencies`

| Path | Length | Item keys |
|---|---|---|
| `samples.currencies.list` | 45 | `code` (ISO 4217), `name`, `symbol` |

## `samples.us`

| Path | Length | Item keys |
|---|---|---|
| `samples.us.states` | 50 | `name`, `code` (2-letter) |

## `samples.http`

| Path | Length | Item keys |
|---|---|---|
| `samples.http.codes` | 30 | `code` (number), `label` (e.g. `"OK"`, `"Not Found"`) |

## `samples.lorem`

| Path | Length | Type |
|---|---|---|
| `samples.lorem.words` | 62 | array of word strings |
| `samples.lorem.sentences` | 10 | array of sentence strings |
| `samples.lorem.paragraphs` | 3 | array of paragraph strings |

## `samples.colors`

| Path | Length | Item keys |
|---|---|---|
| `samples.colors.list` | 78 | `name`, `hex` (e.g. `"#FF6347"`) |

## Usage examples

### Seed `dbo` from samples

```
{
  products: samples.northwind.products,
  categories: samples.northwind.categories,
}
```

### Return a sample directly

```
= samples.us.states
```

### Filter samples on the fly

```
= _.filter(samples.nations.countries, { region: params.region })
```

### Pick a random color

```
= _.sample(samples.colors.list)
```

### Merge multiple samples

```
{
  countries: _.map(samples.nations.nations, n => ({ ...n, currency: _.find(samples.currencies.list, { code: n.code }) })),
}
```
