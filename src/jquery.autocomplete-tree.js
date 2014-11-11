/**
 * Ajax Autocomplete Tree for jQuery, version %version%
 * (c) 2014 Ricardo Momm
 *
 * Ajax Autocomplete Tree for jQuery is freely distributable under the terms of an MIT-style license.
 * For details, see the web site: https://github.com/ricardomomm/jquery.autocomplete-tree
 */
/*jslint browser: true, white: true, plusplus: true, vars: true */
/*global define, window, jQuery, exports, require */

// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
	'use strict';
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object' && typeof require === 'function') {
		// Browserify
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}
	(function ($) {
		'use strict';

		var
			keys = {
				ESC : 27,
				TAB : 9,
				RETURN : 13,
				LEFT : 37,
				UP : 38,
				RIGHT : 39,
				DOWN : 40
			};

		function AutocompleteTree(el, options) {
			var noop = function () {},
			that = this,
			defaults = {
				load : null,
				getValue : function (item) {
					return item.value;
				},
				getText : function (item) {
					return item.text;
				},
				getChildCount : function (item) {
					return item.childrenQuantity || 0;
				},
				select : noop,
				cache : false,
				debug : false,
				canSelectParent : false,
				canSelectParentInChildList : true,
				showParentInChildList : true,
				showBackButton : true,
				leftMargin : 15,
				topMargin : 5,
				treeSeparator : ' » ',
				maxVisibleItens : 5,
				animationDuration : 200,
				showPathTooltip : true,
				backLabel: 'Back'
			};

			// Shared variables:
			that.element = el;
			that.el = $(el);
			that.container = null;
			that.options = $.extend({}, defaults, options);
			that.console = window.console || noop;

			// Initialize and set options:
			that.initialize();
		}

		$.autocompleteTree = AutocompleteTree;

		AutocompleteTree.prototype = {

			onKeyPress : function (e) {
				var that = this;

				switch (e.which) {
				case keys.LEFT:
				case keys.RIGHT:
				case keys.UP:
				case keys.DOWN:
					that.navigate(e.which);
					return;
				case keys.RETURN:
					that.selectItem();
					return;
				case keys.ESC:
				case keys.TAB:
					that.hideAllItens();
					break;
				}

				// Cancel event if function did not return:
				e.stopImmediatePropagation();
				e.preventDefault();
			},
			debug : function (text) {
				var that = this;
				if (that.options.debug && arguments.length >= 1) {
					for (var i = 1; i < arguments.length; i++) {
						text = text.replace('{' + (i - 1) + '}', arguments[i]);
					}
					that.console.debug(text);
				}
			},
			getItemValue : function (item) {
				var that = this;
				return that.options.getValue(item);
			},
			getItemText : function (item) {
				var that = this;
				return that.options.getText(item);
			},
			getItemChildCount : function (item) {
				var that = this;
				return that.options.getChildCount(item);
			},
			/**
			 * Create the tree container if it doesn't exist.
			 */
			showContainer : function () {
				var that = this;
				if (that.container === null) {
					var offset = that.el.offset();

					that.container = $("<div id='act-container' class='act-container'></div>")
						.css({
							'position' : 'absolute',
							'left' : offset.left + 'px',
							'top' : (offset.top + that.el.outerHeight()) + 'px',
							'width' : (that.el.width()) + 'px'
						})
						.appendTo('body')
						.show();
				}
			},
			/**
			 * Adjust the container height to the maxVisibleItens option.
			 * @param {Object[]} item
			 */
			refreshContainerSize : function (item) {
				var that = this;
				if (item.children("li").length <= that.options.maxVisibleItens) {
					that.container.css({
						'height' : item.outerHeight() + 'px',
						'width' : that.el.outerWidth() + 'px'
					});
				} else {
					var height = 0;
					item.children("li").each(function (index, el) {
						if (index < that.options.maxVisibleItens) {
							height += $(el).outerHeight();
						}
					});

					that.container.css({
						'height' : height + 'px',
						'width' : (that.el.outerWidth() + (that.el.css('overflow-y') == 'scroll' ? 0 : 15)) + 'px',
						'overflow-y' : 'scroll'
					});
				}
			},
			/**
			 * Move the scroll position to the selected item.
			 * @param {Object} item
			 */
			ensureItemIsVisibile : function (item) {
				var that = this;
				if (that.isHiddenByScroll(item)) {
					that.container.animate({ scrollTop : item.offset().top - that.container.offset().top}, "fast");
				}
			},
			/**
			 * Check if the item is hidden by the scroll.
			 * @param {Object} item
			 * @returns {Boolean} true if it is hidden, false otherwise
			 */
			isHiddenByScroll : function (item) {
				if (item === null) {
					return false;
				}
				
				var that = this;
				var docViewTop = that.container.scrollTop();
				var docViewBottom = docViewTop + that.container.height();

				var elemTop = item.offset().top - that.container.offset().top;
				var elemBottom = elemTop + item.height();

				return ((elemBottom > docViewBottom) || (elemTop < docViewTop));
			},
			/**
			 * Show item 
			 * @param {Object} item
			 */
			showItem : function (item) {
				if (!item || item.is(':visible')) {
					return;
				}

				var that = this;
				that.container.show();
				var left = that.selectedItem && that.selectedItem.length > 0 ? that.selectedItem.offset().left + that.selectedItem.outerWidth() : 0;
				item.css(
					{
						'position' : 'absolute',
						'left' : left + 'px',
						'top' : '0px',
						'width' : ((that.selectedItem && that.selectedItem.length > 0) ? that.selectedItem.outerWidth() : (that.el.outerWidth())) + 'px' 
					})
					.show();
					
				that.refreshContainerSize(item);
				
				// slide left if one item it´s already selected
				if (that.visibleItem && that.visibleItem.length > 0) {
					that.slideLeft(that.visibleItem, item);
				}
				
				that.visibleItem = item;
				that.selectedItem = null;
				that.isVisible = true;
				that.focusNextItem(item);
			},
			/**
			 * Hide current visible item and show the parent if it exists
			 */
			hideItem : function () {
				var that = this;
				/*
				if (that.container.css('overflow-y') == 'scroll') {
					that.container.css({ 'width' : (that.el.outerWidth() - 15) + 'px' });
				}
				that.container.css({ 'overflow-y' : 'hidden' });
				*/
				
				if (!that.visibleItem || that.visibleItem.length === 0 || !that.visibleItem.is(':visible')) {
					return;
				}

				var oldVisibleItem = that.visibleItem;
				if (that.selectedItem) {
					that.selectedItem.toggleClass('act-selected');
				}
				
				// If it has parent then hide sons and focus on parent item
				var parentId = oldVisibleItem.data('parent');
				if (parentId) {
					that.selectedItem = $('#son-' + parentId);
					that.visibleItem = $('#sons-of-' + that.selectedItem.data('parent'));
					that.refreshContainerSize(that.visibleItem);
					that.slideRight(oldVisibleItem, that.visibleItem);
				} else {
					that.visibleItem.hide();
					that.container.hide();
					that.selectedItem = that.visibleItem = null;
					that.isVisible = false;
				}

				that.showPathTooltip();
			},
			/**
			 * Play the slide animation forward 
			 * @param {Object} itemToHide
			 * @param {Object} itemToShow
			 */
			slideLeft : function (itemToHide, itemToShow) {
				var that = this;
				
				itemToShow.animate(
					{ left : '0px' }, 
					{
						duration : that.options.animationDuration,
						queue : false
					}
				);

				itemToHide.animate(
					{ left : (itemToHide.outerWidth() * -1) + 'px' }, 
					{
						duration : that.options.animationDuration,
						queue : false
					}
				);				
			},
			/**
			 * Play the slide animation backward 
			 * @param {Object} itemToHide
			 * @param {Object} itemToShow
			 */
			slideRight : function (itemToHide, itemToShow) {
				var that = this;
				
				itemToHide.animate(
					{ left : (itemToHide.outerWidth()) + 'px' }, 
					{
						duration : that.options.animationDuration,
						queue : false,
						complete : function () { $(this).hide(); }
					}
				);	
				
				itemToShow.animate(
					{ left : '0px' }, 
					{
						duration : that.options.animationDuration,
						queue : false
					}
				);			
			},
			/**
			 * Load items from the selected parent
			 * @param {Object} parentItemId
			 */
			loadItems : function (parentItemId) {
				var that = this;
				var items = that.getCachedItems(parentItemId);
				if (!items) {
					that.debug('Loading itens sons of {0}', parentItemId);
					that.beginLoadItems(parentItemId);
					that.options.load(
						{term : null, parent : parentItemId }, 
						function(response) { 
							that.endLoadItems(parentItemId);
							that.loadItemsCompleted(parentItemId, response);
						}
					);
				} else {
					that.loadItemsCompleted(parentItemId, items);
				}
			},
			/**
			 * Begin load the child itens
			 */
			beginLoadItems : function (parentItemId) {
				// TODO: show loading image
			},
			/**
			 * End load the child itens
			 */
			endLoadItems : function (parentItemId) {
				// TODO: hide loading image
			},
			
			/**
			 * Load items completed callback
			 * @param {String} parentItemId
			 * @param {Object[]} items Loaded items array
			 */
			loadItemsCompleted : function (parentItemId, items) {
				var that = this;
				if (items) {
					if (that.options.cache) {
						that.el.data('sons-of-' + parentItemId, items);
					}
					that.debug('Result: {0}', items.toString());
					
					var itemContainer = that.createItemsContainer(parentItemId, items);
					that.showItem(itemContainer);
					
				} else {
					that.debug('No child itens found');
				}
			},
			/**
			 * Load child items from cache.
			 * @param {String} parentItemId
			 * @returns {Object[]|null} Cached items Array.
			 */
			getCachedItems : function (parentItemId) {
				var that = this;
				if (that.options.cache) {
					var items = that.el.data('sons-of-' + parentItemId);
					if (items) {
						that.debug('Loading itens sons of {0} from cache', parentItemId);
						return items;
					}
				}

				return null;
			},
			/**
			 * Create items html container if it doesn't exist
			 * @param {String} parentItemId
			 * @param {Object[]} items
			 * @returns {Object} items jquery object
			 */
			createItemsContainer : function (parentItemId, items) {
				var that = this;
				var html = $("#sons-of-" + parentItemId);
				// Se não existe
				if (html.length === 0) {
					that.showContainer();
					that.debug('Generating {0} container html', parentItemId);
					
					html = $("<ul id='sons-of-" + parentItemId + "' data-parent='" + parentItemId + "' class='act-menu' ></ul>")
						.appendTo($('#act-container'));

					if (parentItemId !== null) {
						if (that.options.showBackButton) {
							var backButton = that.createBackButton(parentItemId);
							html.append(backButton);
						}
						if (that.options.showParentInChildList && that.options.canSelectParentInChildList) {
							var parentItemData = $("#son-" + parentItemId).data('item');
							var selectableParent = that.createSelectableParentItem(parentItemData);
							html.append(selectableParent);
						}
					}
					
					$.each(items, function () {
						that.debug('Generating child {0}', this.toString());
						var child = that.createItem(parentItemId, this);
						html.append(child);
					});
				}
				
				return html;
			},
			/**
			 * Create a new Back button html
			 * @param {String} parentItemId
			 * @returns {Object} jQuery element object
			 */
			createBackButton : function (parentItemId) {
				var that = this;
				var backButton = $("<li id='back-" + parentItemId + "' data-parent='" + parentItemId + "' class='act-back act-unselectable'><span>" + that.options.backLabel + "</span></li>")
					.click(function () {
						that.selectItem();
					})
					.hover(
						function () {
							if (that.selectedItem) {
								that.selectedItem.removeClass('act-selected');
							}
							that.selectedItem = $(this).addClass('act-selected');
						},
						function () {
							if (that.selectedItem) {
								that.selectedItem.removeClass('act-selected');
							}
							$(this).removeClass('act-selected');
							that.selectedItem = null;
						}
					);

				return backButton;
			},
			/**
			 * Create a selectable item for parent selection on top of children list
			 * @param {Object} item
			 * @returns {Object} jQuery element object
			 */
			createSelectableParentItem : function (item) {
				var that = this;
				var itemValue = that.getItemValue(item);
				var $child = $("#son-" + itemValue);
				var child = $("<li id='parent-" + itemValue + "' data-parent='" + $child.data('parent') + "' data-val='" + itemValue + "' ><span>" + that.getItemText(item) + "</span></li>");
				child.data('item', item)
					.addClass('act-selectableParent')
					.click(function () {
						that.selectItem();
					})
					.hover(
						function () {
							if (that.selectedItem) {
								that.selectedItem.removeClass('act-selected');
							}
							that.selectedItem = $(this).addClass('act-selected');
						},
						function () {
							if (that.selectedItem) {
								that.selectedItem.removeClass('act-selected');
							}
							$(this).removeClass('act-selected');
							that.selectedItem = null;
						}
					);

				return child;
			},
			/**
			 * Create a child item
			 * @param {String} parentItemId
			 * @params {Object} item
			 * @returns {Object} jQuery element object
			 */
			createItem : function (parentItemId, item) {
				var that = this;
				var itemValue = that.getItemValue(item);
				var child = $("<li id='son-" + itemValue + "' data-parent='" + parentItemId + "'  data-val='" + itemValue + "' ><span>" + that.getItemText(item) + "</span></li>");
				child.data('item', item)
					.click(function () {
						var childCount = that.getItemChildCount($(this).data('item'));
						if ((childCount > 0 && that.options.canSelectParent) || childCount <= 0) {
							that.selectItem();
						} else if (childCount > 0) {
							that.loadItems($(this).data('val'));
						}
					})
					.hover(
						function () {
							if (that.selectedItem) {
								that.selectedItem.removeClass('act-selected');
							}
							that.selectedItem = $(this).addClass('act-selected');
						}, 
						function () {
							if (that.selectedItem) {
								that.selectedItem.removeClass('act-selected');
							}
							$(this).removeClass('act-selected');
							that.selectedItem = null;
						}
					);

				if (that.getItemChildCount(item) > 0) {
					child.addClass('act-menu-hasChildren');
					if (!that.options.canSelectParent) {
						child.addClass('act-unselectable');
					}
				}
				
				return child;
			},
			/**
			 * Focus the next available item from list
			 * @param {Object} items
			 */
			focusNextItem : function (items) {
				var that = this;
				var nextItem = items.children("li:first");
				if (that.selectedItem) {
					that.selectedItem.toggleClass('act-selected');
					nextItem = that.selectedItem.next();
					if (nextItem.length === 0) {
						nextItem = items.children("li:first");
					}
				}
				nextItem.toggleClass('act-selected');
				that.selectedItem = nextItem;
				that.ensureItemIsVisibile(that.selectedItem);
				that.showPathTooltip();
			},			
			/**
			 * Focus the previous available item from list
			 * @params {Object} items
			 */
			focusPreviousItem : function (items) {
				var that = this;
				if (!that.selectedItem) {
					that.hideItem();
				} else {
					that.selectedItem.toggleClass('act-selected');
					var previousItem = that.selectedItem.prev();
					if (previousItem.length === 0) {
						previousItem = items.children("li:last");
					}
					
					previousItem.toggleClass('act-selected');
					that.selectedItem = previousItem;
					that.ensureItemIsVisibile(that.selectedItem);
					that.showPathTooltip();
				}
			},
			/**
			 * Show the current complete path tooltip
			 */
			showPathTooltip : function () {
				var that = this;
				var tooltip = $("#act-pathTooltip");
				if (tooltip.length === 0) {
					tooltip = $("<div id='act-pathTooltip' class='act-pathTooltip' style='display:none'><div>");
					tooltip.appendTo('body');
				}
				tooltip.hide();
				tooltip.text('');
				if (that.options.showPathTooltip && that.selectedItem && !that.selectedItem.is('.act-back')) {
					var currentItem = that.selectedItem;
					var totalPath = '';
					do {
						totalPath = currentItem.text() + totalPath;
						totalPath = that.options.treeSeparator + totalPath;
						currentItem = $("#son-" + currentItem.data('parent'));
					} while (currentItem.length > 0);
					tooltip.text(totalPath);
					tooltip.show();
				}
			},
			/**
			 * Select the item from list
			 */
			selectItem : function () {
				var that = this;
				if (that.isVisible && that.selectedItem) {
					if (!that.selectedItem.is('.act-unselectable')) {
						var item = that.selectedItem.data('item');
						that.el.val(that.getItemText(item));
						that.container.hide();
						if (that.options.showPathTooltip) {
							$("#act-pathTooltip").hide();
						}
						that.isVisible = false;
						that.options.select.apply(that.el, [item]);
					} else if (that.selectedItem.is('.act-menu-hasChildren')) {
						that.loadItems(that.selectedItem.data('val'));
					} else if (that.selectedItem.is('.act-back')) {
						that.hideItem();
					}
				}
			},
			/**
			 * Hide all itens
			 */
			hideAllItens : function () {
				var that = this;
				while (that.isVisible) {
					that.hideItem();
				}
			},
			/**
			 * Check if selectedItem has childs and load then
			 */
			openChildItens : function () {
				var that = this;
				if (that.isVisible && that.selectedItem && !that.selectedItem.is('.act-back')) {
					var item = that.selectedItem.data('item');
					// If it has children
					if (that.getItemChildCount(item) > 0) {
						var itemId = that.getItemValue(item);
						that.loadItems(itemId);
					}
				}
			},
			/**
			 * Keyboard navigation in the list
			 * @param {Number} dir
			 */
			navigate : function (dir) {
				var that = this;
				switch (dir) {
				case keys.DOWN:
					var childItens = that.visibleItem;
					if (!that.visibleItem) {
						that.loadItems(null);
					} else {
						if (that.isVisible) {
							that.focusNextItem(childItens);
						} else {
							that.isVisible = true;
							that.container.show();
						}
					}
					break;
				case keys.UP:
					if (that.isVisible) {
						that.focusPreviousItem(that.visibleItem);
					}
					break;
				case keys.LEFT:
					that.hideItem();
					break;
				case keys.RIGHT:
					that.openChildItens();
					break;
				}
			},
			/**
			 * Dispose resources
			 */
			dispose: function () {
					var that = this;
					that.el.off('.autocompletetree').removeData('autocompletetree');
					that.container.remove();
					
					if (that.options.showPathTooltip){
						$("#act-pathTooltip").remove();
					}
			},
			/**
			 * Init
			 */
			initialize : function () {
				var that = this;

				// Remove autocomplete attribute to prevent native suggestions:
				that.element.setAttribute('autocomplete', 'off');

				that.el.on('keydown.autocompletetree', function (e) {
					that.onKeyPress(e);
				});

				// Finalizou a inicialização
				that.debug('AutoComplete-Tree initialized');
			}

		};

		$.fn.autocompleteTree = function (options, args) {
        var dataKey = 'autocompletetree';
        // If function invoked without argument return
        // instance of the first matched element:
        if (arguments.length === 0) {
            return this.first().data(dataKey);
        }

        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataKey);

            if (typeof options === 'string') {
                if (instance && typeof instance[options] === 'function') {
                    instance[options](args);
                }
            } else {
                // If instance already exists, destroy it:
                if (instance && instance.dispose) {
                    instance.dispose();
                }
                instance = new AutocompleteTree(this, options);
                inputElement.data(dataKey, instance);
            }
        });
    };

	}));
