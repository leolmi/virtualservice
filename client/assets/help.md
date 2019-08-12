{name:list}
# MANAGE CALLS

your services are listed in cards.


### card actions:<br>
<img src="assets/help/manage_2.png"><br>
  - **service monitor**: open page where you can watch all service calls;
  - **download swagger**: download the service definition in a **swagger+** file;
  - **delete**: delete service after confirmation;
  - **OPEN**: open service definition in editor page (as the click on card);

### menu actions:<br>
<img src="assets/help/manage_1.png"><br>
  - **new virtual service**: create new empty virtual service and switch to editor;
  - **generate by swagger**: create new virtual service by an existing **swagger** file;
  - **templates** / **my services**: switch to e from the list of available templates from which you can generate new virtual services;

------
{name:editor}
# CALL EDITOR

the editor page is splitted into 2 areas:
  - the list of the calls on left
  - the editor on right

### toolbar:<br>
<img src="assets/help/toolbar.png"><br>
- create new call
- save call changes
- generate the service swagger file
- go to service monitor page
- go to services list
- logout from virtual-service

In this page you can:
  - set the Virtual service name and define the **Base Path** of this service
  - activate or disactivate the service
  - select a call in list to open it in editor
  - create a new call using button <i>add_circle_outline</i>
  - generate the service swagger file using button <i>settings_ethernet</i>
  - generate calls dropping a [swagger](https://swagger.io) file
  - edit the **Virtual Database** in second tab of the editor
  - edit the service description in fourth tab (You can do this only if no call is selected)
  - edit the call description in fourth tab (You can do this only if a call is selected)

## code editor

<img src="assets/help/code-editor.png">

Code editor is a text editor to write **JSON** objects (default) or **javascript** code.
A special header define the type of target:
  - no header means text will be read as JSON
  - header like `=` or `// code:javascript` tell reader that text is javascript code

Under the text editor there are all default scope object you can use writing expression.

Some examples:

- return a simple JSON object
````
  {
    "number": 23.64546,
    "date": "2020-07-23T10:00:00",
    "string": "this is a generic string"
  }
````

- return a javascript value:
````
  // code:javascript
  return db.products;
````

- using path-values:<br>
path definition like this:<br>
`myservice/{myvalue}/dosomething`<br>
effective call:<br>
`https://virtualservice.herokuapp.com/myservice/1000/dosomething`
````
  // code:javascript
  return parseInt(pathValue.myvalue, 10) * 5;
````




## edit a call

todo...

## edit the virtual database

Virtual database can be a json object:<br>
````
  {
    "products": [
      {
        "id: 1,
        "name": "product 1",
        "category": 1
      },
      ...
    ],
    "categories": [
      {
        "id": 1,
        "name": "category 1"
      },
      ...
    ]
  }
````
or a javascript structure:
````
// code:javascript
const db = {
  products: [],
  categories: []
};

[1,2,3,4,5,6].forEach(n => {
  db.categories.push({
    id: n,
    name: 'category ' + n
  });
  db.products.push({
    id: n,
    name: 'product ' + n,
    category: n
  });
})

return db;
````


## call test

You can use path values inputs and body/params definition box to test the call.


------
{name:monitor}
# SERVICE MONITOR

in this page you can watch all service calls.

Selecting item in list you can watch request data and response data (if exists).

Some call (on response) can have the elapsed time.

### toolbar:<br>
<img src="assets/help/monitor.toolbar.png"><br>
- clear monitor log
- go to service editor
- go to services list
- logout from virtual-service


