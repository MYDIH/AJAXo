var AJAXo = new function() {
    var pages = [];
    var usedContainer = null;
    var usedGlobalContainer = null;
    var usedLoader = null;
    var container = "#PageContainer";
    var globalContainer = "#PageGlobalContainer";
    var loader = "#LoaderContainer";
    var pageIsLoading = false;
    var queue = [];

    this.initialize = function(newParameters)  {
        if(newParameters.hasOwnProperty("container"))
            container = newParameters.container;
        if(newParameters.hasOwnProperty("globalContainer"))
            globalContainer = newParameters.globalContainer;
        if(newParameters.hasOwnProperty("loader"))
            loader = newParameters.loader;
    };

    this.addAPage = function(page) {
        if(page.hasOwnProperty("load") &&
           page.hasOwnProperty("name")) {
            pages.push(page);
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
        $(document).on("ajaxo.load.finished.normalHandle", function () {
            pageIsLoading = false;
            launchFollowingPage();
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
        return loadPage(comp, params);
    };

    this.loadPageComponentById = function(page, id, params) {
        return this.loadPageComponent(page.components[id], params);
    };

    this.loadPageComponentByName = function(pageName, compName, params) {
        for(var i = 0; i<pages.length; i++)
            if(pages[i].name == pageName)
                for(var j = 0; j<pages[i].components.length; j++)
                    if(pages[i].components[j].name == compName)
                        return this.loadPageComponent(pages[i].components[j], params);
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
    { queue.push([page, params]) };

    var launchFollowingPage = function() {
        var nextPage = queue.shift();
        if(typeof nextPage != "undefined")
            loadPage(nextPage[0], nextPage[1]);
        else
            $(document).trigger("ajaxo.load.finished.specialHandle");
    };

    var syncPageWithAJAXo = function(page) {
        if(page.hasOwnProperty("container"))
            usedContainer = page.container;
        else
            usedContainer = container;
        if(page.hasOwnProperty("globalContainer"))
            usedGlobalContainer = page.globalContainer;
        else
            usedGlobalContainer = globalContainer;
        if(page.hasOwnProperty("loader"))
            usedLoader = page.loader;
        else
            usedLoader = loader;
    };

    var loadPage = function(page, params) {
        var beforeLoad = null;

        if(typeof params == "undefined")
            params = {};
        if(page.hasOwnProperty("beforeLoad"))
            beforeLoad = page.beforeLoad;
        if(page.hasOwnProperty("title"))
            document.title = page.title;

        if(pageIsLoading)
            addToQueue(page, params);
        else {
            syncPageWithAJAXo(page);
            pageIsLoading = true;

            loadAjaxPageWithLoader(page, params, function (html) {
                page.load(params, html);
            }, beforeLoad);
        }
    };

    var loadPageByName = function(name, params) {
        for(var i = 0; i<pages.length; i++)
            if(pages[i].name == name)
                return loadPage(pages[i], params);
        return false;
    };

    var loadAjaxPage = function(url, params, doneOnSuccess, doneOnError) {
        doneOnSuccess = doneOnSuccess || function(){};
        doneOnError = doneOnError || function(){};
        params = params || "";

        $.ajax({
            url : url,
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

        $(usedContainer).fadeOut("fast", function() {
            $(AJAXo.usedLoader).fadeIn("fast", function() {
                loadAjaxPage(page.url, $.param(params), function (html) {
                    // Enabing the modification of the html element
                    var editableHtml = [ html ];

                    if(doneBeforeAdd(editableHtml)) {
                        $(AJAXo.usedContainer).remove();
                        $(editableHtml[0]).appendTo($(AJAXo.usedGlobalContainer));

                        if(page.hasOwnProperty("loadComponents") && page.loadComponents.length > 0) {
                            onSpecial = true;

                            for(var i = 0; i<page.loadComponents.length; i++) {
                                AJAXo.loadPageComponentById(page, page.loadComponents[i], params);
                            }

                            $(document).on("ajaxo.load.finished.specialHandle", function() {
                                $(document).off("ajaxo.load.finished.specialHandle");
                                syncPageWithAJAXo(page);

                                $(AJAXo.usedLoader).fadeOut("fast", function () {
                                    $(AJAXo.usedContainer).fadeIn("fast");
                                    $(document).trigger("ajaxo.load.finished.normalHandle");

                                    doneOnSuccess(editableHtml[html]);
                                });
                            });
                        }
                        else {
                            $(AJAXo.usedLoader).fadeOut("fast", function () {
                                $(AJAXo.usedContainer).fadeIn("fast");
                                $(document).trigger("ajaxo.load.finished.normalHandle");
                            });
                        }
                    }
                    else {
                        $(AJAXo.usedLoader).fadeOut("fast", function () {
                            $(AJAXo.usedContainer).fadeIn("fast");

                            $(document).trigger("ajaxo.load.finished.normalHandle");
                        });
                    }

                    if(onSpecial)
                        $(document).trigger("ajaxo.load.finished.normalHandle");
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