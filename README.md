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

The page needs to have three divs (at least). A basic example :

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
        <div id="PageGlobalContainer">
            <div id="PageContainer">
            </div>
            
            <div id="LoaderContainer">
            </div>
        </div>
    </body>
</html>
```

When AJAXo load a page, it starts by fading out the ``` #PageContainer ``` and fading in the ``` #LoaderContainer ```. When the AJAX call is finished, AJAXo fade out the ``` #LoaderContainer ``` and add the new ``` #PageContainer ``` in the ``` #PageGlobalContainer ``` before fading in the new ``` #PageContainer ```. Consequently, each HTML code returned by the server responding to AJAX calls needs to be in a ``` #PageContainer ``` div :
   
``` html
<div id="PageContainer" style="display: none"> <!-- needed to allow the last fade in -->
    
    <!-- Place the HTML returned here -->
    
</div>
```

Then, you need to configure a page to use with the library :

``` javascript
var Page = {
    this.name = "MyPage"; // This parameter is mandatory and is used to identify a page,
    this.serveurPage = "php/MyPage.php"; // This parameter is also mandatory and it needs to point to the
                                         // server page you want to reach by AJAX
    
    this.load = function(params) {
        
        // Initialization code goes here
        
    }
}

// ...

AJAXo.addAPage(Page);
```

And you are all set. You can access the page through the url, using :

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

You can also use javascript to navigate :

``` javascript
AJAXo.changePage("MyPage", {time: 2});
```

All the params passed to the page will also be passed to the server page called by AJAX, a php example :

``` php
// URL = http://yourdomain/yourMainPage?page=Mypage&time=2

$parameters = securizeFromXSS($_POST); // returns a tab with everything escaped with htmlentities for exemple

echo $parameters["time"]; // print 2

```

## Complete Documentation

You can configure AJAXo for each pages :
 
``` javascript
var MyPage = {
    this.name = "MyPage"; // Mandatory, to identify the page.
    this.url = "pages/MyPage.php"; // The url of the page loaded by AJAX (either local or distant)
    this.container = "#PermissionFormContainer"; // The Container used by this page
    this.globalContainer = "#PermissionsFormGlobContainer"; // The Global Container used by this page 
    this.loader = "#PermissionLoaderContainer"; // The Loader's Container used by this page

    this.beforeLoad = function(html) {
        
        // This function is called when the page is loaded not shown yet. The "html" parameter is a tab, 
        // containing as first element the html returned by the loaded html. You can either modify it or 
        // just parsing it. You need to return a boolean indicating if the page should be shown or not 
        // (useful when you want to do some error handling).
        
    }

    this.load = function(params) {
        
        // this function is called when the page is fully loaded with the arguments gave to the page in 
        // the "params" parameter. This function is the third and the last thing which is mandatory.
        
    }
}
```

You can also set a global configuration using the ``` initialize() ``` method and an object of this type :

``` javascript
AJAXo.initialize({
    container: "#PageContainer",              // The id of the div containing the content of the page
    globalContainer: "#PageGlobalContainer",  // The id of the div containing the "container" div
    loader: "#LoaderContainer"                // The id of the div containing the loading animation
});
```

Please note that you can only specify the params above globally, so you need to create an object for each page anyway.

## Contributing

Every contribution is welcome. Feel free to drop me an email or trying to push improvements, I will take a look, as quick as I can. 

