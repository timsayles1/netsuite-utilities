/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
 
// Usage https://scriptdeploymenturl&recid=*RECORDID*&rectype=*RECORDTYPE*

define(['N/https', 'N/url', 'N/xml'], function(https, url, xmlMod) {
	
	function nsXMLToJSON(node){
		var obj=nsXMLToJSONDirty(node);  
		var cleanObj=cleanObject(obj,true);
		return cleanObj;
		function nsXMLToJSONDirty(node){
			var obj={};
			if(!'nodeType' in node){
			  return obj;
			}
			if(node.nodeType==1 || node.nodeType=='ELEMENT_NODE'){
				if(Object.keys(node.attributes).length > 0){
					obj["@attributes"]={};
					for(var j in node.attributes){
						var attribute=node.attributes[j];
						if(attribute){
							obj["@attributes"][attribute.name]=attribute.value;
						}
					}
				}
			}
			else if(node.nodeType==3 || node.nodeType=='TEXT_NODE'){
				obj=node.nodeValue;
			}
			if(node.hasChildNodes()){
				var childNodes=node.childNodes;
				for(var k in childNodes){
					var item=childNodes[k];
					var nodeName=item.nodeName;
					if(typeof (obj[nodeName])=="undefined"){
						obj[nodeName]=nsXMLToJSONDirty(item); //run the function again
					}
					else{
						if(typeof (obj[nodeName].push)=="undefined"){
							var old=obj[nodeName];
							obj[nodeName]=[];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(nsXMLToJSONDirty(item));
					}
				}
			}
			return obj;
		}
		function cleanObject(myobj,recurse){
		var myobjcopy=JSON.parse(JSON.stringify(myobj));
				for(var i in myobjcopy){
					if(recurse && typeof myobjcopy[i]==='object'){
						if(i=="#text"){
							delete myobjcopy[i];
						} 
						else {
							if(Object.keys(myobjcopy[i]).length==1){
								if(typeof myobjcopy[i]['#text'] != "undefined"){
									if(myobjcopy[i]['#text'] || myobjcopy[i]['#text']==0){
										myobjcopy[i]=myobjcopy[i]['#text'];
									}
								}
							}
							else{
								if(Object.keys(myobjcopy[i]).length==0){
									myobjcopy[i]=undefined;            
								}
							}
							if(myobjcopy[i]){
								myobjcopy[i]=cleanObject(myobjcopy[i],recurse);
							}
						}
					}
				}
				return myobjcopy;
			}
		}
		function getRecordJSON(recId, recType) {
			var recInfo = {};
			var recURL = url.resolveRecord({
				recordType: recType,
				recordId : recId,
				isEditMode: false
			});
			https.get.promise({
				url: recURL + '&xml=t'
			}).then((response) => {
				if (response.code == 200) {
					log.debug('Fetch Response', response.body);
					var xmlObj = xmlMod.Parser.fromString({
						text : response.body
					});
					var jsonObj = nsXMLToJSON(xmlObj.documentElement);
					let machineInfo = jsonObj.record.machine;
					var itemInfo = [];
					for (let i = 0; i < machineInfo.length; i++) {
						if (machineInfo[i]['@attributes'].name == 'item') {
							itemInfo = machineInfo[i].line;
							break;
						}
					}
					var itemArray = [];
					itemInfo.forEach(function(i) {
						let itemLine = {};
						itemLine.line = i.line;
						itemLine.lineuniquekey = i.lineuniquekey;
						itemLine.data = i;
						itemArray.push(itemLine);
						return true;
					});
					recInfo.status = 'success';
					recInfo.data = itemArray;
				}
				else {
					recInfo.status = response.code;
					recInfo.data = response.body;
				}
			}).catch((error) => {
				log.error('Fetch Error',error);
				recInfo.status = 'error';
				recInfo.data = error;
			});
			return recInfo;
		}
	
	return {
		onRequest: function(context) {
			if (context.request.method === 'GET') {
				var recId = context.request.parameters.recid;
				var recType = context.request.parameters.rectype;
				var recordJSON = getRecordJSON(recId, recType);
				context.response.write(JSON.stringify(recordJSON));
			}
		}
	}
});