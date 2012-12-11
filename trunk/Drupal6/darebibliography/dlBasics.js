///===============================================================
//  Basic functions for all sites

develMode = 0;
listOfPreservedWritings='';

function log(msg)
{
  console.log(msg);
  //$('div#log').append('<div>'+msg+'</div>');
}

function clearLog(msg){
  $('div#log').html('');
  log(msg);
}

function strToXML(s){
    if (isStringEmpty(s)) return '';
    return s.replace(/\&/g,'&'+'amp;').replace(/</g,'&'+'lt;')
        .replace(/>/g,'&'+'gt;').replace(/\'/g,'&'+'apos;').replace(/\"/g,'&'+'quot;');
}

function arrayToStr(arrayOfString, delimiter, lastDelimiter){
    var s = '';
    if (arrayOfString==null) return s;
    for (var i=0; i<arrayOfString.length; i++){
        if (i>0){
            if ((i==arrayOfString.length-1) && !isStringEmpty(lastDelimiter)){
                s+=lastDelimiter;
            } else {
                s+=delimiter;
            }
        }
        s+=arrayOfString[i];
    }
    return s;
}

/* This script and many more are available free online at
The JavaScript Source :: http://javascript.internet.com
Copyright Robert Nyman, http://www.robertnyman.com
Free to use if this text is included */
function getElementsByAttribute(oElm, strTagName, strAttributeName, strAttributeValue) {
	var arrElements = (strTagName == "*" && document.all)? document.all: oElm.getElementsByTagName(strTagName);
	var arrReturnElements = new Array();
	var oAttributeValue = (typeof strAttributeValue != "undefined")? new RegExp("(^|\\s)" + strAttributeValue + "(\\s|$)"): null;
	var oCurrent;
	var oAttribute;
	for (var i = 0; i < arrElements.length; i++) {
		oCurrent = arrElements[i];
		oAttribute = oCurrent.getAttribute(strAttributeName);
		if (typeof oAttribute == "string" && oAttribute.length > 0) {
			if (typeof strAttributeValue == "undefined" || (oAttributeValue && oAttributeValue.test(oAttribute))) {
				arrReturnElements.push(oCurrent);
			}
		}
	}
	return arrReturnElements;
}

function isStringEmpty(aString)
// returns true if aString contains no text
{
	return (aString == null) || (aString.length == 0);
}

function getElementOrError(id, msg) {
	var o = document.getElementById(id);
	if (o == null) {
		alert(msg + ': ' + id + ' not found');
		return null;
	} else {
		return o;
	}
}

function getElementOrLog(id, msg) {
	var o = document.getElementById(id);
	if (o == null) {
		log(msg + ': ' + id + ' not found');
		return null;
	} else {
		return o;
	}
}

function getSideOfNode(htmlelement) {
	while (htmlelement != null) {
		if (htmlelement.id == 'leftBox') {
			return 'left';
		} else if (htmlelement.id == 'rightBox') {
			return 'right';
		}
		htmlelement = htmlelement.parentNode;
	}
	alert('GetSideOfNode side not found');
	return 'left';
}

function getOppositeSide(side)
// returns 'left' for 'right' and vice versus
{
	if (side == 'left') {
		return 'right';
	} else {
		return 'left';
	}
}

function getSideBox(side)
// returns the name of the boxcontent element
{
	if (side == 'left') {
		return 'leftBoxContent';
	} else {
		return 'rightBoxContent';
	}
}

function getSideOfBoxElement(box) {
	if (box.id == 'leftBoxContent') {
		return 'left';
	} else if (box.id == 'rightBoxContent') {
		return 'right';
	}
}

function getSideToolbox(side)
// returns the name of the toolbox
{
	return side + 'Toolbox';
}

function getAbsPos(oId, tl)
// returns the absolute position of an element
// examples: leftOfMyDiv = getAbsPos(myDiv, 'left');
//           topOfMyDiv = getAbsPos('myDiv', 'top');
{
	var o = (typeof oId == 'String')? document.getElementById(oId): oId;
	return (tl == 'top')? $(o).offset().top: $(o).offset().left;
}

function getData(filePath, boxToFill, onLoaded)
// fetch/load a html document from the server
// filePath: url to fetch
// boxToFill: name of the box content, where the file is inserted
// onLoaded: function to call after successful loading
{
	//alert("getData "+filePath+" box="+boxToFill);
	if (isStringEmpty(boxToFill)) boxToFill = 'leftBoxContent';
	//erstellen des requests
	var req = null;
	
	try {
		req = new XMLHttpRequest();
	}
	catch (ms) {
		try {
			req = new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch (nonms) {
			try {
				req = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch (failed) {
				req = null;
			}
		}
	}
	
	if (req == null)
	alert("Error creating request object for " + filePath + "!");
	
	//anfrage erstellen (true = asynchron)
	req.open("GET", filePath, true);
	
	//Beim abschliessen des request wird diese Funktion ausgefuehrt
	req.onreadystatechange = function () {
	    switch (req.readyState) {
	    case 4:
	    if (req.status != 200) {
		alert("Fehler: " + filePath + " Status= " + req.status);
	    } else {
		var box = document.getElementById(boxToFill);
		if (box == null) {
		    alert('GetData: boxtofill not found: ' + boxToFill);
		}
		if (box.id == "leftBoxContent") {
                    clearSide('left');
                    closeToolbox('right');
		}
		if (box.id == "rightBoxContent") {
                    clearSide('right');
                    closeToolbox('left');
		}
		
		box.innerHTML = req.responseText;
		if (onLoaded) {
		    onLoaded(box);
		    //scrollTo(0,200);
		    $("*[id$='Infobox']").removeClass("shown");
		}
		
	    }
	    default: return false;
	    break;
	    }
	};
	
	req.setRequestHeader("Content-Type",
	"application/x-www-form-urlencoded");
	req.send(null);
}

function getXMLErrorMsg(xml)
// returns an error string if the xml document is an <error>
{
	if (xml == null) return 'empty xml';
	if (xml.documentElement == null) return 'xml has no root node';
	if (xml.documentElement.nodeName != 'error') return null;
	var Msg = "";
	var childs = xml.documentElement.childNodes;
	for (var i = 0; i < childs.length; i++) {
		if (childs[i].nodeType == 3) {
			Msg = Msg + ' type=' + childs[i].nodeType + ' Value=' + childs[i].NodeValue;
		}
	}
	if (Msg == null) Msg = 'unknown exist error';
	return Msg;
}

function getXML(url, errormsg, onLoaded)
// fetch a xml file from the server
// checks if xml is valid
// calls onLoaded(xml)
{
    if(!onLoaded){
        alert('getXML: '+errormsg+' missing onLoadedXML');
    }

    try{
        req = new XMLHttpRequest();
    }
    catch (ms){
        try{
            req = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (nonms){
            try{
                req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (failed){
                req = null;
            }
        }
    }

    if (req == null)
        alert("Error creating request object for url "+url);
    //anfrage erstellen (true = asynchron)
    req.open("GET", url, true);

    //Beim Abschliessen des request wird diese Funktion ausgefuehrt
    req.onreadystatechange = function(){
        switch(req.readyState) {
        case 4:
	if(req.status!=200) {
	    alert("Error: "+errormsg+": url="+url+" Status= "+req.status);
	}else{
	    var xml = req.responseXML;
	    if (xml == null){
		log('Error: '+errormsg+': url='+url+' xml==null');
		return;
	    }
	    if (xml.documentElement == null){
		log('Error: '+errormsg+': url='+url+' xml.documentElement==null');
		return;
	    }
	    //log('xml loaded');

	    onLoaded(xml);
	}
        default:
	return false;
	break;
        }
    };

    req.setRequestHeader("Content-Type",
                         "application/x-www-form-urlencoded");
    req.send(null);
}

function moveRightboxToOffset(){
    var offset = 0;
    if(jQuery(window).scrollTop() > $('#leftBox').offset().top)
    {
	offset = jQuery(window).scrollTop() - $('#leftBox').offset().top +5;
    }else 
	offset = 0;
    $('#rightBoxContent').css({position:'absolute', 'top':offset,
                              'border-style':'solid','border-width':'1px',
                              'border-color':'#009533','padding':'20px'});
}

function clearSide(side)
// delete html elements in the box on side
{
	function showTwoSides() {
		jQuery('#fullBoxContent').hide();
		jQuery('#leftBox').show();
		jQuery('#rightBox').show();
	}
	function clearLeft() {
		 $('#leftBox').css({'padding-top':'0px','position':'relative','border-style':'none'});
		var boxContent = 'leftBoxContent';
		var box = document.getElementById(boxContent);
		if (box == null) {
			alert("clearLeft element missing: " + boxContent);
		}
		box.innerHTML = "";
		if (document.getElementById('triggerLeft')) {
			jQuery('#leftTrigger').remove();
			jQuery('#leftToolbox').remove();
		}
		jQuery('#leftInfobox').removeClass('shown');
	}
	function clearRight() {
	  $('#rightBoxContent').css({'padding-top':'0px','position':'relative',
	                             'top':'0px','border-style':'none'});
		var boxContent = 'rightBoxContent';
		var box = document.getElementById(boxContent);
		if (box == null) {
			alert("clearRight element missing: " + boxContent);
		}
		box.innerHTML = "";
		if (document.getElementById('triggerRight')) {
			jQuery('#rightTrigger').remove();
			jQuery('#rightToolbox').remove();
		}
		jQuery('#rightInfobox').removeClass('shown');
	}
	function clearFull() {
		jQuery('#leftBox').hide();
		jQuery('#rightBox').hide();
		jQuery('#fullBoxContent').show();
		var boxContent = 'fullBoxContent';
		document.getElementById(boxContent).innerHTML = "";
		jQuery('#leftInfobox').removeClass('shown');
		jQuery('#rightInfobox').removeClass('shown');
	}
	if (side == 'left') {
		showTwoSides();
		clearLeft();
	} else if (side == 'right') {
		showTwoSides();
		clearRight();
	} else if (side == 'both') {
		showTwoSides();
		clearLeft();
		clearRight();
	} else {
		clearFull();
	}
}

function initPage()
// create the left and right box
{
	document.getElementById("leftBox").innerHTML =
	'<div style="position:relative; margin:auto; width:220px;"><div id="leftInfobox" class="infobox"><p id="ibText">Content will appear on this side.</p></div></div>' + '<div id="leftBoxContent"></div>';
	document.getElementById("rightBox").innerHTML =
	'<div style="position:relative; margin:auto; width:220px;"><div id="rightInfobox" class="infobox"><p id="ibText">Content will appear on this side.</p></div></div>' + '<div id="rightBoxContent"></div>';
}

function jumpToDarePURL()
// formats for darepul:
// scana-SCANID,rev-SVN-REVSION => open manuscript scan
// chunka-TextID,n-ChunkID,rev-SVNREVISION => open text chunk
{
    if(isStringEmpty(darepurl)) return;

    // check scana-SCANID,rev-SVNREVSION
    var regExp = /^scana-([a-zA-Z0-9._-]+),rev-([0-9]+)$/;
    var found = regExp.exec(darepurl);
    if(found != null){
	var msScanID = found[1];
	var revision = found[2];
	//alert('msScanID='+msScanID);
	loadManifestationScanAndDesc(msScanID);
	return true;
    }

    // check chunka-TextID,n-ChunkID,rev-SVNREVISION
    var regExp = /^chunka-([a-zA-Z0-9_-]+),n-([a-zA-Z/0-9]+),rev-([0-9]+)$/;
    var found = regExp.exec(darepurl);
    if(found != null){
	var txtID = found[1];
	var n = found[2];
	var revision = found[3];
	//alert('darepurl txtid='+txtID+' n='+n);
	loadChunk(txtID,n);
	return true;
    }

    alert('Unknown darepurl='+darepurl);
    return false;
}

function loadDrupalContentArea(dare_node)
// dare_node is the drupal node id
// loads the drupal page content into element "content"
{
    var content = document.getElementById('content-area');
    if (content == null) return;

    getData(xelBaseUrl+"node_snippets.php?dare_node="+dare_node,'content-area');
}

function makeDrupalLinksLocal(parentId, parentClass)
{
	$('a').each(function(index)
	{
		var node = this;
		var hasParentId = false;
                var hasParentClass = false;
		while (node != null)
			{
			if (node.id == parentId)
				{
				hasParentId = true;
				}
			if (node.className == parentClass)
				{
				hasParentClass = true;
				}
			node = node.parentNode;
			}
		log ("aaa"+ this.href+" id="+hasParentId+" class = "+hasParentClass + " classname = "+ this.parentNode.className);
		if (hasParentId && hasParentClass)
			{
			var regExp = /node\/([0-9]+)/;
			var found = regExp.exec(this.href);
			if (found != null)
				{
				var nodeId = found[1];
				this.href = 'javascript:loadDrupalContentArea('+nodeId+')';
				}
			}
	}
);


}

function addOption(select, value, caption, isDefault)
// add an Option to a Select
{
	var option = document.createElement('option');
	option.setAttribute('value', value);
	if (isDefault) {
		option.setAttribute('selected', 'selected');
	}
	var text = document.createTextNode(caption);
	option.appendChild(text);
	select.appendChild(option);
}

function buildToolbox(side, scope)
// builds toolbox on side and inserts as child of scope
{
    if(side != 'left'){
	    side = 'right';
    }
    //umgebendes span fuer img und tb
    var span = side+'span';
    // div of whole side
    var box = side+'Box';
    // img
    var trigger = side+'Trigger';
    // floating div
    var toolbox = side+'Toolbox';
    // sub div of box
    var boxContent = side+'BoxContent';
    // the new img-button will be inserted before the inserttarget element
    var inserttarget = side+'ToolboxPos';


    // e.g.:
    //<img id="triggerLeft" class="trigger" src="img/toggle_plus.gif"/>
    //<div id="toolboxLeft" class="toolbox"></div>
    var img = document.createElement('img');
    var tb = document.createElement('div');
    img.setAttribute('id', trigger);
    img.setAttribute('class', 'trigger');
    if (side == 'left') {
	    img.setAttribute('src', imagesBaseUrl + 'Dots Up.png');
    } else {
	    img.setAttribute('src', imagesBaseUrl + 'Dots Down.png');
    }
    img.side = side;
    tb.setAttribute('id', toolbox);
    //id-value depends on side (eg. toolboxLeft)
    tb.setAttribute('class', 'toolbox');
    tb.side = side;
    tb.popup = false;
    document.getElementById(boxContent).insertBefore(img, document.getElementById(inserttarget));
    document.getElementById(boxContent).insertBefore(tb, document.getElementById(inserttarget));
    
    $("#"+trigger).click(function(){
	    //alert(this.className+' '+this.id+' '+this.side);
        var side = this.side;
	    var tb = document.getElementById(getSideToolbox(side));
	    var open = !tb.popup;
	    var otherSideToolbox = document.getElementById(getSideToolbox(getOppositeSide(side)));
	    tb.popup = open;
        // always close the opposite infobox
	    $('#'+getOppositeSide(side)+'Infobox').removeClass('shown');
	    //alert('open='+open+' '+tb.id+' side='+side);
	    if (open){
            // show on the other side the infobox
		    while(tb.firstChild!=null) tb.removeChild(tb.firstChild);
		    buildUrls(side);
	    	$('#'+getOppositeSide(side)+'Infobox').addClass('shown');
	    }
	    if(otherSideToolbox != null && otherSideToolbox.popup == true){
		    closeToolbox(getOppositeSide(side));
    		$('#'+side+'Infobox').removeClass('shown');
	    }
	    $(tb).toggle("slow");
	});
}

function closeToolbox(side) {
	if (side == 'both') {
		closeToolbox('left');
		closeToolbox('right');
		return;
	} else if (side != 'right') {
        side = 'left';
    }
	var tb = document.getElementById(getSideToolbox(side));
	//alert('closeToolbox '+side+' tb='+tb);
	if (tb == null) return;
	//alert('closeToolbox popup='+tb.popup);
	if (! tb.popup) return;
	tb.popup = false;
	jQuery(tb).toggle("slow");
}


function slideToggleExpandable(element) {
    var panel = getSuccessor(element);
    //Um moegliche Textknoten zu uebergehen
    while (panel.nodeType != 1) {
        panel = panel.nextSibling;
    }
    //  alert(panel.nodeName);
    if (jQuery(panel).is(":hidden")) {
        jQuery(panel).slideDown("slow");
        element.setAttribute("src", imagesBaseUrl + "Minus.png");
    } else {
        jQuery(panel).slideUp("slow");
        element.setAttribute("src", imagesBaseUrl + "Plus.png");
    }
}

function renderTabs(element,initialTab)
//jquery ui tabstyle
//TODO spezifisches tab übergeben
{
  var origElm = element;
  while($(element).attr('class') != 'dareTabs'){
    if(element.nextSibling != null){
      element = element.nextSibling;
    } else element = element.parentNode;
    if(element == null){
      console.log('div.tab does not exist.');
    }
  }
  $(element).tabs();
  console.log(parseInt(initialTab));
  $(element).tabs("option", "selected", parseInt(initialTab));
  $(origElm.parentNode).css('display','none');
  $(element).css('display','block');
}



function getSuccessor(element){
if (element == null) return null;
if (element.firstChild != null) return element.firstChild;
  while(element.nextSibling == null){
    element = element.parentNode;
    if(element == null) return null;   
  }
  return element.nextSibling;
}
