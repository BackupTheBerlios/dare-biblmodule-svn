// xdbBaseUrl: the URL to the server scripts
xqlBaseUrl = "/exist/averroes/";
xqlExt = '.xql';
xelBaseUrl = "/dare-cgi/";
xelExt = '.pas';
xdbBaseUrl = xelBaseUrl;
xdbExt = xelExt;

// imagesBaseUrl: the prefix URL to the images of the buttons (e.g. Plus.png)
imagesBaseUrl = "/drupal6/themes/dare_zen/images/";

// scanBaseUrl: the prefix URL of the scanned images
scanBaseUrl = '';

// showing the navigation button obove a scan to open another scan on the other side
showScanToolBox = 1;

function dbPathToManifestationID(dbPath)
// extracts a manuscript ID from a exist-db path
// for example: dbPath=/db/dare/manuscripts/lat/BOOK-DARE-M-VA-VAT-BAV-Urb.Lat.221/transcription.xml
// returns BOOK-DARE-M-VA-VAT-BAV-Urb.Lat.221
{
    var regExp = /^\/db\/dare\/manuscripts\/(lat)\/(BOOK-DARE-[A-Za-z0-9\.\-]+)\/transcription\.xml$/;
    var found = regExp.exec(dbPath);
    return found[2];
}
