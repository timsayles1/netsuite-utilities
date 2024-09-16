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

------------------------------------------------------------------------------------------
MIT License
------------------------------------------------------------------------------------------

Copyright (c) 2024 Timothy Sayles.

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

var file, https, query, runtime, serverWidget, url;

define( [ 'N/file', 'N/https', 'N/query', 'N/runtime', 'N/ui/serverWidget', 'N/url' ], main );

function main( fileModule, httpsModule, queryModule, runtimeModule, serverWidgetModule, urlModule ) {
	
	file = fileModule;
	https = httpsModule;
	query = queryModule;
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
	var pageField = form.addField({
		id: 'custpage_page_html',
		type: serverWidget.FieldType.INLINEHTML,
		label: 'HTML'
	});
	pageField.defaultValue = mainGenerate();
	context.response.writePage( form );					
}

function mainGenerate() {
	return `
		<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
		<script src="/ui/jquery/jquery-3.5.1.min.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
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
		${contentsGenerate()}
		<script>
		jQuery("input[type='radio'][name='typeSelect']").on('change', function() {
			if (jQuery("input[type='radio'][name='typeSelect']:checked").val() == 'contents') {
				document.getElementById('query').placeholder = "Enter text to search for in JS and XML files...";
				document.getElementById('queryHeader').innerText = "Search in file for:";
			}
			if (jQuery("input[type='radio'][name='typeSelect']:checked").val() == 'deployments') {
				document.getElementById('query').placeholder = "Enter file name to search for..."
				document.getElementById('queryHeader').innerText = "Search for scripts using file name:";
			}
			return true;
		});
		</script>
		<script>	
			var
				activeFile = {},
				queryResponsePayload;
			window.jQuery = window.$ = jQuery;
			$('#queryUI').show();
			${jsFunctionCheckChange()}
			${jsFunctionQuerySubmit()}
			${jsFunctionResponseGenerateTable()}
		</script>	
	`
}

function contentsGenerate() {
	return `
		<div class="collapse" id="queryUI" style="text-align: left;">	
			<table style="table-layout: fixed; width: 100%; border-spacing: 6px; border-collapse: separate;">
				<tr>				
					<td width="20%">
						<h5 id="queryHeader" style="margin-bottom: 0px; color: #4d5f79; font-weight: 600;">Search in file for:</h5>
					</td>
					<td width="55%" style="text-align: right;">
						<div id="buttonsDiv">
						<div class="form-check form-check-inline">
						  <input class="form-check-input" type="radio" name="typeSelect" id="contents" value="contents" checked>
						  <label class="form-check-label" for="contents">Contents</label>
						</div>
						<div class="form-check form-check-inline">
						  <input class="form-check-input" type="radio" name="typeSelect" id="deployments" value="deployments">
						  <label class="form-check-label" for="deployments">Deployments</label>
						</div>
						  <button type="button" class="btn btn-sm btn-success" onclick="querySubmit();">Run Search</button>	
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

function jsFunctionCheckChange() {
	return ``
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
			var queryType = jQuery("input[type='radio'][name='typeSelect']:checked").val();			
			var requestPayload = { 
				'function': 'queryExecute', 
				'query': theQuery,
				'type': queryType
			}
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
						responseGenerateTable();																															
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
	var responsePayload;	
	var beginTime = new Date().getTime();		
	if (requestPayload.type == 'contents') {
		try {	
			fileHits = new Array();
			var searchTerm = requestPayload.query;
			var filesSQL = `select f.id file_id,'<a href="/app/common/media/mediaitem.nl?id='||f.id||'" target = "_blank">'||f.name||'</a>' file_name, f.filetype, f.folder, replace(mf.appfolder,' : ','/') path from file f 
				join systemnote sn on sn.recordid = f.id 
				join mediaitemfolder mf on mf.id = f.folder
				where field='MEDIAITEM.NKEY' and (f.filetype = 'JAVASCRIPT' or f.filetype = 'XMLDOC') 
				and mf.appfolder like '%SuiteScripts%' and f.hideinbundle = 'F' and f.isInactive = 'F'`;
			var fileSearch = query.runSuiteQL( { query: filesSQL } ).asMappedResults(); 		
			var scriptSQL = `select 'Scheduled' type, sd.id, sd.title, sd.scriptid, sd.script, sd.deploymentid, ss.scriptid, ss.owner, ss.scriptfile from scheduledscriptdeployment sd join scheduledscript ss on ss.id = sd.script  where sd.isdeployed = 'T' 
				union select 'Client' type, cd.id, cd.recordtype, cd.scriptid, cd.script, cd.deploymentid, cs.scriptid, cs.owner, cs.scriptfile from clientscriptdeployment cd join clientscript cs on cs.id = cd.script where cd.isdeployed = 'T' 
				union select 'MRS' type, md.id, md.title, md.scriptid, md.script, md.deploymentid, ms.scriptid, ms.owner, ms.scriptfile from mapreducescriptdeployment md join mapreducescript ms on ms.id = md.script where md.isdeployed= 'T' 
				union select 'User' type, ud.id, ud.recordtype, ud.scriptid, ud.script, ud.deploymentid, us.scriptid, us.owner, us.scriptfile from usereventscriptdeployment ud join usereventscript us on us.id = ud.script where ud.isdeployed= 'T' 
				union select 'Suitelet' type, sd.id, sd.title, sd.scriptid, sd.script, sd.deploymentid, su.scriptid, su.owner, su.scriptfile from suiteletdeployment sd join suitelet su on su.id = sd.script where sd.isdeployed='T'`;
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
					hit.script_name = '';
					if (Number(scriptResults[f].scriptfile) == Number(hit.id)) {
						//hit.record = scriptResults[f].title;
						hit.script_name = scriptResults[f].scriptid_0 || scriptResults[f].scriptid;
						break;
					}
				}
				return true;
			});
			var elapsedTime = new Date().getTime() - beginTime ;
			responsePayload = { 'records': fileHits, 'elapsedTime': elapsedTime };	
		} catch( e ) {		
			log.error( { title: 'queryExecute Error', details: e } );
			responsePayload = { 'error': e }		
		}	
		context.response.write( JSON.stringify( responsePayload, null, 5 ) );	
	}
	if (requestPayload.type == 'deployments') {
		var searchTerm = requestPayload.query.trim();
		var scriptSQL = `select 'Scheduled' type, sd.isdeployed, sd.id, sd.title, sd.scriptid deployment_name, sd.script, sd.deploymentid, 
			'<a href="/app/common/scripting/script.nl?id='||sd.script||'" target = "_blank">'||ss.scriptid||'</a>' script_name, BUILTIN.DF(ss.owner) owner from scheduledscriptdeployment sd join scheduledscript ss on ss.id = sd.script  join file on file.id = ss.scriptfile where file.name = '${searchTerm}'
			union select 'Client' type, cd.isdeployed, cd.id, cd.recordtype, cd.scriptid deployment_name, cd.script, cd.deploymentid, 
			'<a href="/app/common/scripting/script.nl?id='||cd.script||'" target = "_blank">'||cs.scriptid||'</a>' script_name, BUILTIN.DF(cs.owner) owner from clientscriptdeployment cd join clientscript cs on cs.id = cd.script join file on file.id = cs.scriptfile where file.name = '${searchTerm}'
			union select 'MRS' type, md.isdeployed, md.id, md.title, md.scriptid deployment_name, md.script, md.deploymentid, 
			'<a href="/app/common/scripting/script.nl?id='||md.script||'" target = "_blank">'||ms.scriptid||'</a>' script_name, BUILTIN.DF(ms.owner) owner from mapreducescriptdeployment md join mapreducescript ms on ms.id = md.script join file on file.id = ms.scriptfile where file.name = '${searchTerm}'
			union select 'User' type, ud.isdeployed, ud.id, ud.recordtype, ud.scriptid deployment_name, ud.script, ud.deploymentid, 
			'<a href="/app/common/scripting/script.nl?id='||ud.script||'" target = "_blank">'||us.scriptid||'</a>' script_name, BUILTIN.DF(us.owner) owner from usereventscriptdeployment ud join usereventscript us on us.id = ud.script join file on file.id = us.scriptfile where file.name = '${searchTerm}'
			union select 'Suitelet' type, sd.isdeployed, sd.id, sd.title, sd.scriptid deployment_name, sd.script, sd.deploymentid, 
			'<a href="/app/common/scripting/script.nl?id='||sd.script||'" target = "_blank">'||su.scriptid||'</a>' script_name, BUILTIN.DF(su.owner) owner from suiteletdeployment sd join suitelet su on su.id = sd.script join file on file.id = su.scriptfile where file.name = '${searchTerm}'`;
		var scriptResults = query.runSuiteQL( { query: scriptSQL } ).asMappedResults(); 
		var elapsedTime = new Date().getTime() - beginTime ;
		var results = []
		results.push(scriptResults);
		responsePayload = { 'records': scriptResults, 'elapsedTime': elapsedTime };
		context.response.write( JSON.stringify( responsePayload, null, 5 ) );	
	}
}

function fileLoad( context, files, search ) {
	var returnFiles = [];
	files.forEach(function(f) {
		var fileObj = file.load( {  id: f.file_id  } );
		if (fileObj) {
			let contents = fileObj.getContents() || '';		
			let contentIndex = contents.toLowerCase().indexOf(search.toLowerCase());
			if ( contentIndex > 0) {
				f.file_position = contentIndex;
				returnFiles.push(f);
			}
		}
		return true;
	});
	context.response.write( JSON.stringify( returnFiles, null, 5 ) );			
}
