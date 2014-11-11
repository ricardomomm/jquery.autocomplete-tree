function importGrammar(g){
    for (var prop in g) {
        if (g.hasOwnProperty(prop))
            window[prop] = g[prop];

    }
}

importGrammar(jasmine.grammar.FeatureStory);
importGrammar(jasmine.grammar.GWT);

var input;

beforeEach(function(){ 
	input = $("<input />").appendTo("body").focus(); 
});

afterEach(function(){ 

	if (input.data('autocompletetree'))
		input.autocompleteTree('dispose');
		
	input.remove();
});
