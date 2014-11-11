feature("Initializing a AutocompleteTree", function () {
	scenario("An input with no value", function () {
		given("an input with no value", function () {
			input.val("");
		});
		when("setting a autocomplete-tree", function () {
			input.autocompleteTree();
		});
		then("the value should be an empty string", function () {
			expect(input).toHaveValue("");
		});
	});
});
