# AJAXOnly

[AJAXo](https://github.com/MYDIH/AJAXo) is a little library based on jquery's ajax function and History.js. This lib makes it possible to create WebApplications which aren't reloading each part of their pages when the user is interacting with it. AJAXo permit to have beautiful transitions between pages while everything is nearly automatically handled by the library.

## Features
- Makes it possible to use urls like a normal website,
- Handle the overlapping of AJAX requests while your code is still asynchronous,

## Getting Started

First, you need to include JQuery, History.js and AJAXo in this order, into your web page :

``` html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Title of the document</title>
        
        <!-- This is the google cdn but you could use your own jquery -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js" defer></script>
        <!-- Refer to the page https://github.com/browserstate/history.js/ to install history.js -->
        <script src="js/vendor/jquery.history.js" defer></script>
        <!-- You can find this file in the dist folder -->
        <script src="js/vendor/AJAXo.min.js" defer></script>
    </head>
    
    <body>
    </body>
</html>
```

Then, you need to configure a page to use with the library :

``` javascript
var Page = {
    this.name = "MyPage"; // This parameter is mandatory and is used to identify a page,
    this.serveurPage = "php/MyPage.php"; // This parameter is also mandatory and it needs to point to the
                                         // serveur page you want to reach by AJAX
    
    this.load = function(params) {
        
        // Initialization code goes here
        
    }
}

// ...

AJAXo.addAPage(Page);
```

And then you are all set. You can access the page through the url, using :

``` url
http://yourdomain/yourMainPage?page=Mypage
```

You can pass anything you want to the page, all the parameters will be transmitted through the load function's "params" parameter :

``` javascript
// URL = http://yourdomain/yourMainPage?page=Mypage&time=2

var Page = {

    // ...
    
    this.load = function(params) {
        alert(params.time); // alerts 2
    }
}
```

You can also use use javascript to navigate :

``` javascript
AJAXo.changePage("MyPage", {time: 2});
```

All the params passed to the page will also be passed to the server page called by AJAX, a php example :

``` php
// URL = http://yourdomain/yourMainPage?page=Mypage&time=2

$parameters = securizeFromXSS($_POST); // returns tab with everything escaped with htmlentities for exemple

echo $parameters["time"]; // print 2

```