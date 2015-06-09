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
				DOWN : 40,
				BCKSPC : 8,
				DELETE : 46
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
				treeSeparator : ' \u00BB ',
				maxVisibleItens : 5,
				animationDuration : 200,
				showPathTooltip : true,
				backLabel: 'Back',
                rightArrowTemplate: function() {
                    return ' \u00BB ';
                }
			};

			// Shared variables:
			that.element = el;
			that.el = $(el);
            that.prefix = el.id;
			that.container = null;
			that.options = $.extend({}, defaults, options);
			that.console = window.console || noop;
			that.searching = false;

			// Initialize and set options:
			that.initialize();
		}

		$.autocompleteTree = AutocompleteTree;

		AutocompleteTree.prototype = {

			onKeyPress : function (e) {
				switch (e.which) {
					case keys.LEFT:
					case keys.RIGHT:
					case keys.UP:
					case keys.DOWN:
						this.navigate(e.which);
						return;
					case keys.RETURN:
						this.selectItem();
						return;
					case keys.ESC:
						this.hideAllItens();
	                    break;
					case keys.TAB:
						this.hideAllItens();
						return;				
					default:
						return;
				}

				// Cancel event if function did not return:
				e.stopImmediatePropagation();
				e.preventDefault();
			},
			onKeyUp : function (e) {
				if (this.searching && !this.el.val()) {
					this.endSearch();
				} else if (!this.searching && this.el.val()) {
					this.beginSearch();
				}
			},
			beginSearch : function () {
				if (this.searching && this.el.val()) {
					return;
				} else if (this.searching) {
					this.endSearch();
					return;
				}
				
				this.debug('Begin search');	
				this.searching = true;
			},
			endSearch : function () {
				this.debug('End search');
				this.searching = false;	
			},			
            onBodyClick : function () {
                if (this.isVisible)
                    this.hideAllItens();
            },
			debug : function (text) {
				if (this.options.debug && arguments.length >= 1) {
					for (var i = 1; i < arguments.length; i++) {
						text = text.replace('{' + (i - 1) + '}', arguments[i]);
					}
					this.console.debug(text);
				}
			},
			getItemValue : function (item) {
				return this.options.getValue(item);
			},
			getItemText : function (item) {
				return this.options.getText(item);
			},
			getItemChildCount : function (item) {
				return this.options.getChildCount(item);
			},
			/**
			 * Create the tree container if it doesn't exist.
			 */
			showContainer : function () {
				if (this.container === null) {
					var offset = this.el.offset();

					this.container = $("<div id='" + this.prefix + "-act-container' class='act-container'></div>")
						.css({
							'position' : 'absolute',
							'left' : offset.left + 'px',
							'top' : (offset.top + this.el.outerHeight()) + 'px',
							'width' : (this.el.width()) + 'px'
						})
						.appendTo('body')
						.show();
				} else {
                    this.container.show();
                }
			},
			/**
			 * Adjust the container height to the maxVisibleItens option.
			 * @param {Object[]} item
			 */
			refreshContainerSize : function (item) {
				var children = item.children("li");
				if (children.length <= this.options.maxVisibleItens) {
					this.container.css({
						'height' : item.outerHeight() + 'px',
						'width' : this.el.outerWidth() + 'px'
					});
				} else {
					var height = 0;
					var that = this;
					children.each(function (index, el) {
						if (index < that.options.maxVisibleItens) {
							height += $(el).outerHeight();
						}
					});

					this.container.css({
						'height' : height + 'px',
						'width' : (this.el.outerWidth() + (this.el.css('overflow-y') === 'scroll' ? 0 : 15)) + 'px',
						'overflow-y' : 'scroll'
					});
				}
			},
			/**
			 * Move the scroll position to the selected item.
			 * @param {Object} item
			 */
			ensureItemIsVisibile : function (item) {
				if (this.isHiddenByScroll(item)) {
					this.container.animate({ scrollTop : item.offset().top - this.container.offset().top }, "fast");
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
				
				var docViewTop = this.container.scrollTop();
				var docViewBottom = docViewTop + this.container.height();

				var elemTop = (item.offset().top - this.container.offset().top) + docViewTop;
				var elemBottom = elemTop + item.height();

				return ((elemBottom < docViewTop || elemBottom > docViewBottom) || (elemTop < docViewTop || elemTop > docViewBottom));
			},
			/**
			 * Show item 
			 * @param {Object} item
			 */
			showItem : function (item) {
				if (!item || item.is(':visible')) {
					return;
				}

				this.container.show();
				var left = this.selectedItem && this.selectedItem.length > 0 ? this.selectedItem.offset().left + this.selectedItem.outerWidth() : 0;
				item.css(
					{
						'position' : 'absolute',
						'left' : left + 'px',
						'top' : '0px',
						'width' : ((this.selectedItem && this.selectedItem.length > 0) ? this.selectedItem.outerWidth() : (this.el.outerWidth())) + 'px' 
					})
					.show();
					
				this.refreshContainerSize(item);
				
				// slide left if one item its already selected
				if (this.visibleItem && this.visibleItem.length > 0) {
					this.slideLeft(this.visibleItem, item);
				}
				
				this.visibleItem = item;
				this.selectedItem = null;
				this.isVisible = true;
				this.focusNextItem(item);
			},
			/**
			 * Hide current visible item and show the parent if it exists
			 */
			hideItem : function () {
				/*
				if (that.container.css('overflow-y') == 'scroll') {
					that.container.css({ 'width' : (that.el.outerWidth() - 15) + 'px' });
				}
				that.container.css({ 'overflow-y' : 'hidden' });
				*/
				
				if (!this.visibleItem || this.visibleItem.length === 0 || !this.visibleItem.is(':visible')) {
					return;
				}

				var oldVisibleItem = this.visibleItem;
				if (this.selectedItem) {
					this.selectedItem.toggleClass('act-selected');
				}
				
				// If it has parent then hide sons and focus on parent item
				var parentId = oldVisibleItem.data('parent');
				if (parentId) {
					this.selectedItem = $("#" + this.prefix + "-son-" + parentId);
					this.visibleItem = $("#" + this.prefix + "-sons-of-" + this.selectedItem.data('parent'));
					this.refreshContainerSize(this.visibleItem);
					this.slideRight(oldVisibleItem, this.visibleItem);
				} else {
					this.visibleItem.hide();
					this.container.hide();
					this.selectedItem = this.visibleItem = null;
					this.isVisible = false;
				}

				this.showPathTooltip();
			},
			/**
			 * Play the slide animation forward 
			 * @param {Object} itemToHide
			 * @param {Object} itemToShow
			 */
			slideLeft : function (itemToHide, itemToShow) {
				
				itemToShow.animate(
					{ left : '0px' }, 
					{
						duration : this.options.animationDuration,
						queue : false
					}
				);

				itemToHide.animate(
					{ left : (itemToHide.outerWidth() * -1) + 'px' }, 
					{
						duration : this.options.animationDuration,
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
				
				itemToHide.animate(
					{ left : (itemToHide.outerWidth()) + 'px' }, 
					{
						duration : this.options.animationDuration,
						queue : false,
						complete : function () { $(this).hide(); }
					}
				);	
				
				itemToShow.animate(
					{ left : '0px' }, 
					{
						duration : this.options.animationDuration,
						queue : false
					}
				);			
			},
			/**
			 * Load items from the selected parent
			 * @param {Object} parentItemId
			 */
			loadItems : function (parentItemId) {
				var items = this.getCachedItems(parentItemId);
				if (!items) {
					this.debug('Loading itens sons of {0}', parentItemId);
					this.beginLoadItems(parentItemId);
					this.options.load(
						{term : null, parent : parentItemId }, 
						$.proxy(function(response) { 
								this.endLoadItems(parentItemId);
								this.loadItemsCompleted(parentItemId, response);
							}, this)
					);
				} else {
					this.loadItemsCompleted(parentItemId, items);
				}
			},
			/**
			 * Begin load the child itens
			 */
			beginLoadItems : function () {
				// TODO: show loading image
			},
			/**
			 * End load the child itens
			 */
			endLoadItems : function () {
				// TODO: hide loading image
			},
			
			/**
			 * Load items completed callback
			 * @param {String} parentItemId
			 * @param {Object[]} items Loaded items array
			 */
			loadItemsCompleted : function (parentItemId, items) {
				if (items) {
					if (this.options.cache) {
						this.el.data('sons-of-' + parentItemId, items);
					}
					this.debug('Result: {0}', items.toString());
					
					var itemContainer = this.createItemsContainer(parentItemId, items);
					this.showItem(itemContainer);
					
				} else {
					this.debug('No child itens found');
				}
			},
			/**
			 * Load child items from cache.
			 * @param {String} parentItemId
			 * @returns {Object[]|null} Cached items Array.
			 */
			getCachedItems : function (parentItemId) {
				if (this.options.cache) {
					var items = this.el.data('sons-of-' + parentItemId);
					if (items) {
						this.debug('Loading itens sons of {0} from cache', parentItemId);
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
				var html = $("#" + this.prefix + "-sons-of-" + parentItemId);
				if (html.length === 0) {
					this.showContainer();
					this.debug('Generating {0} container html', parentItemId);
					
					html = $("<ul id='" + this.prefix + "-sons-of-" + parentItemId + "' data-parent='" + parentItemId + "' class='act-menu' ></ul>")
						.appendTo(this.container);

					if (parentItemId !== null) {
						if (this.options.showBackButton) {
							var backButton = this.createBackButton(parentItemId);
							html.append(backButton);
						}
						if (this.options.showParentInChildList && this.options.canSelectParentInChildList) {
							var parentItemData = $("#" + this.prefix + "-son-" + parentItemId).data('item');
							var selectableParent = this.createSelectableParentItem(parentItemData);
							html.append(selectableParent);
						}
					}
					
					var that = this;
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
				var backButton = $("<li id='" + this.prefix + "-back-" + parentItemId + "' data-parent='" + parentItemId + "' class='act-back act-unselectable'><span>" + this.options.backLabel + "</span></li>")
					.click(function (e) {
						that.selectItem();
                        
                        // Cancel event if function did not return:
                        e.stopImmediatePropagation();
                        e.preventDefault();
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
				var itemValue = this.getItemValue(item);
				var $child = $("#" + this.prefix + "-son-" + itemValue);
				var child = $("<li id='" + this.prefix + "-parent-" + itemValue + "' data-parent='" + $child.data('parent') + "' data-val='" + itemValue + "' ><span>" + this.getItemText(item) + "</span></li>");
				child.data('item', item)
					.addClass('act-selectableParent')
					.click(function (e) {
						that.selectItem();
                        
                        // Cancel event if function did not return:
                        e.stopImmediatePropagation();
                        e.preventDefault();
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
				var itemValue = this.getItemValue(item);
				var child = $("<li id='" + this.prefix + "-son-" + itemValue + "' data-parent='" + parentItemId + "'  data-val='" + itemValue + "' ><span>" + this.getItemText(item) + "</span></li>");
				child.data('item', item)
					.click(function (e) {
						var childCount = that.getItemChildCount($(this).data('item'));
						if ((childCount > 0 && that.options.canSelectParent) || childCount <= 0) {
							that.selectItem();
						} else if (childCount > 0) {
							that.loadItems($(this).data('val'));
						}
                        
                        // Cancel event if function did not return:
                        e.stopImmediatePropagation();
                        e.preventDefault();
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

				if (this.getItemChildCount(item) > 0) {
					child.addClass('act-menu-hasChildren');
					if (!this.options.canSelectParent) {
						child.addClass('act-unselectable');
					}
                    
                    $("<span class=\"pull-right\">" + this.options.rightArrowTemplate(item) + "</span>").insertAfter(child.find("span"));
				}
				
				return child;
			},
			/**
			 * Focus the next available item from list
			 * @param {Object} items
			 */
			focusNextItem : function (items) {
				var nextItem = items.children("li:first");
				if (this.selectedItem) {
					this.selectedItem.toggleClass('act-selected');
					nextItem = this.selectedItem.next();
					if (nextItem.length === 0) {
						nextItem = items.children("li:first");
					}
				}
				nextItem.toggleClass('act-selected');
				this.selectedItem = nextItem;
				this.ensureItemIsVisibile(this.selectedItem);
				this.showPathTooltip();
			},			
			/**
			 * Focus the previous available item from list
			 * @params {Object} items
			 */
			focusPreviousItem : function (items) {
				if (!this.selectedItem) {
					this.hideItem();
				} else {
					this.selectedItem.toggleClass('act-selected');
					var previousItem = this.selectedItem.prev();
					if (previousItem.length === 0) {
						previousItem = items.children("li:last");
					}
					
					previousItem.toggleClass('act-selected');
					this.selectedItem = previousItem;
					this.ensureItemIsVisibile(this.selectedItem);
					this.showPathTooltip();
				}
			},
			/**
			 * Show the current complete path tooltip
			 */
			showPathTooltip : function () {
				var tooltip = $("#" + this.prefix + "-act-pathTooltip");
				if (tooltip.length === 0) {
					tooltip = $("<div id='" + this.prefix + "-act-pathTooltip' class='act-pathTooltip' style='display:none'><div>");
					tooltip.appendTo('body');
				}
				tooltip.hide();
				tooltip.text('');
				if (this.options.showPathTooltip && this.selectedItem && !this.selectedItem.is('.act-back')) {
					var currentItem = this.selectedItem;
					var totalPath = '';
					do {
						totalPath = currentItem.find("span:first").text() + totalPath;
						totalPath = this.options.treeSeparator + totalPath;
						currentItem = $("#" + this.prefix + "-son-" + currentItem.data('parent'));
					} while (currentItem.length > 0);
					tooltip.text(totalPath);
					tooltip.show();
				}
			},
			/**
			 * Select the item from list
			 */
			selectItem : function () {
				if (this.isVisible && this.selectedItem) {
					if (!this.selectedItem.is('.act-unselectable')) {
						var item = this.selectedItem.data('item');
						this.el.val(this.getItemText(item));
						this.container.hide();
						if (this.options.showPathTooltip) {
							$("#" + this.prefix + "-act-pathTooltip").hide();
						}
						this.isVisible = false;
						this.options.select.apply(this.el, [item]);
					} else if (this.selectedItem.is('.act-menu-hasChildren')) {
						this.loadItems(this.selectedItem.data('val'));
					} else if (this.selectedItem.is('.act-back')) {
						this.hideItem();
					}
				}
			},
			/**
			 * Hide all itens
			 */
			hideAllItens : function () {
				while (this.isVisible) {
					this.hideItem();
				}
			},
			/**
			 * Check if selectedItem has childs and load then
			 */
			openChildItens : function () {
				if (this.isVisible && this.selectedItem && !this.selectedItem.is('.act-back')) {
					var item = this.selectedItem.data('item');
					// If it has children
					if (this.getItemChildCount(item) > 0) {
						var itemId = this.getItemValue(item);
						this.loadItems(itemId);
					}
				}
			},
			/**
			 * Keyboard navigation in the list
			 * @param {Number} dir
			 */
			navigate : function (dir) {
				switch (dir) {
				case keys.DOWN:
					var childItens = this.visibleItem;
					if (!this.visibleItem) {
						this.loadItems(null);
					} else {
						if (this.isVisible) {
							this.focusNextItem(childItens);
						} else {
							this.isVisible = true;
							this.container.show();
						}
					}
					break;
				case keys.UP:
					if (this.isVisible) {
						this.focusPreviousItem(this.visibleItem);
					}
					break;
				case keys.LEFT:
					this.hideItem();
					break;
				case keys.RIGHT:
					this.openChildItens();
					break;
				}
			},
			/**
			 * Dispose resources
			 */
			dispose: function () {
					this.el.off('.autocompletetree').removeData('autocompletetree');
					this.container.remove();
					
					if (this.options.showPathTooltip){
						$("#" + this.prefix + "-act-pathTooltip").remove();
					}
			},
			/**
			 * Init
			 */
			initialize : function () {

				// Remove autocomplete attribute to prevent native suggestions:
				this.element.setAttribute('autocomplete', 'off');

				var that = this;
				this.el.on('keydown.autocompletetree', function (e) {
					that.onKeyPress(e);
				});
                this.el.on('keyup.autocompletetree', function (e) {
					that.onKeyUp(e);
				});
				
                $("body").on('click', function (e) {
                    that.onBodyClick(e);
                });

				this.debug('AutoComplete-Tree initialized');
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
