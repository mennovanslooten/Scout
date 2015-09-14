/* global jQuery */
'use strict';

var ScoutClient = {};

(function($) {

    ScoutClient.run = function(assert_type, selector, args) {
        var $elts = find(selector);

        if (ScoutClient.hasOwnProperty(assert_type)) {
            args.unshift($elts);
            return ScoutClient[assert_type].apply(null, args);
        }

        return 'Assertion type unknown: <' + assert_type + '>';
    };


    function find(selector) {
        // Don't use jQuery for our special selector syntax: "text in quotes"
        var inside_quotes = /^"([^"]+)"$/;

        if (inside_quotes.test(selector)) {
            var text = selector.substr(1, selector.length - 2);
            var nodes = findNodesWithText(text);
            var result = $(nodes);
            result.selector = selector;
            return result;
        }

        // Otherwise use jQuery
        return $(selector);
    }


    function findNodesWithText(text, node, results) {
        node = node || document.body;
        results = results || [];

        if (node.nodeType !== node.ELEMENT_NODE) {
            return results;
        }

        if (node.textContent && node.textContent.trim() === text) {
            // Push new results to the front of the results to favor  deeper
            // nodes
            results.unshift(node);

            // TODO: find a way to make assertions try different nodes if
            // necessary
        }

        var child = node.firstChild;
        while (child) {
            findNodesWithText(text, child, results);
            child = child.nextSibling;
        }

        return results;

    }


    function isHidden($elt) {
        return $elt.is(':hidden');
    }


    function is0Px($elt) {
        return $elt.outerHeight() === 0 || $elt.outerWidth() === 0;
    }


    function isDisplayNone($elt) {
        return $elt.css('display') === 'none';
    }


    function isVisibilityHidden($elt) {
        return $elt.css('visibility') === 'hidden';
    }


    function isOpacity0($elt) {
        return parseFloat($elt.css('opacity')) === 0;
    }


    function isIntersection(a, b) {
        // Only if any of the following tests are true, there can not be an intersection
        // between the 2 rectangles
        var is_separate = a.right < b.left ||
                a.left > b.right ||
                a.top > b.bottom ||
                a.bottom < b.top;

        return !is_separate;
    }


    function isInViewport($elt) {
        var $win = $(window);
        var elt = $elt[0];
        var elt_rect = elt.getBoundingClientRect();
        var win_rect = {
            left: 0,
            right: $win.width(),
            top: 0,
            bottom: $win.height()
        };

        // The element is in the viewport if its rectangle intersects with the viewport rectangle
        return isIntersection(elt_rect, win_rect);
    }


    function getCoordinate($elt) {
        // Don't return coordinates for disabled inputs/buttons/etc -- they
        // can't be clicked
        if ($elt.is(':input') && $elt.prop('disabled')) {
            return null;
        }

        var offset = $elt.offset();
        var $doc = $(document);
        var scroll = {
            left: $doc.scrollLeft(),
            top: $doc.scrollTop()
        };

        // Calculate element dimensions relative to the viewport
        var left = offset.left - scroll.left;
        var top = offset.top - scroll.top;
        var right = left + $elt.outerWidth();
        var bottom = top + $elt.outerHeight();

        // If the elment is outside of the viewport,
        // document.elementFromPoint() returns null, so we return the top left
        // coordinate
        if (!isInViewport($elt)) {
            return offset;
        }

        var elt = $elt[0];

        // Check the element boundaries pixel by pixel until we find one that
        // belongs to the element.
        //
        // Yes, really. This is needed to check the element is not completely
        // covered by another, which would make it unclickable.
        for (var x = left; x <= right && x >= 0; x += 1) {
            for (var y = top; y <= bottom && y >= 0; y += 1) {
                var elt_at_point = document.elementFromPoint(x, y) || elt;
                while (elt_at_point) {
                    if (elt_at_point === elt) {
                        var result = {
                            left: x + scroll.left,
                            top: y + scroll.top
                        };
                        return result;
                    }
                    elt_at_point = elt_at_point.parentNode;
                }
            }
        }

        return null;
    }


    function getVisible($elts) {
        return $elts.filter(function() {
            var $elt = $(this);
            if (isHidden($elt) ||
                    isDisplayNone($elt) ||
                    isVisibilityHidden($elt) ||
                    isOpacity0($elt) ||
                    is0Px($elt)
                ) {
                return false;
            }

            return true;
        });
    }


    function getVisibleInViewport($elts) {
        return getVisible($elts).filter(function() {
            var $elt = $(this);
            return isInViewport($elt);
        });
    }


    // Get text content from first direct textNode child
    function getText($elts) {
        var text = '';
        $elts.each(function(index, elt) {
            for (var i = 0; i < elt.childNodes.length; i++) {
                var node = elt.childNodes[i];
                if (node.nodeType === 3) {
                    text = node.nodeValue;
                    return false;
                }
            }
        });

        return text.trim();
    }


    ScoutClient.assertText = function($elts, text) {
        var is_found = false;

        getVisible($elts).each(function(index, item) {
            var item_text = $(item).text().trim();
            item_text = item_text.replace(/\s+/g, ' ');

            if (item_text.indexOf(text) > -1) {
                is_found = true;
                return false;
            }
        });

        if (is_found) {
            return '';
        }

        return 'No elements matching <' + $elts.selector + '> found with text <' + text + '>';
    };


    ScoutClient.assertExists = function($elts) {
        if ($elts.length > 0) {
            return '';
        }
        return 'No elements matching <' + $elts.selector + '> found';
    };


    ScoutClient.clearFocused = function() {
        var $focused = $(document.activeElement);
        $focused.val('');
    };


    ScoutClient.assertIsA = function($elts, selector) {
        var error = ScoutClient.assertExists($elts);
        if (error) return error;

        if (!$elts.filter(selector).length) {
            return 'No elements matching <' + $elts.selector + '> and <' + selector + '> found';
        }

        return '';
    };


    ScoutClient.assertVisible = function($elts) {
        if (getVisible($elts).length > 0) {
            return '';
        }
        return 'No visible elements matching <' + $elts.selector + '> found';
    };


    ScoutClient.assertHidden = function($elts) {
        if (getVisible($elts).length === 0) {
            return '';
        }
        return 'Visible elements matching <' + $elts.selector + '> found';
    };


    ScoutClient.assertEmpty = function($elts) {
        var text = getText($elts);

        // If the element contains text, it's not empty
        if (text !== '') {
            return 'Element contains text <' + text + '>';
        }

        // Otherwise it should have no visible children
        return ScoutClient.assertLength($elts.children(), 0);
    };


    ScoutClient.assertNotEmpty = function($elts) {
        var text = getText($elts);

        // If the element contains text, it's not empty
        if (text !== '') {
            return '';
        }

        // Otherwise it should have at least 1 visible child
        return ScoutClient.assertMinLength($elts.children(), 1);
    };


    ScoutClient.assertLength = function($elts, num) {
        num = parseInt(num, 10);
        var actual = getVisible($elts).length;
        if (actual === num) {
            return '';
        }
        //return 'Number of visible elements does not match';
        return 'Expected <' + num + '> visible elements but actual number is <' + actual + '>';
    };


    ScoutClient.assertMinLength = function($elts, num) {
        num = parseInt(num, 10);
        var actual = getVisible($elts).length;
        if (actual >= num) {
            return '';
        }
        return 'Expected at least <' + num + '> visible elements but actual number is <' + actual + '>';
    };


    ScoutClient.assertMaxLength = function($elts, num) {
        num = parseInt(num, 10);
        var actual = getVisible($elts).length;
        if (actual <= num) {
            return '';
        }
        return 'Expected at most <' + num + '> visible elements but actual number is <' + actual + '>';
    };


    ScoutClient.assertValue = function($elts, value) {
        value = value.trim();
        var actual;
        // If the targeted element is a label, find the associated
        // input element
        if ($elts.is('label')) {
            var $target;
            if ($elts.attr('for')) {
                $target = $('#' + $elts.attr('for'));
            } else {
                $target = $elts.find(':input').first();
            }

            if ($target && $target.length) {
                actual = $target.val().trim();
            } else {
                return 'No input elements matching <' + $elts.selector + '> found';
            }
        } else {
            actual = $elts.val().trim();
        }
        if (actual === value) {
            return '';
        }
        return 'Expected <' + value + '> but actual value is <' + actual + '>';
    };


    ScoutClient.assertHasClass = function($elts, class_name) {
        if (class_name.indexOf('.') !== 0) {
            class_name = '.' + class_name;
        }

        if ($elts.filter(class_name).length > 0) {
            return '';
        }

        return 'No elements matching <' + $elts.selector + '> found with className <' + class_name + '>';
    };


    ScoutClient.assertNotHasClass = function($elts, class_name) {
        if (class_name.indexOf('.') !== 0) {
            class_name = '.' + class_name;
        }

        if ($elts.filter(class_name).length === 0) {
            return '';
        }
        return 'Elements with class name found';
    };


    ScoutClient.assertDisabled = function($elts) {
        if ($elts.filter(':disabled').length > 0) {
            return '';
        }
        return 'No disabled elements matching <' + $elts.selector + '> found';
    };


    ScoutClient.assertInViewport = function($elts) {
        var $result = getVisibleInViewport($elts);

        // No elements visible, so definitely not in viewport
        if (!$result.length) {
            return 'No elements matching <' + $elts.selector + '> visible in viewport';
        }

        return '';
    };


    ScoutClient.assertNotInViewport = function($elts) {
        var $result = getVisibleInViewport($elts);

        // No elements visible, so definitely not in viewport
        if (!$result.length) {
            return '';
        }
        return 'Elements matching <' + $elts.selector + '> visible in viewport';
    };


    // Find a pixel on the element that is not covered by other elements.
    // Needed to make sure we send click events, etc. to the right place
    ScoutClient.getCoordinate = function($elts) {
        var result = null;

        // Find the first visible matching element that is not completely
        // covered by other elements

        getVisible($elts).each(function() {
            var $elt = $(this);
            var coordinate = getCoordinate($elt);
            if (coordinate) {
                result = coordinate;
                return false;
            }
        });

        return result;
    };


    ScoutClient.getBoundaries = function($elts) {
        var $result = getVisible($elts).first();
        if (!$result.length) return;

        var offset = $result.offset();
        return {
            left: offset.left,
            top:  offset.top,
            width: $result.outerWidth(true),
            height: $result.outerHeight(true),
            bottom: offset.top + $result.outerHeight(true)
        };
    };


    ScoutClient.choose = function($elts) {
        var $select = getVisible($elts).first();
        if (!$select.length) return 'Element is not visible';

        var args = [].slice.call(arguments, 0);
        var values = [];
        $.each(args, function(index, arg) {
            var $option = $select.find('option').filter(function() {
                var result = $(this).text() === arg;
                return result;
            });

            var option_value = $option.attr('value');
            if ($option.length && option_value) {
                values.push(option_value);
            } else {
                values.push(arg);
            }
        });

        $select.val(values);
        return '';
    };


    ScoutClient.getValueOrText = function($elts) {
        var $elt = getVisible($elts).first();
        if ($elt.is(':input') || $elt.is('select')) {
            return $elt.val();
        }

        return $elt.text();
    };

})(jQuery);
