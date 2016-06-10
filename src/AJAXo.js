var AJAXo = new function() {
    this.pages = [];
    this.usedContainer = null;
    this.usedGlobalContainer = null;
    this.usedLoader = null;
    this.container = "#PageContainer";
    this.globalContainer = "#PageGlobalContainer";
    this.loader = "#LoaderContainer";
    this.queue = [];
    this.pageIsLoading = false;

    this.addAPage = function(page) {
        if(page.hasOwnProperty("load") &&
           page.hasOwnProperty("name")) {
            this.pages.push(page);
        }
        else
            console.log("AJAXo : Trying to add an invalid page.");
    };

    this.startAjaxHandling = function() {
        // Try to load the page from the "page" url attribute
        $(window).on('statechange', function() {
            var State = History.getState();
            AJAXo.loadPageByName(State.data.page, State.data);
        });

        // Launch the next page in the queu when a page finished to load
        $(document).on("ajaxhandler.load.finished.normalHandle", function () {
            AJAXo.pageIsLoading = false;
            AJAXo.launchFollowingPage();
            return false;
        });

        // Check if the URL contains a page tag and load the right page on arrival
        var pageToLoad = URLParser.parse(window.location);
        if(pageToLoad != null) {
            AJAXo.changePage(pageToLoad.page, pageToLoad, true);
            return true;
        }
        return false;
    };

    this.changePage = function(newPage, params, isFromParsing) {
        params = params || {};
        isFromParsing = isFromParsing || false;

        params.page = newPage;
        params.randomData = window.Math.random();

        var url = "";
        for(var index in params)
            if (params.hasOwnProperty(index) && index != "randomData")
                if(url == "")
                    url += index + "=" + encodeURIComponent(params[index]);
                else
                    url += "&" + index + "=" + encodeURIComponent(params[index]);

        if(isFromParsing)
            History.replaceState(params, "", "?" + url);
        else
            History.pushState(params, "", "?" + url);
    };

    this.loadPageComponent = function(comp, params) {
        return this.loadPage(comp, params);
    };

    this.loadPageComponentById = function(page, id, params) {
        return this.loadPageComponent(page.components[id], params);
    };

    this.loadPageComponentByName = function(pageName, compName, params) {
        for(var i = 0; i<this.pages.length; i++)
            if(this.pages[i].name == pageName)
                for(var j = 0; j<this.pages[i].components.length; j++)
                    if(this.pages[i].components[j].name == compName)
                        return this.loadPageComponent(this.pages[i].components[j], params);
        return false;
    };

    this.reloadPage = function() {
        var currentState = History.getState();
        // Chrome fix : Chrome will not reload the exact same url (clever but nor wanted),
        //              adding a random number do the trick.
        currentState.data.randomData = window.Math.random();

        var url = $.param(currentState.data).replace("&randomData=" + currentState.data.randomData, "");
        History.replaceState(currentState.data, "", "?" + url);
    };

    // private

    var addToQueue = function(page, params)
    { this.queue.push([page, params]) };

    var launchFollowingPage = function() {
        var nextPage = this.queue.shift();
        if(typeof nextPage != "undefined")
            this.loadPage(nextPage[0], nextPage[1]);
        else
            $(document).trigger("ajaxhandler.load.finished.specialHandle");
    };

    var synchronize = function (page, what) {
        // The word "used" is concatenated with "what" while it's first letter is converted to uppercase
        var usedNameGenerated = "used" + what[0].toUpperCase() + what.slice(1);
        if (page.hasOwnProperty(what))
            this[usedNameGenerated] = page[what];
        else
            this[usedNameGenerated] = this[what];
    };

    var syncPageWithAJAXo = function(page) {
        this.synchronize(page, "container");
        this.synchronize(page, "globalContainer");
        this.synchronize(page, "loader");
    };

    var loadPage = function(page, params) {
        var beforeLoad = null;

        if(typeof params == "undefined")
            params = {};
        if(page.hasOwnProperty("beforeLoad"))
            beforeLoad = page.beforeLoad;
        if(page.hasOwnProperty("title"))
            document.title = page.title;

        if(this.pageIsLoading)
            this.addToQueue(page, params);
        else {
            this.syncPageWithAJAXo(page);
            this.pageIsLoading = true;

            this.loadAjaxPageWithLoader(page, params, function (html) {
                page.load(params, html);
            }, beforeLoad);
        }
    };

    var loadPageByName = function(name, params) {
        for(var i = 0; i<this.pages.length; i++)
            if(this.pages[i].name == name)
                return this.loadPage(this.pages[i], params);
        return false;
    };

    var loadAjaxPage = function(name, params, doneOnSuccess, doneOnError) {
        doneOnSuccess = doneOnSuccess || function(){};
        doneOnError = doneOnError || function(){};
        params = params || "";

        $.ajax({
            url : 'pages/' + name + '.php',
            type : 'POST',
            dataType : 'html',
            data : params,
            success : function(data) {
                var isARedirect;
                try {
                    isARedirect = ($(data).find("input[name=\"AjaxRedirect\"]").length);
                } catch(err) {
                    isARedirect = false;
                }

                if(isARedirect)
                    window.location.replace($(data).find("input[name=\"AjaxRedirect\"]").val());
                else
                    doneOnSuccess(data);
            },
            error: doneOnError
        });
    };

    var loadAjaxPageWithLoader = function(page, params, doneOnSuccess, doneBeforeAdd, doneOnError) {
        doneBeforeAdd = doneBeforeAdd || function(){ return true; };

        var onSpecial = false;

        $(this.usedContainer).fadeOut("fast", function() {
            $(AJAXo.usedLoader).fadeIn("fast", function() {
                AJAXo.loadAjaxPage(page.name, $.param(params), function (html) {
                    // Enabing the modification of the html element
                    var editableHtml = [ html ];

                    if(doneBeforeAdd(editableHtml)) {
                        $(AJAXo.usedContainer).remove();
                        $(editableHtml[0]).appendTo($(AJAXo.usedGlobalContainer));

                        if(typeof page.loadComponents !== 'undefined' && page.loadComponents.length > 0) {

                            for(var i = 0; i<page.loadComponents.length; i++) {
                                AJAXo.loadPageComponentById(page, page.loadComponents[i], params);
                            }

                            onSpecial = true;

                            $(document).on("ajaxhandler.load.finished.specialHandle", function() {
                                $(document).off("ajaxhandler.load.finished.specialHandle");
                                AJAXo.syncPageWithAJAXo(page);

                                $(AJAXo.usedLoader).fadeOut("fast", function () {
                                    $(AJAXo.usedContainer).fadeIn("fast");
                                    $(document).trigger("ajaxhandler.load.finished.normalHandle");

                                    doneOnSuccess(editableHtml[html]);
                                });
                            });
                        }
                        else {
                            $(AJAXo.usedLoader).fadeOut("fast", function () {
                                $(AJAXo.usedContainer).fadeIn("fast");
                                $(document).trigger("ajaxhandler.load.finished.normalHandle");
                            });
                        }
                    }
                    else {
                        $(AJAXo.usedLoader).fadeOut("fast", function () {
                            $(AJAXo.usedContainer).fadeIn("fast");

                            $(document).trigger("ajaxhandler.load.finished.normalHandle");
                        });
                    }

                    if(onSpecial)
                        $(document).trigger("ajaxhandler.load.finished.normalHandle");
                    else
                        doneOnSuccess(editableHtml[html]);

                }, doneOnError);
            });
        });
    };
};

var URLParser = new function() {

    this.parse = function(what) {
        var params = decodeURIComponent(what.search.substring(1)).split("&");
        var paramsObj = {};
        var isPage = false;

        for(var key in params) {
            var keyValue = params[key].split("=");

            if(keyValue[0] == "page")
                isPage = true;

            paramsObj[keyValue[0]] = keyValue[1];
        }

        if(isPage)
            return paramsObj;
        return null;
    };
};