// The general structure is a list of categories on the left and a list of products on the right.
// We load all products when the page is loaded and add them to a hidden container ("allitems").
// When a category is selected or the user searches, we add the matching rows to the visible container 
// ("items"). This allows us to keep the alternating background colors functioning. 

var sort = function(a, b) {
	var attrA = a.getAttribute('name'),
		attrB = b.getAttribute('name');

	return (attrA < attrB) ? -1 : (attrA > attrB) ? 1 : 0;
}

// Called when the user types into the search field. 
// Gets reset when the user clicks on a category.
function search() {
	input = $('#searchfield')[0].value.toUpperCase()

	if (input == "") {
		categoryclick($('category:first'))
		return
	}

	// Sort all rows but the headline and move them to the hidden "allitems" container.
	var items = $('itemrow').not('.headline').sort(sort)
	$.each(items, function(idx, itm) { $('allitems').append(itm); });

	// Remove any highlight from the category list.
	$('category').removeClass('selected')

	// Loop over all products and move the matching ones to the visible "items" container.
	$('itemrow').not('.headline').each(function( index ) {
		product_name = $(this).find('itemname').text().toUpperCase()
		if (product_name.toUpperCase().indexOf(input) > -1) {
			$(this).appendTo('items')
		} 
	})

	// Update the headline with the current search term.
	$('itemrow.headline').find('itemname').html("Search for " + input)
}

// Called when the user clicks on a category.
var categoryclick = function(categoryrow) {
	// Reset the search field
	$('#searchfield')[0].value = ""

	// Highlight none but the selected category.
	$('category').removeClass('selected')
	categoryrow.addClass('selected')

	// Sort all rows but the headline and move them to the hidden "allitems" container.
	var items = $('itemrow').not('.headline').sort(sort)
	$.each(items, function(idx, itm) { $('allitems').append(itm); });

	// Move all matching rows into the visible "items" container.
	$("[category_id = " + categoryrow.attr('id') + "]").appendTo('items')

	// Update the headline with the selected category.
	$('itemrow.headline').find('itemname').html(categoryrow.text())
}

// Called when the DOM is ready. Loads all food items from the database.
var loadfooditems = function() {
	$.post("../php/inventory_get_all_items.php", {
	},
	function(data, status) {
		$('items').empty()
		foods = $.parseJSON(data);
		
		// Create the headline row.
		category = $('itemheader itemrow').clone().appendTo($('items')).addClass('headline')

		// Loop over the food items and add one row per item.
		$.each(foods, function (i, value) {
			// Add one row per item to the hidden "allitems" container.
			o = $('itemheader itemrow').clone().appendTo($('allitems'))
			// Set the category id as an attribute.
			o.attr('category_id',  foods[i].category_id)

			// Format the name and info. We reformat some all uppercase parts and replace acronyms with their full words.
			name = foods[i].name
			o.attr('name', name.toUpperCase())

			subInfo = ""
			if (foods[i].name.indexOf("\/") > -1) {
				name = foods[i].name.substr(0, foods[i].name.indexOf("\/")); 
				subInfo = foods[i].name.substr(foods[i].name.indexOf("\/") + 1);
			}

			if (name.indexOf("BY WEIGHT") > -1) {
				name = name.replace("BY WEIGHT", "by weight")
			} 

			if (name.indexOf("BY EACH") > -1) {
				name = name.replace("BY EACH", "by each")
			}  

			if (name.indexOf("BY FLUID OZ") > -1) {
				name = name.replace("BY FLUID OZ", "by fluid oz")
			} else if(name.indexOf("BY FL OZ") > -1) {
				name = name.replace("BY FL OZ", "by fluid oz")
			}

			if (subInfo.indexOf("ORG") > -1) {
				subInfo = subInfo.replace("ORG", "organic")
			}

			if (subInfo.indexOf("GF") > -1) {
				subInfo = subInfo.replace("GF", "gluten free")
			}  

			if (subInfo.indexOf("RA") > -1) {
				subInfo = subInfo.replace("RA", "<a target=\"_blank\" href=\"http://regionalaccess.net/\">Regional Access</a>")
			} else if (subInfo.indexOf("LFFC") > -1) {
				subInfo = subInfo.replace("LFFC", "<a target=\"_blank\" href=\"https://www.lancasterfarmfresh.com\">Lancaster Farm Fresh Coop</a>")
			} else if (subInfo.indexOf("MYVT") > -1) {
				subInfo = subInfo.replace("MYVT", "<a target=\"_blank\" href=\"http://www.myersproduce.com\">Myers Produce</a>")
			} else if (subInfo.indexOf("FLNY") > -1) {
				subInfo = subInfo.replace("FLNY", "<a target=\"_blank\" href=\"http://www.ilovenyfarms.com/\">Fingerlakes Farms</a>")
			} else if (subInfo.indexOf("Stryker Farm") > -1) {
				subInfo = subInfo.replace("Stryker Farm", "<a target=\"_blank\" href=\"https://www.strykerfarm.com\">Stryker Farm</a>")
			} else if (subInfo.indexOf("Sunbeam") > -1) {
				subInfo = subInfo.replace("Sunbeam", "<a target=\"_blank\" href=\"https://sunbeamcandles.com\">Sunbeam</a>")
			} else if (subInfo.indexOf("Frontier") > -1) {
				subInfo = subInfo.replace("Frontier", "<a target=\"_blank\" href=\"https://www.frontiercoop.com\">Frontier</a>")
			} else if (subInfo.indexOf("Equal Exchange") > -1) {
				subInfo = subInfo.replace("Equal Exchange", "<a target=\"_blank\" href=\"http://equalexchange.coop\">Equal Exchange</a>")
			} else if (subInfo.indexOf("Bread Alone") > -1) {
				subInfo = subInfo.replace("Bread Alone", "<a target=\"_blank\" href=\"https://www.breadalone.com\">Bread Alone</a>")
			} else if (subInfo.indexOf("Inti") > -1) {
				subInfo = subInfo.replace("Inti", "<a target=\"_blank\" href=\"http://www.theintigroup.com\">Inti</a>")
			} else if (subInfo.indexOf("Hot Bread Kitchen") > -1) {
				subInfo = subInfo.replace("Hot Bread Kitchen", "<a target=\"_blank\" href=\"https://hotbreadkitchen.org\">Hot Bread Kitchen</a>")
			} else if (subInfo.indexOf("IPM") > -1) {
				subInfo = subInfo.replace("IPM", "Integrated Pest Management")
			} else if (subInfo.indexOf("UNFI") > -1) {
				subInfo = subInfo.replace("UNFI", "<a target=\"_blank\" href=\"https://www.unfi.com/\">United Natural Foods</a>")
			} else if (subInfo.indexOf("WFN") > -1) {
				subInfo = subInfo.replace("WFN", "<a target=\"_blank\" href=\"https://wildernessfamilynaturals.com\">Wildly Organic</a>")
			}	

			// Set the subinfo and prices.
			o.find('itemname').html(name + "<subinfo>" + subInfo + "<subinfo>")
			o.find('itemprice.p1').html(foods[i].member_price)
			o.find('itemprice.p2').html(foods[i].nonmember_price)
		})

		// Select the first category as a default on load.
		categoryclick($('category:first'))
	});

}

// Called when the DOM is ready. Loads all categories from the database.
var loadcategories = function() {
	$.post("../php/inventory_get_categories.php", {
	},
	function(data, status) {
		categories = $.parseJSON(data);
		$.each(categories, function (i, value) {
			cat = $('<category>').appendTo($('left')).html(value['name'])
			cat.attr('id',  value['id'])
			cat.mousedown(function() {
				categoryclick($(this))
			});
		});
	});
}

$(document).ready(function() {
	// Load all the categories from the database and populate the 
	// right sidebar with the returned data.
	loadcategories()

	// Load all the items from the database.
	loadfooditems()
})