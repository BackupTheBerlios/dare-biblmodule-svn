
function createFacets()
// constructor of the list of facets of a page
{
    var facets = new Object();
    facets.posToFacet = new Array();
    facets.nameToFacet = {};

    facets.clearValueCounters = function(){
	var nameToFacet = this.nameToFacet;
	for(facetName in nameToFacet){
	    if (nameToFacet.hasOwnProperty(facetName)){
		nameToFacet[facetName].clearValueCounters();
	    }
	}
    }

    //facets.createFacet = function(name, divId, caption){
    //    createFacet(this, name, divId, caption);
    //}

    facets.updateSelectedArrays = function(){
        for (var i = 0; i<this.posToFacet.length; i++){
            this.posToFacet[i].updateSelectedArray();
        }
    }

    facets.updateAllValueToPos = function(){
        for (var i = 0; i<this.posToFacet.length; i++){
            this.posToFacet[i].updateValueToPos();
        }
    }

    facets.connectAllFacetBoxHTML = function(){
        for (var i = 0; i<this.posToFacet.length; i++){
            connectFacetBoxHTML(this.posToFacet[i]);
        }
    }
    
     facets.clearAllFacetSelections = function(){
        for (var i = 0; i<this.posToFacet.length; i++){
          clearFacetSelection(this.posToFacet[i]);
        }
    }
    
    facets.firstSelectedFacet = function(){
      for (var i = 0; i<this.posToFacet.length; i++){
          if(this.posToFacet[i].selectedCount()>0) return this.posToFacet[i];
        }
      return null;
    }

    return facets;
}

function createFacet(facets, name, divId, caption)
// constructor of a facet data container
// name:    name in the associative array: facets.nameToFacet[name] = facet
// divId:   id of the div element
// caption: a nice title
{
    var facet = new Object();
    facet.name = name;
    facet.divId = divId;
    facet.caption = caption;
    facet.values = {}; // name to value object
    facet.posToValueName = new Array();
    facet.selectedArray = new Array(); // array of string

    facet.div = null;
    facet.allCheckImg = null;
    facet.values_tbody = null;

    facets.posToFacet.push(facet);
    facets.nameToFacet[name] = facet;

    facet.clearValueCounters = function(){
	var values = this.values;
        for (var value in values) {
            if (values.hasOwnProperty(value)){
		values[value].count = 0;
	    }
	}
    }

    facet.valueObjAt = function(pos){
        if ((pos>=0) && (pos<this.posToValueName.length)){
            return this.values[this.posToValueName[pos]];
        }
        return null;
    }

    facet.addValue = function(value){
	var values = this.values;
	var o = values[value];
	if (o == null){
            // new value
	    o = new Object();
	    values[value] = o;
	    o.value = value;
	    o.selected = false;
	    o.checkImg = null;
	    o.count = 1;
	    o.tr = null;
	    o.counttd = null;
            o.pos = this.posToValueName.length;
            this.posToValueName.push(value);
	} else {
            // duplicate value => increase counter
	    o.count += 1;
	}
	return o;
    }

    facet.addValues = function(valueArray){
        for (var i = 0; i< valueArray.length;i++){
            this.addValue(valueArray[i]);
        }
    }

    facet.updateValueToPos = function(value){
	var values = this.values;
	var posToValueName = this.posToValueName;
        for (var i=0; i<posToValueName.length; i++){
            var value = values[posToValueName[i]];
            value.pos = i;
        }
    }

    facet.selectedCount = function(){
	var cnt = 0;
	var values = this.values;
	for (var value in values) {
            if (values.hasOwnProperty(value)) {
		var o = values[value];
		if (o.selected){
		    cnt = cnt + 1;
		}
            }
        }
	return cnt;
    }

    facet.updateSelectedArray = function(){
	var a = new Array();
	var values = this.values;
	for (var value in values) {
            if (values.hasOwnProperty(value)) {
                var o = values[value];
                if (o.selected){
                    a.push(value);
                }
            }
        }
	this.selectedArray = a;
    }

    return facet;
}

function toggleFacetValueSelected(facet,valuePos)
// changes "selected" state of a facet value
// Note: it does not update the results
// returns true if something changed
{
    var o = facet.valueObjAt(valuePos);
    if (o==null) return false;
    //log('toggleFacetValueSelected valuePos='+valuePos+' value="'+o.value+'" selected='+o.selected);
    o.selected = !o.selected;
    if (o.selected){
        if (o.checkImg!=null) o.checkImg.src = imagesBaseUrl+'boxchecked.png';
        // show uncheck all
        jQuery(facet.allCheckImg).css('display','');
    } else {
        if (o.checkImg!=null) o.checkImg.src = imagesBaseUrl+'boxnotchecked.png';
        if (facet.selectedCount() == 0){
            // hide uncheck all
            jQuery(facet.allCheckImg).css('display','none');
        }
    }
    return true;
}

function selectFacetValue(facet,valuePos,selected)
// changes "selected" state of a facet value to selected
// Note: it does not update the results
// returns true if something changed
{
    var o = facet.valueObjAt(valuePos);
    if (o==null) return false;
    if (o.selected==selected) return;
    return toggleFacetValueSelected(facet,valuePos);
}

function clearFacetSelection(facet)
// changes "selected" state of all values of a facet
// Note: it does not update the results
{
    if(facet.allCheckImg.style.display == 'none') return;
    jQuery(facet.allCheckImg).css('display','none');
    var values = facet.values;
    for (var value in values) {
        if (values.hasOwnProperty(value)) {
            var o = values[value];
            if (o.selected){
                o.selected = false;
                if (o.checkImg!=null) o.checkImg.src = imagesBaseUrl+'boxnotchecked.png';
            }
        }
    }
}

function facetFits(facet,value)
// returns true if facet has value in its selection
{
    var a = facet.selectedArray;
    if (a.length==0) return true; // nothing selected => always fits
    for (var i = 0; i<a.length; i++){
	if (a[i] == value) return true;
    }
    return false;
}

function facetFitsCommaList(facet,commaSeparatedValues)
// returns true if facet has any value of commaSeparatedValues in its selection
{
    if (facet.selectedArray.length==0) return true; // nothing selected => always fits
    var startPos = 0;
    while(startPos < commaSeparatedValues.length){
        var p = commaSeparatedValues.indexOf(',',startPos);
        if (p<0) p = commaSeparatedValues.length;
        if (startPos<p){
            var value = commaSeparatedValues.substring(startPos,p);
            if (facetFits(facet,value)) return true;
        }
        startPos = p+1;
    }
    return false;
}

function facetFitsArray(facet,stringArray)
// returns true if facet has any value of stringArray in its selection
{
    if (facet.selectedArray.length==0) return true; // nothing selected => always fits
    // something selected
    if (stringArray!=null){
        for (var i = 0; i<stringArray.length; i++){
            if (facetFits(facet,stringArray[i])) return true;
        }
    }
    return false;
}

function facetTextContains(search, lowerText)
// returns true if search is in lowerText
// search does not need to be lower
{
    if (isStringEmpty(lowerText)){
	return false;
    }
    return (search.toLowerCase().indexOf(lowerText)>=0);
}

function createFacetBoxHTML(facet, onclickValueFunctionName, onclickClearFunctionName)
{
    var s='';
    // header: caption plus clear all button
    s+='<span class="teiHeader">'+facet.caption+'</span>'+"\n"
      +'<div style="float: right;">'
      +'<img id="teiFacetClear'+facet.name+'"'
      +' title="Clear these selections"'
      +' src="'+imagesBaseUrl+'boxchecked.png"'
      +' onclick="'+onclickClearFunctionName+"('"+facet.name+"')"+'"'
      +' style="display: none;">'
      +'</div>'+"\n";
    // box with values; start
    s+='<div class="teiFacetValues" style="height: 100px; overflow: auto;">'+"\n"
      +' <table class="teiFacetTable">'+"\n"
      +'  <tbody id="teiFacetValues'+facet.name+'">'+"\n";

    // values
    var values = facet.values;
    for (var i=0; i<facet.posToValueName.length; i++) {
        var value = facet.posToValueName[i];
        var o = values[value];
        var imgsrc = imagesBaseUrl;
        if (o.selected){
            imgsrc = imgsrc+'boxchecked.png';
        } else {
            imgsrc = imgsrc+'boxnotchecked.png';
        }
        s+='   <tr onclick="'+onclickValueFunctionName+"('"+facet.name+"',"+i+')">'+"\n"
          +'    <td align="right" style="width: 35px;">'+o.count+'</td>'+"\n"
          +'    <td class="teiFacetValueData">'+strToXML(''+o.value)+'</td>'+"\n"
          +'    <td class="teiFacetValueCheck" style="width: 30px;">'+"\n"
          +'     <img src="'+imgsrc+'">'+"\n"
          +'    </td>'+"\n"
          +'   </tr>'+"\n";
    }

    // box with values: end
    s+='  </tbody>'+"\n"
      +' </table>'+"\n"
      +'</div>'+"\n";

    // append a sizer for the box
    //s+='<div><img src="'+imagesBaseUrl+'down-arrow.png"></div>'+"\n";

    return s;
}

function connectFacetBoxHTML(facet)
// searches the elements of the facet box in the current HTML
// and stores the references for faster access
{
    facet.div = getElementOrLog(facet.divId,'connectFacetBoxHTML divId');
    if (facet.div == null) return;
    facet.allCheckImg = getElementOrLog('teiFacetClear'+facet.name,'connectFacetBoxHTML clear');
    facet.values_tbody = getElementOrLog('teiFacetValues'+facet.name,'connectFacetBoxHTML tbody');
    if (facet.values_tbody != null){
        // for each <tr>
        var trNodes = facet.values_tbody.childNodes;
        var valuePos = 0;
        for (var i=0; i<trNodes.length; i++){
            var trNode = trNodes[i];
            if ((trNode.nodeType != 1) || (trNode.nodeName.toLowerCase() != 'tr')) continue;
            // found a <tr>
            var valueObj = facet.valueObjAt(valuePos);
            if (valueObj == null){
                var s = 'facet value not found: facet='+facet.name;
                s+=' valuePos='+valuePos;
                s+=' facet.posToValueName.length='+facet.posToValueName.length;
                var value = facet.posToValueName[valuePos];
                if (valuePos<facet.posToValueName.length) s+=' facet.posToValueName['+valuePos+']='+strToXML(''+value);
                s+=' values['+strToXML(''+value)+']='+facet.values[value];
                log(s);
                break;
            }
            valuePos += 1;
            valueObj.tr = trNode;
            // for each <td>
            var tdIndex = -1;
            var tdNodes = trNode.childNodes;
            for (var j=0; j<tdNodes.length; j++){
                var tdNode = tdNodes[j];
                if ((tdNode.nodeType != 1) || (tdNode.nodeName.toLowerCase() != 'td')) continue;
                // found a <td>
                tdIndex += 1;
                if (tdIndex == 0){
                    // td with count
                    valueObj.counttd = tdNode;
                } else if (tdIndex == 2){
                    // td with check image
                    imgNodes = tdNode.childNodes;
                    for (var k=0; k<imgNodes.length; k++){
                        var imgNode = imgNodes[k];
                        if ((imgNode.nodeType != 1) || (imgNode.nodeName.toLowerCase() != 'img')) continue;
                        // check img of valueObj
                        valueObj.checkImg = imgNode;
                    }
                }
            }
            if (valuePos==1){
                if (valueObj.counttd==null){
                    log('connectFacetBoxHTML missing counttd '+valueObj.pos+' '+strToXML(''+valueObj.value));
                }
                if (valueObj.checkImg==null){
                    log('connectFacetBoxHTML missing checkImg '+valueObj.pos+' '+strToXML(''+valueObj.value));
                }
            }
        }
        if (valuePos<facet.posToValueName.length){
            log('connectFacetBoxHTML missing values: valuePos='+valuePos+' of '+facet.posToValueName.length);
        }
    }
}

function showFacetValueCounts(facets)
{
    // show updated facet counts
    for (var i = 0; i<facets.posToFacet.length; i++){
        var facet = facets.posToFacet[i];
        var values = facet.values;
        for (value in values){
            if (values.hasOwnProperty(value)){
                var o = values[value];
                if (o.count>0){
                    jQuery(o.tr).show();
                } else {
                    jQuery(o.tr).hide();
                }
                if (o.counttd != null){
                    o.counttd.innerHTML = ''+o.count;
                }
            }
        }
    }
}

