feature("Down Key", function () {
	var downKeyEvent = $.Event('keydown.autocompletetree');
	downKeyEvent.which = downKeyEvent.keyCode = 40;

	var sampleDB = {
		'null' : [ 	{ value : 1, text: 'Item 001', childrenQuantity: 1 },
					{ value : 2, text: 'Item 002', childrenQuantity: 3 },
					{ value : 3, text: 'Item 003', childrenQuantity: 2 },
					{ value : 4, text: 'Item 004', childrenQuantity: 0 } ],
		
		'1' : [ 	{ value : 11, text: 'Item 001 - 001', childrenQuantity: 0 }],
		
		'2' : [ 	{ value : 21, text: 'Item 002 - 001', childrenQuantity: 0 },
					{ value : 22, text: 'Item 002 - 002', childrenQuantity: 0 },
					{ value : 23, text: 'Item 002 - 003', childrenQuantity: 0 } ],

		'3' : [ 	{ value : 31, text: 'Item 003 - 001', childrenQuantity: 0 },
					{ value : 32, text: 'Item 003 - 002', childrenQuantity: 2 } ],
					
		'32' : [ 	{ value : 331, text: 'Item 003 - Item 002 - 001', childrenQuantity: 0 },
					{ value : 332, text: 'Item 003 - Item 002 - 002', childrenQuantity: 0 } ],
	};	
	
	story('User presses down key after set focus', function () {
	
		scenario("Valid data has been loaded", function () {	
				
			given("an input with empty value", function () {
				input.autocompleteTree({
					load: function (request, response) {
						var prefix = request.term === null ? request.parent : request.term;
						response(sampleDB[request.parent]);
					}
				});
			});
			
			when("pressing down key", function () {
				input.trigger(downKeyEvent);
			});
			
			then("first tree level should be visible", function () {
				expect($("#act-container")).toBeVisible();
			});			
			
			then("first item should be focused", function () {
				expect($("#act-container > .act-menu:first-child li:first")).toHaveClass('act-selected');
			});			
		});
		
	});
	
	story('User presses down key twice after set focus', function () {
	
		scenario("Valid data has been loaded", function () {	
				
			given("an input with empty value", function () {
				input.autocompleteTree({
					load: function (request, response) {
						var prefix = request.term === null ? request.parent : request.term;
						response(sampleDB[request.parent]);
					}
				});
			});
			
			when("pressing down key twice", function () {
				input.trigger(downKeyEvent);
				input.trigger(downKeyEvent);
			});
			
			then("second item should be focused", function () {
				expect($("#act-container > .act-menu:first-child li.act-selected").length).toBe(1);
				expect($("#act-container > .act-menu:first-child li:nth-child(2)")).toHaveClass('act-selected');
			});			
		});
		
	});
	
});
