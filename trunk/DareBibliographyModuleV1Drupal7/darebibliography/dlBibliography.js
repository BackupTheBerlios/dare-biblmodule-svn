var dareBibl = null; // see initBibliography
var dareBiblTEI = 'test'; // If '', loading first short and big version, if set loads the TEI xml directly
	//for example dareBiblTEI = 'bibliography.xml'
								 

// better:
//   - faster loading
//   - sort reversed years
//   - facet years does not contain compound years
//   - compound years are both found
//   - faster search
//   - multi word search
//   - years, keywords, persons filtering via results

// ToDo: aufklappbar: Abstract, Export, Related Publications

function loadBibliography()
// load data and show page of bibliography
{
    if (dareBibl == null){
        //log('loadBibliography loading new ...');
        var boxContent = 'fullBoxContent';
        document.getElementById(boxContent).innerHTML = "<H2>Loading bibliography ...</H2>";

        var params = "";
        if (isStringEmpty(dareBiblTEI))
		{
          getXML(xelBaseUrl+"bibliography"+xelExt+params,
                 'loadBibliography shortbig', onLoadedShortBibliography);
        }  else {
          getXML(dareBiblTEI,'loadBibliography tei', onLoadedTEIBibliography);
        }
    } else {
        //log('loadBibliography showing old ...');
        showBibliography();
    }
    //log('loadBibliography end');
}

function initBibliography()
// called by onLoadedShortBibliography
// initialize basic structures
{
    //log('initBibliography start');
    dareBibl = createFacets();
    dareBibl.biblStructs = new Array(); // array of biblStruct
    dareBibl.idToBiblStruct = {};
    //log('initBibliography end');
    dareBibl.searchText = '';
    dareBibl.searchWords = new Array();

    dareBibl.facetKeyword = createFacet(dareBibl,'keyword','biblFacetKeyword','Keywords');
    dareBibl.facetPerson = createFacet(dareBibl,'person','biblFacetPerson','Persons with more than one publication');
    dareBibl.facetYear = createFacet(dareBibl,'year','biblFacetYear','Year');
    dareBibl.facetPubType = createFacet(dareBibl,'pubType','biblFacetPubType','Publication Type');
}

function createBiblStruct(id, pubType, year, yearsArray, title, authorsArray, keywordsArray)
// constructor of a biblStruct
// id            : the unique number
// pubType       : 'book', 'edited book', ...
// year          : year as caption
// yearsArray    : array of numbers, the first can be a string
// title         : main title and sub title as one string
// authorsArray  : array of authors
// keywordsArray : array of keywords
// editorsAnalytic : array of analytic editors
// editorsMonogr : array of monogr editors
// translators   : array of translators
// personsArray : array combining authors, editors analytic, editors monogr
{
    var biblStruct = dareBibl.idToBiblStruct[id];
    if (biblStruct !=null){
        log('Warning: duplicate zid: '+zid);
    }
    biblStruct = new Object();

    biblStruct.id = id;
    biblStruct.pubType = pubType;
    biblStruct.year = year;
    biblStruct.yearsArray = yearsArray;
    biblStruct.title = title;
    biblStruct.authorsArray = authorsArray;
    biblStruct.keywordsArray = keywordsArray;
    biblStruct.values = {}; // property name to value, e.g. monogrtitle, reprint
    biblStruct.element = null;
    biblStruct.editorsAnalytic = new Array();
    biblStruct.editorsMonogr = new Array();
    biblStruct.translators = new Array();
    biblStruct.personsArray = new Array();
    for (var i=0; i<authorsArray.length; i++){
        biblStruct.personsArray.push(authorsArray[i]);
    }
    dareBibl.idToBiblStruct[id] = biblStruct;
    dareBibl.biblStructs.push(biblStruct);

    biblStruct.updateAllLower = function (){
        var s=''+id+' '+title
          +' '+arrayToStr(this.yearsArray,' ')
          +' '+arrayToStr(this.personsArray,' ')
          +' '+arrayToStr(this.keywordsArray,' ');
	var values = this.values;
        for (var pName in values) {
            if (values.hasOwnProperty(pName)){
                s+=' '+values[pName];
            }
        }
        this.allLower = s.toLowerCase();
    }

    biblStruct.updateAllLower();

    return biblStruct;
}

function biblGetTextInputValue()
// returns the current search text trimmed and lowercase
{
    var textInput = document.getElementById('biblTextInput');
    var text = '';
    if (textInput!=null){
        text = textInput.value;
        if (!isStringEmpty(text)) text = jQuery.trim(text);
        if (!isStringEmpty(text)) text = text.toLowerCase();
    }
    return text;
}

function biblSearchTxtToWords(txt)
{
    var words = new Array();
    if (isStringEmpty(txt)) return words;
    var p = 0;
    var startPos;
    while (p<txt.length){
        while ((p<txt.length) && (txt.charAt(p)==' ')) p++;
        if (p>=txt.length) break;
        if (txt.charAt(p)=='"'){
            // a phrase in quotes
            p++;
            startPos = p;
            while ((p<txt.length) && (txt.charAt(p)!='"')) p++;
        } else {
            // a word without qoutes
            startPos = p;
            while ((p<txt.length) && (txt.charAt(p)!=' ')) p++;
        }
        if (p>startPos){
            words.push(txt.substring(startPos,p));
        }
        p++;
    }
    return words;
}

function biblStructFits(biblStruct)
// returns true if biblStruct fits current filter
{
    if (!facetFitsArray(dareBibl.facetKeyword,biblStruct.keywordsArray)){
        //log('biblStructFits id="'+biblStruct.id+'" keywords failed');
        return false;
    }
    if (!facetFitsArray(dareBibl.facetPerson,biblStruct.personsArray)){
        //log('biblStructFits id="'+biblStruct.id+'" persons failed');
        return false;
    }
    if (!facetFitsArray(dareBibl.facetYear,biblStruct.yearsArray)){
        //log('biblStructFits id="'+biblStruct.id+'" years failed');
        return false;
    }
    if (!facetFits(dareBibl.facetPubType,biblStruct.pubType)){
        //log('biblStructFits id="'+biblStruct.id+'" pubtype failed');
        return false;
    }
    if (dareBibl.searchWords.length>0){
        // all words must fit
        for (var i=0; i<dareBibl.searchWords.length; i++){
            if (biblStruct.allLower.indexOf(dareBibl.searchWords[i])<0){
                //log('biblStructFits id="'+biblStruct.id+'" keyword "'+dareBibl.searchWords[i]+'" failed');
                return false;
            }
        }
    }
    //log('biblStructFits id="'+biblStruct.id+'" fits');
    return true;
}

function biblApplyFilter()
{
    var biblStructs = dareBibl.biblStructs;
    dareBibl.searchText = biblGetTextInputValue();
    dareBibl.searchWords = biblSearchTxtToWords(dareBibl.searchText);

    dareBibl.updateSelectedArrays();

    // filter all books
    var count = 0;
    dareBibl.clearValueCounters();
    //clearLog('fits ...');
    for (var i = 0; i<biblStructs.length; i++){
        var biblStruct = biblStructs[i];
        var fits =  biblStructFits(biblStruct);
        if (fits){
            count++;
            dareBibl.facetKeyword.addValues(biblStruct.keywordsArray);
            dareBibl.facetPerson.addValues(biblStruct.personsArray);
            dareBibl.facetYear.addValues(biblStruct.yearsArray);
            dareBibl.facetPubType.addValue(biblStruct.pubType);
        }
        if (fits == biblStruct.fits) continue;
        biblStruct.fits = fits;
        if (fits){
            //log('show biblStruct '+biblStruct.id);
            jQuery(biblStruct.element).css('display', '');
        } else {
            //log('hide biblStruct '+biblStruct.id);
            jQuery(biblStruct.element).css('display', 'none');
        }
    }

    // update caption
    var s = '';
    var div = document.getElementById('biblResultCount');
    s = '(<a href="javascript:biblResetAllFilters()" class="link">Reset all filters</a>)';
    if ((count == 0) && (biblStructs.length>0)){
        s = 'No publication fits this filter. '+s;
    } else {
        var CntStr = '<span class="biblResultCountNumber">'+count+'</span>';
        if (count == biblStructs.length){
            s = 'There are '+CntStr+' publications in the database.';
        } else {
	    if (count == 1){
		s = 'Showing '+CntStr+' publication of '+biblStructs.length+'. '+s;
	    } else {
		s = 'Showing '+CntStr+' publications of '+biblStructs.length+'. '+s;
	    }
        }
    }
    div.innerHTML = s;

    // show value counters
    showFacetValueCounts(dareBibl);
}

function biblFacetClicked(facetName, valuePos)
// called by onclick of a facet value table row element
{
    var facet = dareBibl.nameToFacet[facetName];
    if (facet == null){
        if (develMode){
            alert('biblFacetClicked facet "'+facetName+'" not found');
        }
        return;
    }
    if (!toggleFacetValueSelected(facet,valuePos)) return;
    biblApplyFilter();
}

function biblFacetClearClicked(facetName)
// called by onclick of a facet clear selection button
{
    var facet = dareBibl.nameToFacet[facetName];
    if (facet == null){
        if (develMode){
            alert('biblFacetClearClicked facet "'+facetName+'" not found');
        }
        return;
    }
    clearFacetSelection(facet);
    biblApplyFilter();
}

function biblSelectFacetClicked(facetName, valuePos)
// called by onclick of a facet value in the results
{
    var facet = dareBibl.nameToFacet[facetName];
    if (facet == null){
        if (develMode){
            alert('biblSelectFacetClicked facet "'+facetName+'" not found');
        }
        return;
    }
    if (!selectFacetValue(facet,valuePos,true)) return;
    biblApplyFilter();
}

function biblResetAllFilters()
// called by click on "Reset all filters"
{
    if (dareBibl==null) return;
    var textInput = document.getElementById('biblTextInput');
    if (textInput != null) textInput.value = '';

    dareBibl.clearAllFacetSelections();

    biblApplyFilter();
}

function biblLazyApplyFilter()
// called after the user changed some setting or typed a letter in the text search
{
    if (dareBibl == null){
        return;
    }
    var textInput = document.getElementById('biblTextInput');
    if (textInput == null){
        return;
    }
    var text = biblGetTextInputValue();
    if ((isStringEmpty(text) == isStringEmpty(dareBibl.searchText))
        && (text == dareBibl.searchText)){
        return;
    }
    if(dareBibl.textInputTimer != null){
        clearTimeout(dareBibl.textInputTimer);
        dareBibl.textInputTimer = null;
    }
    dareBibl.textInputTimer = setTimeout(function(){
        if (dareBibl == null){
            return;
        }
        if(dareBibl.textInputTimer){
            clearTimeout(dareBibl.textInputTimer);
            dareBibl.textInputTimer = null;
        }
        var textInput = document.getElementById('biblTextInput');
        if (textInput == null){
            return;
        }
        var text = biblGetTextInputValue();
        if ((isStringEmpty(text) == isStringEmpty(dareBibl.searchText))
            && (text == dareBibl.searchText)){
            return;
        }
        //alert('update '+text+' : '+dareBibl.searchText);
        biblApplyFilter();
        },200); // update after 1000ms
}

function compareBiblStructs(bs1,bs2)
{
    // year
    var year1 = bs1.yearsArray[0];
    var year2 = bs2.yearsArray[0];
    if ((typeof year1 == 'number') && (typeof year2 == 'number')){
        if (year1!=year2)
          return (year2-year1);
    } else {
        year1 = ''+year1;
        year2 = ''+year2;
        if (year1 < year2){
            return 1;
        } else if (year1 > year2) {
            return -1;
        }
    }
    // secondary comparison

    return 0;
}

function createSelectFacetLink(facet,value,caption)
{
    if (isStringEmpty(caption)) caption = value;
    if (isStringEmpty(value)) return caption;
    var valueObj = facet.values[value];
    if (valueObj == null) return caption;
    var s = '<a href="javascript:biblSelectFacetClicked(';
    s+="'"+facet.name+"'";
    s+=','+valueObj.pos;
    s+=')">';
    s+=strToXML(caption);
    s+='</a>';
    //log (' 6 facet="'+facet.name+'" value="'+value+'" s="'+s+'"');
    return s;
}

function biblPersonsToHTML(personsArray,order)
// order = 'forename' for forename, surname
{
    var persons = '';
    if ((personsArray!=null) && (personsArray.length>0)){
        for (var i = 0; i<personsArray.length; i++){
            var caption = personsArray[i];
            if (isStringEmpty(caption)) continue;
            if (!isStringEmpty(persons)){
                if (i==personsArray.length-1){
                    persons += ' and ';
                } else {
                    persons += ', ';
                }
            }
            if (order == 'forename'){
                var commaPos = caption.indexOf(',');
                if (commaPos>=0){
                    caption = caption.substring(commaPos+1)+' '+caption.substring(0,commaPos);
                }
            }
            persons+=createSelectFacetLink(dareBibl.facetPerson,personsArray[i],caption);
        }
    }
    return persons;
}

function createBiblStructsHTML()
{
    var biblStructs = dareBibl.biblStructs;

    var facetKeyword = dareBibl.facetKeyword;
    var facetPerson = dareBibl.facetPerson;
    var facetYear = dareBibl.facetYear;
    var facetPubType = dareBibl.facetPubType;

    var html = '';
    for (var i = 0; i<biblStructs.length; i++){
        var biblStruct = biblStructs[i];
        var s = '';
        s+=' <div class="biblPub"';
        biblStruct.fits = biblStructFits(biblStruct);
        //log('biblCreateResultsHTML id="'+biblStruct.id+'" fits='+biblStruct.fits);
        if (!biblStruct.fits){
            //log('biblCreateResultsHTML hide id="'+biblStruct.id+'"');
            s+=' style="display: none;"';
        }
        s+='>'+"\n";
        if(develMode){
            s+='  <div>ID: '+biblStruct.id+' pubType='+biblStruct.pubType+'</div>'+"\n";
        }

        // title
        s+='  <div class="biblTitle">'+biblStruct.title;
      	if (biblStruct.values['web']){
          s += '<a class="biblLink" href="'+biblStruct.values['web']+'" target="_blank">';
          s += '<img src="/drupal6/themes/dare_zen/images/ExtLink.png"/>';
          s += '</a>';
        }
        s += '</div>'+"\n";

        var year = createSelectFacetLink(facetYear,biblStruct.yearsArray[0],biblStruct.year);

        var volume = strToXML(biblStruct.values['number']);
        if (!isStringEmpty(biblStruct.values['volume'])){
            if (!isStringEmpty(volume)) volume=' '+volume;
            volume=strToXML(biblStruct.values['volume'])+volume;
        }

        var publisher = strToXML(biblStruct.values['publisher']);;
        if (!isStringEmpty(biblStruct.values['pubplace'])){
            if (!isStringEmpty(publisher)) publisher=': '+publisher;
            publisher=strToXML(biblStruct.values['pubplace'])+publisher;
        }
        var reprint = biblStruct.values[reprint];
        var pages = '';
        if (!isStringEmpty(biblStruct.values['pages'])){
            pages='pp. '+strToXML(biblStruct.values['pages']);
        }

        if (biblStruct.pubType=='article'){
          // article
          // by: analyticAuthors, ed. by analyticEditors, trans. by analyticTranslators
          s+='  <div>';
          var authors = biblPersonsToHTML(biblStruct.authorsArray);
          var monogrEditors = biblPersonsToHTML(biblStruct.editorsMonogr,'forename');
          var analyticEditors = biblPersonsToHTML(biblStruct.editorsAnalytic);
          var monogrTranslators = '';
          var analyticTranslators = '';
          var empty = true;
          if (!isStringEmpty(authors)){
            s+='By: '+authors;
            empty = false;
          }
          if (!isStringEmpty(analyticEditors)){
            if (!empty) s+=', ';
            s+='ed. by '+analyticEditors;
            empty=false;
          }
          if (!isStringEmpty(analyticTranslators)){
            if (!empty) s+=', ';
            s+='trans. by '+analyticTranslators;
            empty=false;
          }
          s+='  </div>'+"\n";
          // In: monogrtitle, journalissuetitle volume.issue (year), pp. pages
          s+='  <div>In: ';
          s+='<span style="font-style:italic;">'+strToXML(biblStruct.values['monogrtitle'])+'</span>';
          if (!isStringEmpty(volume)) s+=' '+volume;
          var issue = biblStruct.values['issue'];
          if (!isStringEmpty(issue)) s+='.'+issue;
          if (!isStringEmpty(year)) s+=' ('+year+')';
          if (!isStringEmpty(pages)) s+=', '+pages;
          s+='.';
        } else if (biblStruct.pubType=='book'){
          // book
          // by: monogrAuthors, ed. by monogrEditors, trans. by monogrTranslators
          s+='  <div>';
          var authors = biblPersonsToHTML(biblStruct.authorsArray);
          var monogrEditors = biblPersonsToHTML(biblStruct.editorsMonogr);
          var analyticEditors = biblPersonsToHTML(biblStruct.editorsAnalytic);
          var monogrTranslators = biblPersonsToHTML(biblStruct.translators);
          var analyticTranslators = '';
          var empty = true;
          if (!isStringEmpty(authors)){
            s+='By: '+authors;
            empty = false;
          }
          if (!isStringEmpty(monogrEditors)){
            if (!empty) s+=', ';
            s+='ed. by '+monogrEditors;
            empty=false;
          }
          if (!isStringEmpty(monogrTranslators)){
            if (!empty) s+=', ';
            s+='trans. by '+monogrTranslators;
            empty=false;
          }
          s+='  </div>'+"\n";
          // seriestitles volume.number, pubplace: publisher, year.
          s+='  <div>';
	  var series = biblStruct.values['series'];
          if (!isStringEmpty(series)){
	      s+=strToXML(biblStruct.values['series']);
	      if (!isStringEmpty(volume)) s+=' '+volume;
	      s+=', ';
	  }
          if (!isStringEmpty(publisher)) s+=publisher;
          if (!isStringEmpty(year)) s+=', '+year;
          s+='.';
        } else if (biblStruct.pubType=='book section'){
          // book section
          // by: analyticAuthors, ed. by analyticEditors, trans. by analyticTranslators
          s+='  <div>';
          var authors = biblPersonsToHTML(biblStruct.authorsArray);
          var monogrEditors = biblPersonsToHTML(biblStruct.editorsMonogr,'forename');
          var analyticEditors = biblPersonsToHTML(biblStruct.editorsAnalytic);
          var monogrTranslators = '';
          var analyticTranslators = '';
          var empty = true;
          if (!isStringEmpty(authors)){
            s+='By: '+authors;
            empty = false;
          }
          if (!isStringEmpty(analyticEditors)){
            if (!empty) s+=', ';
            s+='ed. by '+analyticEditors;
            empty=false;
          }
          if (!isStringEmpty(analyticTranslators)){
            if (!empty) s+=', ';
            s+='trans. by '+analyticTranslators;
            empty=false;
          }
          s+='</div>'+"\n";
          // In: monogrtitles, ed. by monogreditors, seriestitle volume number, pubPlace: publisher, year, pp. pages.
          s+='  <div class="headline">In: ';
          if (!isStringEmpty(biblStruct.values['monogrtitle'])){
	      s+='<span style="font-style: italic">'+biblStruct.values['monogrtitle']+'</span>';
	  }
          if (!isStringEmpty(monogrEditors)) s+=', ed. by '+monogrEditors;
          var series = biblStruct.values['series'];
          if (!isStringEmpty(series)) s+=', '+series;
          if (!isStringEmpty(volume)) s+=' '+volume;
          if (!isStringEmpty(publisher)) s+=', '+publisher;
          if (!isStringEmpty(year)) s+=', '+year;
          if (!isStringEmpty(pages)) s+=', '+pages;
          s+='.';
        } else {
          // edited book
          // by: monogrAuthors, ed. by monogrEditors, trans. by monogrTranslators
          s+='  <div>';
          var authors = biblPersonsToHTML(biblStruct.authorsArray);
          var monogrEditors = biblPersonsToHTML(biblStruct.editorsMonogr);
          var monogrTranslators = '';
          var empty = true;
          if (!isStringEmpty(authors)){
            s+='By: '+authors;
            empty = false;
          }
          if (!isStringEmpty(monogrEditors)){
            if (!empty) s+=', ';
            s+='ed. by '+monogrEditors;
            empty=false;
          }
          if (!isStringEmpty(monogrTranslators)){
            if (!empty) s+=', ';
            s+='trans. by '+monogrTranslators;
            empty=false;
          }
          s+='  </div>'+"\n";
          // seriestitle volume, pubplace: publisher, year
          s+='<div>';
          empty=true;
          var series = biblStruct.values['series'];
          if (!isStringEmpty(series)){
              s+=series;
              if (!isStringEmpty(volume)) s+=' '+volume;
              empty=false;
          }
          if (!isStringEmpty(publisher)){
              if(!empty) s+=', ';
              s+=publisher;
              empty=false;
          }
          if (!isStringEmpty(year)) s+=', '+year;
        }
        s+='</div>'+"\n";

        // Reprint:
        if (!isStringEmpty(reprint)) s+='<div>Reprint: '+reprint+'</div>'+"\n";

        // keywords
        if (biblStruct.keywordsArray.length>0){
            s+='  <div>Keywords: <i>'
            for (var j = 0; j<biblStruct.keywordsArray.length; j++){
                if (j>0){
                    s += '; ';
                }
                s+=createSelectFacetLink(facetKeyword,biblStruct.keywordsArray[j]);
            }
            s+='</i>. (id:'+biblStruct.id+')</div>'+"\n";
        }
        
        //TABS FOR FURTHER FUNCTIONS
        s += '<div class="previewTabContent">';
        if(biblStruct.values['abstract'] != undefined){
          s += '<span class="inlineElm link" onclick="renderTabs(this,'+"'0'"+')">Abstract</span>';
        }else{
          s += '<span class="inlineElm hidden           link                                                                                                                                                                       " onclick="renderTabs(this,'+"'0'"+')">Abstract</span>';
        }
        s += '<span class="inlineElm link" onclick="renderTabs(this,'+"'1'"+')">Export</span>';
        //s += '<span class="inlineElm" onclick="renderTabs(this,'+"'2'"+')">Related Publications</span>';

        s += '</div>';
        // abstract
        var h = biblStruct.values['abstract'];
        s += '<div class="dareTabs">';
        s += '<ul class="dareTabstyle">';
          
        if (!isStringEmpty(h)){
          s += '<li><a href="#tabs-1">Abstract</a></li>';
        }else{
          s += '<li class="hidden"><a href="#tabs-1">Abstract</a></li>';
        }
          s += '<li><a href="#tabs-2">Export</a></li>';
          //for future use
//        s += '<li><a href="#tabs-3">Related Publications</a></li>';
          s += '</ul>';
          //abstract tab
           s += '<div id="tabs-1">';
          if(!isStringEmpty(h)){
            s +=  h;
          }
          s += '</div>';
          //export tab
          s += '<div id="tabs-2">';
          s +=  '<div id="citationstyles">';
          s +=    '<span class="inlineElm" id="harvardCite'+biblStruct.id+'"';
          s +=                'onclick="exportBibl('+"'harvard'"+','+biblStruct.id+')">Harvard</span>';
          s +=    '</span>';
          
          //future use
//          s +=    '<span class="inlineElm" id="oxfordCite'+biblStruct.id+'"';
//          s +=                'onclick="exportBibl('+"'oxford'"+','+biblStruct.id+')">Oxford</span>';
//          s +=    '</span>';
//          s +=    '<span class="inlineElm" id="endnoteCite'+biblStruct.id+'"';
//          s +=                'onclick="exportBibl('+"'endnote'"+','+biblStruct.id+')">EndNote</span>';
//          s +=    '</span>';
//          s +=    '<span class="inlineElm" id="zoteroCite'+biblStruct.id+'"';
//          s +=                'onclick="exportBibl('+"'zotero'"+','+biblStruct.id+')">Zotero</span>';
//          s +=    '</span>';
//          s +=    '<span class="inlineElm" id="bibtexCite'+biblStruct.id+'"';
//          s +=                'onclick="exportBibl('+"'bibtex'"+','+biblStruct.id+')">BibTex</span>';
          s +=  '</div>'; //end #citationstyles
          s += '<div class="resultContainer" id="resultContainer'+biblStruct.id+'""></div>';
          s += '</div>'; //end export
          s += '<div id="tabs-3"></div>';
          s += '<div id="tabs-4"></div>';
          s+='</div>'+"\n";
          s+=' </div>'+"\n"; // close biblStruct
          html+=s;
    }

    return html;
}

function exportBibl(citeStyle, biblStruct_id)
//exports current biblItem in desired format
{
  var citeDiv = $('#'+citeStyle+'Cite'+biblStruct_id);
  biblStruct = dareBibl.idToBiblStruct[biblStruct_id];
  var pubType = biblStruct.pubType;
  var author = biblStruct.authorsArray[0];
  var editor = biblStruct.editorsMonogr[0];
  console.log(pubType);
  var result = "";

  //HARVARD
  if(citeStyle == 'harvard'){
    //authorSurname, firstLetterForname. (date) mainTitle. In: editorSurname, 
    //firstLetterEditorForname. eds. (anotherDate?), monogrTitle 1st. ed. pubPlace: 
    //publisher, p. xx-xx.
    if(pubType == 'book section'){
      result += author.substring(0,author.indexOf(', ')+3)+'. ';
      result += '('+biblStruct.year+') ';
      result += biblStruct.title.substring(0,biblStruct.title.indexOf('.')+1)+' ';
      result += 'In: '+editor.substring(0,editor.indexOf(', ')+3)+'. ';
      result += 'eds. ('+biblStruct.year+'), ';
      result += biblStruct.values['monogrtitle']+'. ';
      result += '1st. ed. '+biblStruct.values['pubplace']+': ';
      result += biblStruct.values['publisher']+', ';
      result += 'p.'+biblStruct.values['pages']+'.';
    }
    if(pubType == 'book'){
      result += author.substring(0,author.indexOf(', ')+3)+'. ';
      result += '('+biblStruct.year+') ';
      result += biblStruct.title.substring(0,biblStruct.title.indexOf('.'))+1+' ';
      result += '1st. ed. '+biblStruct.values['pubplace']+': ';
      result += biblStruct.values['publisher']+'. ';
    }
    if(pubType == 'article'){
      result += author.substring(0,author.indexOf(', ')+3)+'. ';
      result += '('+biblStruct.year+') ';
      result += biblStruct.title.substring(0,biblStruct.title.indexOf('.')+1)+' ';
      result += biblStruct.values['journal_titles']+', ';
      result += biblStruct.values['number']+' ';
      result += 'p.'+biblStruct.values['pages']+'.';
    }
    if(pubType == 'edited book'){
      result += editor.substring(0,editor.indexOf(', ')+3)+'. ';
      if(biblStruct.editorsMonogr.length > 1){
        result += ' et al. eds. ' ;
      }
      result += '('+biblStruct.year+') ';
      result += biblStruct.title.substring(0,biblStruct.title.indexOf('.'))+1+'. ';
      result += biblStruct.values['pubplace']+': ';
      result += biblStruct.values['publisher']+'. ';
    }
    
    $('div#resultContainer'+biblStruct_id).html(result);
  }
}

function connectAllBiblStructElements()
{
    // set biblStruct.element
    var biblStructs = dareBibl.biblStructs;
    var resultsParentNode = getElementOrError('biblResults','showBibliography');
    var nodes = resultsParentNode.childNodes;
    var j = 0;
    for(var i=0; i<nodes.length; i++){
        var node = nodes[i];
        if((node.nodeType == 1) && (node.nodeName.toLowerCase() == 'div') ){
            biblStructs[j].element = node;
            j += 1;
        }
    }
}

function showBibliography()
// called by loadBibliography and onLoadedShortBibliography
// create html
{
    var biblStructs = dareBibl.biblStructs;

    var biblStructsHTML = createBiblStructsHTML();

    var s;
    // table with header and two columns, left for the facets, right for the results
    s = '<table width="100%"><tbody>'+"\n"
       +'  <tr>'+"\n"
       +'    <td colspan="2"><div id="biblResultCount"><span class="biblResultCountNumber">'+biblStructs.length+'</span> publications.</div>'+"\n"
       +'    </td>'+"\n"
       +'  </tr>'+"\n"
       +'  <tr>'+"\n"
       +'    <td valign="top" class="biblFacetCol">'+"\n"
       +'      <div class="biblFacetsNote" style="padding-top: 30px"><span class="teiHeading">Narrow results</span></div>'+"\n";
    // text search edit
    s+= '      <div class="biblTextSearch" style="padding: 10px;"><span class="biblTitle">Search</span>'
       +' <input id="biblTextInput" type="text" size="30" onchange="biblLazyApplyFilter()" onkeyup="biblLazyApplyFilter()"></div>'+"\n";
    // facet boxes
    for (var i = 0; i<dareBibl.posToFacet.length; i++){
        var facet = dareBibl.posToFacet[i];
        var facetBoxHTML = createFacetBoxHTML(facet,'biblFacetClicked','biblFacetClearClicked');
        s+='      <div id="'+facet.divId+'" class="biblFacet">'+"\n"
          +facetBoxHTML
          +'</div>'+"\n"
    }
    s+= '    </td>'+"\n";
    // result column
    s+= '    <td valign="top">'+"\n"
       +'      <div id="biblResults">'+"\n"
       +biblStructsHTML
       +'      </div>'+"\n"
       +'    </td>'+"\n"
       +'  </tr>'+"\n"
       +'</tbody></table>'+"\n";

    // set HTML
    clearSide('full');
    document.getElementById("fullBoxContent").innerHTML = s;

    // connect elements
    connectAllBiblStructElements();
    dareBibl.connectAllFacetBoxHTML();

    // filter
    biblApplyFilter();
}

function biblPushYear(yearStr,yearsArray)
{
    var y = parseInt(yearStr,10);
    if (isNaN(y)) return;
    yearsArray.push(y);
}

function extractYears(s)
// returns an array of numbers
{
    var years = new Array();
    if (isStringEmpty(s)){
    } else if (s.indexOf('-')>=0){
        var p = s.indexOf('-');
        var ys1 = s.substring(0,p);
        var ys2 = s.substring(p+1);
        if (ys1.length>ys2.length){
            // e.g. 1993-94
            ys2 = ys1.substring(0,ys1.length-ys2.length)+ys2;
        }
        biblPushYear(ys1,years);
        biblPushYear(ys2,years);
    } else if (s.indexOf(',')>=0){
        var p = s.indexOf(',');
        biblPushYear(s.substring(0,p),years);
        biblPushYear(s.substring(p+1),years);
    } else {
        biblPushYear(s,years);
    }
    if (years.length==0){
        years.push(s);
    }
    //log('extractYears s="'+s+'" years=['+arrayToStr(years,',')+']');
    return years;
}

function compareCaseInsensitive(x,y){
    var a = String(x).toUpperCase();
    var b = String(y).toUpperCase();
    if (a > b)
       return 1
    if (a < b)
       return -1
    return 0;
}

function removeDiacritical(s)
// replace characters with diacritical chars with chars without diacriticals
{
    if (s==null) return null;
    var r = s;
    r=r.replace("é","e");
    r=r.replace("è","e");
    r=r.replace("ʾ","");
    r=r.replace("ʿ","");
    r=r.replace("ī","i");
    r=r.replace("ū","u");
    r=r.replace("ḥ","h");
    r=r.replace("ḫ","h");
    r=r.replace("ǧ","g");
    r=r.replace("ġ","g");
    r=r.replace("ṣ","s");
    r=r.replace("š","s");
    r=r.replace("ḍ","d");
    r=r.replace("ḏ","d");
    r=r.replace("ṭ","t");
    r=r.replace("ṯ","t");
    r=r.replace("ẓ","z");

    return r;
}

function compareDiacriticalAndCaseInsensitive(x,y){
    var a = removeDiacritical(String(x).toLowerCase());
    var b = removeDiacritical(String(y).toLowerCase());
    if (a > b)
       return 1
    if (a < b)
       return -1
    return 0;
}

function onLoadedShortBibliography(xml)
// called after new data has arrived
// reads data and shows html
{
    //log('onLoaded start');
    initBibliography();

    var facetKeyword = dareBibl.facetKeyword;
    var facetPerson = dareBibl.facetPerson;
    var facetYear = dareBibl.facetYear;
    var facetPubType = dareBibl.facetPubType;

    var count = 0;
    var children = xml.documentElement.childNodes;
    //log('onLoadedShortBibliography start, childs.length='+children.length);
    for (var i = 0; i<children.length; i++)
	{
        var node = children[i];
        if (node.nodeType != 1) continue;
        //log(i+' type='+node.nodeName);
        if (node.nodeName == 'pr')
		{
            // person appearing more than once => add to facet
            var person = node.getAttribute('n');
            if (!isStringEmpty(person))
			{
                facetPerson.addValue(person);
            }
        } 
		else if (node.nodeName == 'bs')
		{
            var bsChildren = node.childNodes;
            var id = ""+node.getAttribute('id');
            if (isStringEmpty(id)) continue;
            // pubtype
            var pubType = ""+node.getAttribute('pt');
            facetPubType.addValue(pubType);
            // year(s)
            var year = node.getAttribute('yr');
            if (year==null){ year=""; } else {year = ""+year};
            var yearsArray = extractYears(year);
            facetYear.addValues(yearsArray);
            // title
            var title = node.getAttribute('t');
            // first author
            var authorsArray = new Array();
            var author = node.getAttribute('au');
            if (!isStringEmpty(author))
			{
                authorsArray.push(author);
            }
            // further authors
            for (var j = 0; j<bsChildren.length; j++){
                var bsNode = bsChildren[j];
                if (bsNode.nodeType != 1) continue;
                if (bsNode.nodeName == 'au'){
                    author = ""+bsNode.getAttribute('n');
                    authorsArray.push(author);
                }
            }
            // keywords (comma separated list)
            var keywordsArray = new Array();
            var keywords = node.getAttribute('kw');
            if (keywords==null){ keywords=""} else { Keywords=""+keywords};
            var startPos = 0;
            while(startPos < keywords.length){
                var p = keywords.indexOf(',',startPos);
                if (p<0) p = keywords.length;
                if (startPos<p){
                    var keyword = keywords.substring(startPos,p);
                    keywordsArray.push(keyword);
                    facetKeyword.addValue(keyword);
                }
                startPos = p+1;
            }

            count += 1;
            var bs = createBiblStruct(id,pubType,year,yearsArray,title,authorsArray,keywordsArray);
        }
    }

    // sort facet values
    facetKeyword.posToValueName.sort(compareCaseInsensitive);
    facetPerson.posToValueName.sort(compareDiacriticalAndCaseInsensitive);
    facetYear.posToValueName.sort();
    facetYear.posToValueName.reverse();
    facetPubType.posToValueName.sort();
    dareBibl.updateAllValueToPos();

    // sort biblStructs
    dareBibl.biblStructs.sort(compareBiblStructs);

    //log('onLoaded show');
    showBibliography();

    // load the rest
    getXML(xelBaseUrl+"bibliography"+xelExt+'?part=1','loadRestBibliography', onLoadedBigBibliography);

    //log('onShortLoaded end');
}

function onLoadedBigBibliography(xml)
{
    //log('onBigLoaded start');
    var children = xml.documentElement.childNodes;
    //log('onLoadedBigBibliography start, children.length='+children.length);
    for (var i = 0; i<children.length; i++)
	{
        var node = children[i];
        if (node.nodeType != 1) continue;
        //log(i+' type='+node.nodeName);
        if (node.nodeName == 'bs')
		{
            var bsChildren = node.childNodes;
            var id = ""+node.getAttribute('id');
            if (isStringEmpty(id)) continue;
            var biblStruct = dareBibl.idToBiblStruct[id];
            if (biblStruct==null){
                if (develMode){
                    log('loadedbig: id "'+id+'" not found');
                }
                continue;
            }
            var properties = node.childNodes;
            for (var j = 0; j<properties.length; j++){
                var p = properties[j];
                if (p.nodeType != 1) continue;
                if (p.nodeName != 'p') continue;
                var pName=p.getAttribute('n');
                if (isStringEmpty(pName)) continue;
                var value=p.getAttribute('v');
                if (isStringEmpty(value)) continue;
                //log('id='+id+' '+pName+' value='+txtNode.nodeValue);
                if (pName=='title'){
                    biblStruct.title = value;
                } else if (pName=='editoranalytic'){
                    biblStruct.editorsAnalytic.push(value);
                    biblStruct.personsArray.push(value);
                } else if (pName=='editormonogr'){
                    biblStruct.editorsMonogr.push(value);
                    biblStruct.personsArray.push(value);
                } else if (pName=='translator'){
                    biblStruct.translators.push(value);
                    biblStruct.personsArray.push(value);
                } else {
                    biblStruct.values[pName] = value;
                }
            }
            biblStruct.updateAllLower();
        }
    }

    var biblStructsHTML = createBiblStructsHTML();
    document.getElementById("biblResults").innerHTML = biblStructsHTML;
    connectAllBiblStructElements();
    
    //log('onBigLoaded end');
}

function onLoadedTEIBibliography(xml)
// parse TEI document
{
    initBibliography();

    var facetKeyword = dareBibl.facetKeyword;
    var facetPerson = dareBibl.facetPerson;
    var facetYear = dareBibl.facetYear;
    var facetPubType = dareBibl.facetPubType;
	
	var personarray = new Array();		//check how many entries
	
    // ToDo: parse TEI and load data into biblstructs
    var children = xml.documentElement.childNodes;
    //log('onLoadedTEIBibl start');	
    for (var i = 0; i<children.length; i++)
	{
		var node = children[i];
        if (node.nodeType != 1) continue;	
		if(node.nodeName == 'text')
		{
			var bodynodes = node.childNodes;		//childs <text>	
			var bodynode = bodynodes[1];			//<body> element
			var listnodes = bodynode.childNodes;    //childs <body>
			var listnode = listnodes[1];			//<listBibl> element
			
			var biblstructnodes = listnode.childNodes;  //all <biblStruct> nodes
			for(var j=0; j<biblstructnodes.length; j++)
			{
				var biblstructnode = biblstructnodes[j];
				if(biblstructnode.nodeType == 1)
				{
					var struct = analysebiblstruct(biblstructnode, personarray); //analyse <biblstruct>
					
					facetPubType.addValue(struct.type); 	  //add type to facet
					facetYear.addValues(struct.yearsarray);   //add year to facet
					for(var k=0; k<struct.tagsarray.length; k++)   //add all tags to facet
					{
						facetKeyword.addValue(struct.tagsarray[k]);
					}
					
					//var bs = createBiblStruct(id,pubType,year,yearsArray,title,authorsArray,keywordsArray);
					var bs = createBiblStruct(struct.id,struct.type,struct.year,struct.yearsarray,struct.title,struct.authorarray,struct.tagsarray);
					bs.values['pubplace'] = struct.values.pubplace;
					bs.values['publisher'] = struct.values.publisher;
					bs.values['pages'] = struct.values.pages;
					bs.values['monogrtitle'] = struct.values.title;
					bs.values['series'] = struct.values.seriestitle;
					bs.values['volume'] = struct.values.seriesvolume;
					for(var d=0; d<struct.values.editormonogr.length; d++)
					{
						bs.editorsMonogr.push(struct.values.editormonogr[d]);
						bs.personsArray.push(struct.values.editormonogr[d]);
					}
					for(var e=0; e<struct.values.editoranalytic.length; e++)
					{
						bs.editorsAnalytic.push(struct.values.editoranalytic[e]);						
						bs.personsArray.push(struct.values.editoranalytic[e]);
					}	
					for(var f=0; f<struct.values.translator.length; f++)
					{
						bs.translators.push(struct.values.translator[f]);						
						bs.personsArray.push(struct.values.translator[f]);
					}									
				}
			}		
		}
	}	
	
	var filter = 2;
	
	for(var name in personarray)
	{
		if(personarray.hasOwnProperty(name))
		{	
			if(personarray[name] < filter) continue;
				
			for(var g=0; g<personarray[name]; g++)
			{
			
				facetPerson.addValue(name);
			}
		}
	}
    //sort facet values
    facetKeyword.posToValueName.sort(compareCaseInsensitive);
    facetPerson.posToValueName.sort(compareDiacriticalAndCaseInsensitive);
    facetYear.posToValueName.sort();
    facetYear.posToValueName.reverse();
    facetPubType.posToValueName.sort();
    dareBibl.updateAllValueToPos();
    //sort biblStructs
    dareBibl.biblStructs.sort(compareBiblStructs);
    //log('onLoaded show');
    showBibliography();
}

function analysebiblstruct(biblstruct, personarray)
{
	//V 1.0 
	
	var id = biblstruct.getAttribute('n');	//done
	var type = "";							//done
	var year = "";							//done
	var yearsarray = new Array();			//done
	var title = "";							//TODO: ALLE TITLE + SORTIEREN
	var authorsarray = new Array();			//done
	var tagsarray = new Array();			//done	
	//var personarray = new Array();			//done
	
	//values
	var values = new Object();
	var booktitle ="";
	var articletitle = "";
	values.pubplace = "";
	values.title = "";
	values.publisher = "";
	values.pages = "";
	values.editoranalytic = new Array();
	values.editormonogr = new Array();
	values.translator = new Array();
	values.seriesvolume = "";
	values.seriestitle = "";
	
	var childs = biblstruct.childNodes;  //all childs of our Biblstruct Node
	for(var a=0; a<childs.length; a++)
	{
		var node = childs[a];
		if(node.nodeType != 1) continue; 
		if(node.nodeName == 'analytic') //<analytic> Node
		{
			var analyticchilds = node.childNodes; //childs <analytic>
			for(var b=0; b<analyticchilds.length; b++)
			{
				var analyticchild = analyticchilds[b];
				if(analyticchild.nodeType !=1 ) continue;
				if(analyticchild.nodeName == "author") //<author> to authors array and personsarray
				{	
					var curname = getPerson(analyticchild);
					authorsarray.push(curname);
						
					incAssoArray(personarray, curname);
						
				}
				if(analyticchild.nodeName == "editor") //<editor> to personsarray
				{
					var curname = getPerson(analyticchild);
					incAssoArray(personarray, curname);
						
					values.editoranalytic.push(curname);
				}
				if(analyticchild.nodeName == "respStmt") //find other persons and add them to personsnarray
				{
					var persnode = analyticchild.getElementsByTagName("persName")[0];
					var curname = getPerson(persnode);
				
					incAssoArray(personarray, curname);
						
					values.translator.push(curname);
				}
				if(analyticchild.nodeName =="title") //save analytic title
				{
					if(analyticchild.getAttribute('level') == 'a')
					{
						if(articletitle == "")
						{
							articletitle = analyticchild.textContent+ ".";
						}
						else
						{
							articletitle += " " + analyticchild.textContent;
						}
					}
				}
			}
		}
		else if(node.nodeName == 'monogr') //select the <monogr> node
		{
			var monogrchilds = node.childNodes;
			for(var c=0; c<monogrchilds.length; c++)
			{
				var monogrchild = monogrchilds[c];
				if(monogrchild.nodeType !=1)continue;
				if(monogrchild.nodeName == "imprint") //<imprint> node
				{
					var imprintnodes = monogrchild.childNodes;
					for(var d=0; d<imprintnodes.length; d++)
					{
						var imprintnode = imprintnodes[d];
						if(imprintnode.nodeType != 1) continue; 
						if(imprintnode.nodeName == 'date') //<analytic> Node
						{
							year = imprintnode.getAttribute('when-iso'); //get year attribute
							yearsarray = extractYears(year); //analyse it and save result to yearsarray
							if(yearsarray == null)
							{
								log(id);
							}
						}
						if(imprintnode.nodeName == 'pubPlace') //<analytic> Node
						{
							values.pubplace = imprintnode.textContent;
						}
						if(imprintnode.nodeName == 'publisher') //<analytic> Node
						{
							values.publisher = imprintnode.textContent;
						}
					}
				}
				if(monogrchild.nodeName == "biblScope")
				{
					if(monogrchild.getAttribute('type') == "pp")
					{
						values.pages = monogrchild.textContent;
					}
				}
				if(monogrchild.nodeName == "author") // <author> node
				{
					var curname = getPerson(monogrchild);
					authorsarray.push(curname); //add author to authorsarray
					
					
					incAssoArray(personarray, curname);
					
				}
				if(monogrchild.nodeName == "editor") //<editor> node
				{
					var curname = getPerson(monogrchild);
					incAssoArray(personarray, curname);					
					
					values.editormonogr.push(curname); 
				}				
				if(monogrchild.nodeName == "respStmt") //find otherpersonsn and add them to persons array
				{
					var persnode = monogrchild.getElementsByTagName("persName")[0];
					var curname = getPerson(persnode);
					
					incAssoArray(personarray, curname);		
						
					values.translator.push(curname);
				}
				if(monogrchild.nodeName == "title")
				{
					if(monogrchild.getAttribute('type') == 'main')
					{	
						booktitle = monogrchild.textContent;
					}
					if(monogrchild.getAttribute('type') == 'sub')
					{
						booktitle += ". " + monogrchild.textContent;
					}
				}
			}
		}
		else if(node.nodeName =='series')
		{
			var seriesnodes = node.childNodes;
			for(var u=0; u<seriesnodes.length; u++)
			{
				var seriesnode = seriesnodes[u];
				if(seriesnode.nodeType !=1)continue;
				if(seriesnode.nodeName == "title") //<imprint> node
				{
					if(seriesnode.getAttribute('type') == 'main')
					{
						values.seriestitle = seriesnode.textContent + ".";
					}
					if(seriesnode.getAttribute('type') == 'sub')
					{
						values.seriestitle += " " + seriesnode.textContent;
					}
				}
				else if(seriesnode.nodeName == "biblScope")
				{
					values.seriesvolume = seriesnode.textContent;
				}
			}
		}
		else if(node.nodeName =='note')
		{
			if(node.getAttribute('type') == 'ref_type')
			{
				type = node.textContent;
			}
			else if(node.getAttribute('type') == 'tags')
			{
				tags = node.textContent;
				var blub = tags.split(',');
				for(e=0; e<blub.length; e++)
				{
					blub[e] = blub[e].replace(" ","");
					tagsarray.push(blub[e]);
				}				
			}
		}
	}
	if((type == "book") || (type=="edited book")) //if its a book or a edited book use book title
	{
		title = booktitle;
		values.title = articletitle;
	}
	else // or use article title
	{
		title = articletitle;
		values.title = booktitle;
	}		
	
	var struct = new Object();
	struct.id = id;
	struct.type = type;
	struct.year = year;
	struct.yearsarray = yearsarray;
	struct.title = title;
	struct.authorarray = authorsarray;
	struct.tagsarray = tagsarray;	
	//struct.personarray = personarray;
	struct.values = values;
	
	/*
	// Alle Biblstructs ausgeben lassen
	log('id: '+id);
	log('type: ' + type);
	log('year: ' + year);
	log('yearsarray: ' + yearsarray);
	log('title: ' + title);
	var authorstring = "";
	for(var u=0; u<authorsarray.length; u++)
	{
		authorstring += ";" + authorsarray[u];
	}
	log("authorsarray: " + authorstring);
	var tagstring = "";
	for(var z=0; z<tagsarray.length; z++)
	{
		tagstring += ";" + tagsarray[z];
	}
	log("tagsarray: " + tagstring);*/
	
	return struct;
}

function getPerson(node)
{	
	if(node.getElementsByTagName("name")[0] != null)
		return node.getElementsByTagName("name")[0].textContent;
	else if(node.getElementsByTagName("surname")[0] != null)
	{
		var name = node.getElementsByTagName("surname")[0].textContent;
		name += "," + node.getElementsByTagName("forename")[0].textContent;
		return name;
	}
	else
	{ 
		var name = "";
		return name;
	}
}

function incAssoArray(arr, value)
{
	if(arr[value] == null)
	{	
		arr[value] = 1;
	}
	else
	{
		arr[value] += 1;
	}
}