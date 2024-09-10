/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/

/* 

------------------------------------------------------------------------------------------
Script Information
------------------------------------------------------------------------------------------

Name:
Search Script Contents Tool

ID:
_search_script_tool_sl

Description
A utility for searching files in the SuiteScript directory for refernced instances.

Portions of scripting provided from:
* Tim Dietrich
* timdietrich@me.com
* https://timdietrich.me
* SuiteQL Query Tool

------------------------------------------------------------------------------------------
MIT License
------------------------------------------------------------------------------------------

Copyright (c) 2021 Timothy Dietrich.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var 	
	rowsReturnedDefault = 25,
	datatablesEnabled = true;

var 	
	file,
	https,
	log,
	page,
	query,
	record,
	render,
	runtime,	
	scriptURL,
	url,
	fileHits
	version = '2021.2';

define( [ 'N/file', 'N/https', 'N/log', 'N/ui/message', 'N/query', 'N/record', 'N/render', 'N/runtime', 'N/ui/serverWidget', 'N/url' ], main );


function main( fileModule, httpsModule, logModule, messageModule, queryModule, recordModule, renderModule, runtimeModule, serverWidgetModule, urlModule ) {

	file = fileModule;
	https = httpsModule;
	log = logModule;
	message = messageModule;
	query= queryModule;
	record = recordModule;
	render = renderModule;
	runtime = runtimeModule;
	serverWidget = serverWidgetModule;	
	url = urlModule;
	
    return {
    	onRequest: function( context ) {     
			scriptURL = url.resolveScript( { scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId, returnExternalURL: false } ); 
			if ( context.request.method == 'POST' ) {     		    		
    			postRequestHandle( context );    			
    		} else {	
    			getRequestHandle( context );	
			}
        }
    }
}

function getRequestHandle( context ) {
	var form = serverWidget.createForm( { title: `SuiteScript Search Tool`, hideNavBar: false } );		
	var htmlField = form.addField({
		id: 'custpage_field_html',
		type: serverWidget.FieldType.INLINEHTML,
		label: 'HTML'
	});
	htmlField.defaultValue = htmlGenerateTool();						
	context.response.writePage( form );					
}

function htmlGenerateTool() {
	return `
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
		<script src="/ui/jquery/jquery-3.5.1.min.js"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
		<style type = "text/css"> 
			input[type="text"], input[type="search"], textarea, button {
				outline: none;
				box-shadow:none !important;
				border: 1px solid #ccc !important;
			}
			p, pre {
				font-size: 10pt;
			}
			td, th { 
				font-size: 10pt;
				border: 3px;
			}
			th {
				text-transform: lowercase;
				font-weight: bold;				
			}
		</style>
		${htmlQueryUI()}
		<script>	
			var
				activeFile = {},
				queryResponsePayload;
			window.jQuery = window.$ = jQuery;
			$('#queryUI').show();
			${jsFunctionQuerySubmit()}
			${jsFunctionResponseDataCopy()}
			${jsFunctionResponseGenerate()}
			${jsFunctionResponseGenerateTable()}
		</script>	
	`
}

function htmlQueryUI() {
	return `
		<div class="collapse" id="queryUI" style="text-align: left;">	
			<table style="table-layout: fixed; width: 100%; border-spacing: 6px; border-collapse: separate;">
				<tr>				
					<td width="20%">
						<h5 id="queryHeader" style="margin-bottom: 0px; color: #4d5f79; font-weight: 600;">Search For String:</h5>
					</td>
					<td width="55%" style="text-align: right;">
						<div id="buttonsDiv">
							<button type="button" class="btn btn-sm btn-success" onclick="querySubmit();" accesskey="r">Run Search</button>	
						</div>
					</td>	
				</tr>
				<tr id="queryFormRow">
					<td colspan="2" style="vertical-align: top;">
						<textarea 
							class="form-control small"
							id="query" 
							style="
								font-size: 10pt;
								background-color: #FFFFFF; 
								x-font-family: 'Courier New', monospace; 
								color: #000000;
								line-height: 1.3;
								padding: 12px;
								"
							rows="2" 
							placeholder="Enter text to search for in JS and XML files..." 
							autofocus 
							></textarea>
					</td>
					<td style="vertical-align: top; text-align: center">
					<div id="recordCounts"></div>
					</td>
					<td style="vertical-align: top; text-align: center">
					<svg data-icon="/images/logos/netsuite-oracle.svg" role="img" aria-label="logo" data-border-radius="square" class="uif632 uif635 uif736 uif739 uif625" id="uif39" data-widget="Image" data-status="none" data-performance-id="devpgloadtime" width="80" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M23.89 4.7127H27.5464L25.6159 1.5773L22.0696 7.24338L20.4531 7.24505L24.7699 0.441243C24.953 0.165153 25.2687 0 25.6134 0C25.9539 0 26.2646 0.160149 26.4469 0.428731L30.7794 7.24505L29.1629 7.24338L28.4031 5.97804H24.6995L23.89 4.7127ZM40.6673 5.9797V0.0692139H39.2952V6.5569C39.2952 6.73623 39.3682 6.90722 39.4949 7.03651C39.63 7.1683 39.8073 7.24337 39.997 7.24337H46.2468L47.0538 5.9797H40.6673ZM17.9958 4.92121C19.3273 4.92121 20.4036 3.83521 20.4036 2.49563C20.4036 1.15606 19.3273 0.0692139 17.9958 0.0692139H11.9971V7.24337H13.3683V1.33455H17.9014C18.5402 1.33455 19.0547 1.85337 19.0547 2.49563C19.0547 3.13539 18.5402 3.65587 17.9014 3.65587L14.0403 3.65421L18.1284 7.24337H20.1202L17.3686 4.91955L17.9958 4.92121ZM3.56361 7.24337C1.5958 7.24337 0 5.63855 0 3.65587C0 1.67487 1.5958 0.0692139 3.56361 0.0692139H7.70639C9.67421 0.0692139 11.2692 1.67487 11.2692 3.65587C11.2692 5.63938 9.67421 7.24503 7.70639 7.24503L3.56361 7.24337ZM7.61283 5.97957C8.88715 5.97957 9.92119 4.93944 9.92119 3.65575C9.92119 2.37373 8.88715 1.33443 7.61283 1.33443H3.65648C2.38217 1.33443 1.34896 2.37373 1.34896 3.65575C1.34896 4.93944 2.38217 5.97957 3.65648 5.97957H7.61283ZM33.6388 7.24337C31.6702 7.24337 30.0736 5.63855 30.0736 3.65587C30.0736 1.67487 31.6702 0.0692139 33.6388 0.0692139H38.5596L37.7518 1.33455H33.7316C32.4557 1.33455 31.4208 2.37385 31.4208 3.65587C31.4208 4.93956 32.4557 5.9797 33.7316 5.9797H38.6698L37.8678 7.24337H33.6388ZM50.4025 5.9797C49.347 5.9797 48.4546 5.2657 48.1812 4.29146H54.0382L54.8477 3.02696H48.1803C48.4538 2.04938 49.3453 1.33455 50.4025 1.33455H54.4227L55.2297 0.0692139H50.3072C48.3411 0.0692139 46.7453 1.67487 46.7453 3.65587C46.7453 5.63855 48.3411 7.24337 50.3072 7.24337H54.5345L55.3416 5.9797H50.4025Z" fill="#161513"></path>
					<path d="M0 27.7358V11.77H1.93897L10.4655 24.3753V11.77H12.4922V27.7358H10.5532L2.02662 15.1304V27.7358H0Z" fill="#161513"></path>
					<path d="M24.0275 27.1645C23.616 27.4138 23.0655 27.6109 22.375 27.7579C21.6995 27.9039 20.9577 27.9774 20.1496 27.9774C18.3282 27.9774 16.9472 27.4649 16.0076 26.44C15.082 25.4001 14.6191 23.885 14.6191 21.8947C14.6191 19.9045 15.0595 18.5205 15.9414 17.5243C16.8371 16.5291 18.1155 16.0305 19.7744 16.0305C22.9768 16.0305 24.5769 17.7949 24.5769 21.3226V22.5958H16.6233C16.711 23.8839 17.0562 24.8279 17.6591 25.4288C18.2609 26.0148 19.1577 26.3078 20.3473 26.3078C21.0079 26.3078 21.6321 26.2418 22.22 26.1097C22.8079 25.9775 23.4097 25.773 24.0265 25.4949V27.1634L24.0275 27.1645ZM19.7755 17.6553C18.806 17.6553 18.0492 17.9483 17.5062 18.5333C16.9771 19.1043 16.6842 19.9386 16.6255 21.0371H22.6626C22.6626 19.8363 22.4349 18.9722 21.9795 18.4459C21.5392 17.9185 20.8048 17.6553 19.7765 17.6553H19.7755Z" fill="#161513"></path>
					<path d="M27.2426 24.244V17.8972H25.2598V16.8871L27.2426 16.2287L28.0357 13.1101H29.2254V16.2724H31.7148V17.8972H29.2254V24.2217C29.2254 25.481 29.7684 26.1107 30.8554 26.1107C31.0318 26.1107 31.2007 26.1033 31.3621 26.0883C31.5385 26.0596 31.6998 26.0372 31.8463 26.0223V27.7355C31.6411 27.7792 31.4273 27.809 31.2071 27.824C31.0019 27.8389 30.7817 27.8463 30.5465 27.8463C29.4156 27.8463 28.5787 27.5533 28.0346 26.9684C27.5055 26.3824 27.2415 25.4746 27.2415 24.2451L27.2426 24.244Z" fill="#161513"></path>
					<path d="M33.3867 27.0326V25.2319C35.0018 25.8904 36.5442 26.2196 38.0128 26.2196C39.2463 26.2196 40.2083 25.9778 40.8988 25.4951C41.6043 25.0125 41.956 24.3455 41.956 23.4963C41.956 22.8667 41.7433 22.3467 41.3168 21.9376C40.8914 21.5274 40.1196 21.1108 39.0037 20.6857L37.3074 20.0272C35.8825 19.4711 34.8542 18.8563 34.2225 18.1829C33.6058 17.4947 33.2969 16.6892 33.2969 15.7676C33.2969 14.4496 33.7961 13.4108 34.7955 12.649C35.7938 11.8872 37.1599 11.5068 38.8936 11.5068C39.613 11.5068 40.3548 11.5942 41.119 11.77C41.8833 11.9309 42.5364 12.1578 43.0794 12.4508V14.2514C41.5808 13.6068 40.2009 13.2851 38.9374 13.2851C36.5431 13.2851 35.3459 14.098 35.3459 15.7228C35.3459 16.2651 35.5587 16.7254 35.9851 17.1068C36.4106 17.4872 37.1598 17.8899 38.2319 18.3151L39.9283 18.9735C41.3969 19.5446 42.4402 20.1881 43.0569 20.9062C43.6887 21.6094 44.004 22.4586 44.004 23.4537C44.004 24.8889 43.4898 26.0087 42.4616 26.8141C41.4483 27.6047 40.0234 28 38.1871 28C37.6291 28 37.0412 27.9563 36.4245 27.8679C35.8227 27.7805 35.2572 27.6633 34.7281 27.5163C34.199 27.3703 33.7511 27.2084 33.3845 27.0336L33.3867 27.0326Z" fill="#161513"></path>
					<path d="M45.6904 23.3654V16.2727H47.6732V23.3004C47.6732 24.2817 47.8859 25.035 48.3124 25.5624C48.7378 26.0898 49.3621 26.3529 50.1851 26.3529C50.8756 26.3529 51.5212 26.1185 52.1241 25.6497C52.7409 25.1671 53.2037 24.5299 53.5126 23.7394V16.2727H55.4954V27.7359H54.1518L53.7991 25.7818C53.3287 26.485 52.7344 27.0263 52.014 27.4066C51.3085 27.787 50.5379 27.9777 49.7009 27.9777C48.4236 27.9777 47.4317 27.5824 46.7262 26.7919C46.0357 26.0013 45.6904 24.8592 45.6904 23.3665V23.3654Z" fill="#161513"></path>
					<path d="M58.0033 14.2548V12.4766H60.4265V14.2548H58.0033ZM58.4662 27.7359V17.8102L57.3203 17.0857V16.2728H60.449V27.7359H58.4662Z" fill="#161513"></path>
					<path d="M63.6889 24.244V17.8972H61.7061V16.8871L63.6889 16.2287L64.482 13.1101H65.6717V16.2724H68.1611V17.8972H65.6717V24.2217C65.6717 25.481 66.2147 26.1107 67.3017 26.1107C67.4781 26.1107 67.647 26.1033 67.8084 26.0883C67.9847 26.0596 68.1461 26.0372 68.2936 26.0223V27.7355C68.0884 27.7792 67.8746 27.809 67.6545 27.824C67.4492 27.8389 67.229 27.8463 66.9939 27.8463C65.863 27.8463 65.026 27.5533 64.482 26.9684C63.9529 26.3824 63.6889 25.4746 63.6889 24.2451V24.244Z" fill="#161513"></path>
					<path d="M78.7833 27.1645C78.3718 27.4138 77.8213 27.6109 77.1308 27.7579C76.4553 27.9039 75.7135 27.9774 74.9054 27.9774C73.084 27.9774 71.703 27.4649 70.7634 26.44C69.8377 25.4001 69.376 23.885 69.376 21.8947C69.376 19.9045 69.8164 18.5205 70.6982 17.5243C71.5939 16.5291 72.8723 16.0305 74.5313 16.0305C77.7337 16.0305 79.3338 17.7949 79.3338 21.3226V22.5958H71.3802C71.4678 23.8839 71.8131 24.8279 72.4159 25.4288C73.0177 26.0148 73.9145 26.3078 75.1042 26.3078C75.7648 26.3078 76.389 26.2418 76.9769 26.1097C77.5648 25.9775 78.1666 25.773 78.7833 25.4949V27.1634V27.1645ZM74.5313 17.6553C73.5618 17.6553 72.805 17.9483 72.262 18.5333C71.7329 19.1043 71.4389 19.9386 71.3812 21.0371H77.4183C77.4183 19.8363 77.1907 18.9722 76.7353 18.4459C76.2949 17.9185 75.5606 17.6553 74.5323 17.6553H74.5313Z" fill="#161513"></path>
					</svg>
					</td>
				</tr>
				<tr>
					<td colspan="3">	
						<div id="resultsDiv" style="max-width: 100%; margin-top: 12px; display: none; overflow: auto; overflow-y: hidden;">
						<!-- RESULTS -->								
						</div>
					</td>
				</tr>	
			</table>
		</div>
	`;	
}


function jsFunctionQuerySubmit() {
	return `
		function querySubmit() {	
			if ( document.getElementById('query').value == '' ) { 
				alert( 'Please enter a search term.' );
				return; 
			}
			var theQuery;
			var textArea = document.getElementById('query');
			if ( textArea.selectionStart !== undefined ) {
				var startPos = textArea.selectionStart;
				var endPos = textArea.selectionEnd;
				theQuery = textArea.value.substring( startPos, endPos );
			} else if ( document.selection !== undefined ) {
				textArea.focus();
				var sel = document.selection.createRange();
				theQuery = sel.text;
			}
			if ( theQuery == '' ) { theQuery = document.getElementById('query').value; }
			document.getElementById('resultsDiv').style.display = "block";
			document.getElementById('resultsDiv').innerHTML = '<h5 style="color: green;">Running. This may take a minute...</h5>';			
			var requestPayload = { 
				'function': 'queryExecute', 
				'query': theQuery
			}
			console.log('Search execute', requestPayload);
			var xhr = new XMLHttpRequest();
			xhr.open( 'POST', '${scriptURL}', true );
			xhr.setRequestHeader( 'Accept', 'application/json' );		
			xhr.send( JSON.stringify( requestPayload ) );
			xhr.onload = function() {
				if( xhr.status === 200 ) {	
					try {
						queryResponsePayload = JSON.parse( xhr.response );
					} catch( e ) {	
						alert( 'Unable to parse the response.' );
						return;					
					}
					if ( queryResponsePayload['error'] == undefined ) {		
						responseGenerate();																															
					} else {
						var content = '<h5 class="text-danger">Error</h5>';
						content += '<pre>';
						content += queryResponsePayload.error.message;
						content += '</pre>';		
						document.getElementById('resultsDiv').innerHTML = content;								
					}																																			
				} else {
					var content = '<h5 class="text-danger">Error</h5>';
					content += '<pre>';
					content += 'XHR Error: Status ' + xhr.status;
					content += '</pre>';		
					document.getElementById('resultsDiv').innerHTML = content;								
				}
			}															
		}
	`
}

function jsFunctionResponseDataCopy() {
	return `
		function responseDataCopy() {
			var copyText = document.getElementById("responseData");
			copyText.select(); 
			document.execCommand("copy");
			return false;
		}		
	`
}

function jsFunctionResponseGenerate() {
	return `
		function responseGenerate() {
			responseGenerateTable();
		} 	
	`
}

function jsFunctionResponseGenerateTable() {
	return `
		function responseGenerateTable() {
			if ( queryResponsePayload.records.length > 0 ) {
				var columnNames = Object.keys( queryResponsePayload.records[0] );
				var thead = '<thead class="thead-light">';
				thead += '<tr>';
				for ( i = 0; i < columnNames.length; i++ ) {
					thead += '<th>' + columnNames[i] + '</th>';
				}
				thead += '</tr>';
				thead += '</thead>';
				var tbody = '<tbody>';
				for ( r = 0; r < queryResponsePayload.records.length; r++ ) {		
					tbody += '<tr>';
					for ( i = 0; i < columnNames.length; i++ ) {
						var value = queryResponsePayload.records[r][ columnNames[i] ];
						if ( value === null ) {
							value = '';
						}
						tbody += '<td>' + value + '</td>';					
					}				
					tbody += '</tr>';		
				}	
				tbody += '</tbody>';
				var content = '<h5 style="margin-bottom: 3px; color: #4d5f79; font-weight: 600;">Results</h5>';
				content += 'Retrieved ' + queryResponsePayload.records.length;
				content += ' rows in ' + queryResponsePayload.elapsedTime + 'ms.<br>';	
				content += '<div class="table-responsive">';
				content += '<table class="table table-sm table-bordered table-hover table-responsive-sm" id="resultsTable">';
				content += thead;
				content += tbody;
				content += '</table>';
				content += '</div>';		
				document.getElementById('resultsDiv').innerHTML = content;
			} else {
				document.getElementById('resultsDiv').innerHTML = '<h5 class="text-warning">No Records Were Found</h5>';
			}
		}	
	`
}

function postRequestHandle( context ) {
	var requestPayload = JSON.parse( context.request.body );
	context.response.setHeader( 'Content-Type', 'application/json' );
	switch ( requestPayload['function'] ) {
		case 'queryExecute':
			return queryExecute( context, requestPayload );
			break;
		case 'fileLoad':
			return fileLoad( context, requestPayload['files'], requestPayload['search']);
			break;		
		default:
			log.error( { title: 'Payload - Unsupported Function', details: requestPayload['function'] } );
	} 
}

function queryExecute( context, requestPayload ) {
	try {	
		var responsePayload;	
		let beginTime = new Date().getTime();		
		fileHits = new Array();
		var searchTerm = requestPayload.query;
		var filesSQL = `select f.id, f.name, f.filetype, f.folder, replace(mf.appfolder,' : ','/') path, f.url from file f 
			join systemnote sn on sn.recordid = f.id 
			join mediaitemfolder mf on mf.id = f.folder
			where field='MEDIAITEM.NKEY' and (f.filetype = 'JAVASCRIPT' or f.filetype = 'XMLDOC') and mf.appfolder like '%SuiteScripts%' and f.hideinbundle = 'F' and f.isInactive = 'F'`;
		var fileSearch = query.runSuiteQL( { query: filesSQL } ).asMappedResults(); 		
		var scriptSQL = `select 'Scheduled' type, sd.id, sd.title, sd.scriptid, sd.script, sd.deploymentid, ss.scriptid, ss.owner, ss.scriptfile from scheduledscriptdeployment sd join scheduledscript ss on ss.id = sd.script  where sd.isdeployed = 'T' 
			union
			select 'Client' type, cd.id, cd.recordtype, cd.scriptid, cd.script, cd.deploymentid, cs.scriptid, cs.owner, cs.scriptfile from clientscriptdeployment cd join clientscript cs on cs.id = cd.script where cd.isdeployed = 'T' 
			union
			select 'MRS' type, md.id, md.title, md.scriptid, md.script, md.deploymentid, ms.scriptid, ms.owner, ms.scriptfile from mapreducescriptdeployment md join mapreducescript ms on ms.id = md.script where md.isdeployed= 'T' 
			union
			select 'User' type, ud.id, ud.recordtype, ud.scriptid, ud.script, ud.deploymentid, us.scriptid, us.owner, us.scriptfile from usereventscriptdeployment ud join usereventscript us on us.id = ud.script where ud.isdeployed= 'T' 
			union
			select 'Suitelet' type, sd.id, sd.title, sd.scriptid, sd.script, sd.deploymentid, su.scriptid, su.owner, su.scriptfile from suiteletdeployment sd join suitelet su on su.id = sd.script where sd.isdeployed='T'`;
		var scriptResults = query.runSuiteQL( { query: scriptSQL } ).asMappedResults(); 
		const chunkSize = 20;
		do {
			var files = fileSearch.splice(0,chunkSize);
			var requestPayload = { 
				'function': 'fileLoad',
				'files': files,
				'search': searchTerm
			};
			var fileResponse = https.requestSuitelet({
				scriptId: runtime.getCurrentScript().id, 
				deploymentId: runtime.getCurrentScript().deploymentId,
				body: JSON.stringify( requestPayload )
			});
			var fResponse = JSON.parse(fileResponse.body);
			fResponse.forEach(function(r) {
				if (r && Object.keys(r).length > 0) {
					fileHits.push(r);
				}
				return true;
			});
		}
		while (fileSearch.length > 0);
		fileHits.forEach(function(hit) {
			for (var f = 0; scriptResults && f < scriptResults.length; f++) {
				hit.record = '';
				hit.scriptid = '';
				if (Number(scriptResults[f].scriptfile) == Number(hit.id)) {
					hit.record = scriptResults[f].title;
					hit.scriptid = scriptResults[f].scriptid_0 || scriptResults[f].scriptid;
					break;
				}
			}
			return true;
		});
		let elapsedTime = new Date().getTime() - beginTime ;
		responsePayload = { 'records': fileHits, 'elapsedTime': elapsedTime };	
	} catch( e ) {		
		log.error( { title: 'queryExecute Error', details: e } );
		responsePayload = { 'error': e }		
	}	
    context.response.write( JSON.stringify( responsePayload, null, 5 ) );	
}

function fileLoad( context, files, search ) {
	var returnFiles = [];
	files.forEach(function(f) {
		var fileObj = file.load( {  id: f.id  } );
		if (fileObj) {
			let contents = fileObj.getContents() || '';		
			let contentIndex = contents.toLowerCase().indexOf(search.toLowerCase());
			if ( contentIndex > 0) {
				f.filelocation = contentIndex;
				returnFiles.push(f);
			}
		}
		return true;
	});
	context.response.write( JSON.stringify( returnFiles, null, 5 ) );			
}
