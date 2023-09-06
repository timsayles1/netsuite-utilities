function renderForm(request, response) {
    var context = nlapiGetContext();
	if (request.getMethod() == 'GET') {
		const htmlData = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>' +
		'<div><iframe style="width: 90vw;height: 100vh;position: relative;" name="output_frame" id="output_frame" src="/erp/bankimport/ui/bankingimporthistory.nl?whence=" frameborder="0" allowfullscreen></iframe></div>' +
		'<script>' +
		'const forms = document.querySelector("form");' +
		'forms.addEventListener("click", event => {' +
		'  const { target } = event;' +
		'	if (target.id === "custpage_back") {' +
		'	history.back();' +
		'	}' +
		'});' +
		'$(document).ready(function(){' +
		'	$("#custpage_load").click(function(e) {' +
		'		e.preventDefault();' +
		'		var recId = $("#custpage_id").val();' +
		'		if (recId != "") {' +
		'		var urlString = "/app/accounting/transactions/bankimport/bankimporthistory.nl?id=" + recId;' +
		'		$("#output_frame").attr("src", urlString);' +
		'		}' +
		'		else {alert("No record ID entered.");}' +
		'	});' +
		'});' +
		'</script>';
		var form = nlapiCreateForm('Bank Import Details', false);
		form.addField('custpage_id','text','Import ID');
		form.addField('custpage_b_details','inlinehtml','Bank Details').setLayoutType('outsidebelow').setDefaultValue(htmlData);
		form.addButton('custpage_load','Load');
		form.addButton('custpage_back','Back');
		response.writePage(form);
	}
	else {
		nlapiLogExecution('DEBUG','Context',nlapiGetContext());
	}
}