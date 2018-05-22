// The general structure is a list of categories on the left and a list of products on the right.
// We load all products when the page is loaded and add them to a hidden container ('allitems').
// When a category is selected or the user searches, we add the matching rows to the visible container
// ('items'). This allows us to keep the alternating background colors functioning.

function sort(a, b) {
  var attrA = a.getAttribute('name');
  var attrB = b.getAttribute('name');

  return (attrA < attrB) ? -1 : (attrA > attrB) ? 1 : 0;
}

// When adjusting prices (such as converting spice units from pounds to ounces)
// convert a currency string - '$18.12' - to a number - 18.12 - so we can operate on it.
function convertCurrencyStringToNumber(currencyString) {
  return Number(currencyString.replace(/[^0-9\.]+/g, ''));
}

// Convert a price to reflect a different unit of measure.
function convertPriceUnit(currencyString, denominator) {
  var convertedPrice = convertCurrencyStringToNumber(currencyString) / denominator;
  // Ultimately, we want to put our price back into a currency string -
  // .toFixed(2) will both round to the nearest cent and convert the number to a string,
  // so just add the '$' and it's business as usual.
  return '$' + convertedPrice.toFixed(2);
}

// Passively update the query param value in the url
function updateUrlQueryParam(queryParamValue) {
  window.history.pushState({}, '', 'inventory.html?cat=' + encodeURIComponent(queryParamValue).toLowerCase());
}

// Find the category-item DOM element that corresponds to the current cat query param
function getQueryParamCat(queryParam) {
  return $('.category-item[data-query_name=' + '\'' + queryParam + '\'' + ']');
}

// Called when the user clicks on a category.
function categoryClick(categoryRow) {
  // Update the query param to match current selection
  updateUrlQueryParam(categoryRow[0].dataset.query_name);

  // Reset the search field
  $('#searchfield')[0].value = '';

  // Highlight none but the selected category.
  $('category').removeClass('selected');
  categoryRow.addClass('selected');

  // Sort all rows but the headline and move them to the hidden 'allitems' container.
  var items = $('itemrow').not('.headline').sort(sort);
  $.each(items, function(idx, itm) { $('allitems').append(itm); });

  // Move all matching rows into the visible 'items' container.
  $('[category_id = ' + categoryRow.attr('id') + ']').appendTo('items');

  // Update the headline with the selected category.
  $('itemrow.headline').find('itemname').html(categoryRow.text());
}

// Called when the user types into the search field.
// Gets reset when the user clicks on a category.
function search(input) {
  var items = $('itemrow').not('.headline').sort(sort);
  var queryParam = getParameterByName();
  var queryParamCat = getQueryParamCat(queryParam);
  input = input.toUpperCase();

  // If the input is cleared, restore the list based on the query param (if there is one).
  // At the moment, we'd always expect there to be a query param, since there's always a category
  // selected. Keeping the ternary in case that should change, or for unforeseen circumstances.
  if (input === '') {
    return queryParam ? categoryClick($(queryParamCat)) : categoryClick($('category').first());
  }

  // Sort all rows but the headline and move them to the hidden 'allitems' container.
  $.each(items, function(idx, itm) { $('allitems').append(itm); });

  // Remove any highlight from the category list.
  $('category').removeClass('selected');

  // Loop over all products and move the matching ones to the visible 'items' container.
  $('itemrow').not('.headline').each(function() {
    var productName = $(this).find('itemname').text().toUpperCase();

    if (productName.toUpperCase().indexOf(input) > -1) {
      $(this).appendTo('items');
    }
  });

  // Update the headline with the current search term.
  $('itemrow.headline').find('itemname').html('Search for ' + input);
}

// Called when the DOM is ready. Loads all food items from the database.
function loadFoodItems(queryParam) {
  // The following three variables are used to convert the names and prices of
  // teas and spices so that they'll be listed by ounce instead of pound.
  var spiceRegex = /^Spices,(.)+\(BY POUND\)$/;
  var teaRegex = /^Tea,(.)+\(BY POUND\)$/;
  var poundToOunceDenominator = 16;

  $.post('./inventory_get_all_items.php', {}, function(data) {
    var foods = $.parseJSON(data);

    $('items').empty();
    // Create the headline row.
    $('itemheader itemrow').clone().appendTo($('items')).addClass('headline');

    // Loop over the food items and add one row per item.
    $.each(foods, function(i) {
      // Add one row per item to the hidden 'allitems' container.
      var o = $('itemheader itemrow').clone().appendTo($('allitems'));

      // Set the category id as an attribute.
      o.attr('category_id', foods[i].category_id);

      // Format the name and info. We reformat some all uppercase parts and replace acronyms with their full words.
      var name = foods[i]["name"];
      var subInfo = '';
      // Prices may change, if the item is a particular spice or tea
      var memberPrice = foods[i].member_price;
      var nonMemberPrice = foods[i].nonmember_price;

      o.attr('name', name.toUpperCase());

      if (foods[i].name.indexOf('/') > -1) {
        name = foods[i].name.substr(0, foods[i].name.indexOf('/'));
        subInfo = foods[i].name.substr(foods[i].name.indexOf('/') + 1);
      }

      // Spices and teas should be priced by ounces, rather than pounds.
      // First, we'll use these regexes to check if the prices need to be adjusted -
      // all will begin with either 'Spices,' or 'Tea,' and will include '(BY_POUND) '.
      // Note the trailing space following '(BY_POUND) ' - at the moment, all of the names
      // that include a weight designation have that trailing space... hence the use of .trim().
      // Other categories, such as 'Produce (by Pound)' should also be lowercased.
      // @author darren
      if (name.indexOf('BY POUND') > -1 && (spiceRegex).test(name.trim()) || (teaRegex).test(name.trim())) {
        name = name.replace('BY POUND', 'by ounce');
        memberPrice = convertPriceUnit(foods[i].member_price, poundToOunceDenominator);
        nonMemberPrice = convertPriceUnit(foods[i].nonmember_price, poundToOunceDenominator);
      } else if (name.indexOf('BY POUND') > -1) {
        name = name.replace('BY POUND', 'by pound');
      }

      if (name.indexOf('BY WEIGHT') > -1) {
        name = name.replace('BY WEIGHT', 'by weight');
      }

      if (name.indexOf('GALLON') > -1) {
        name = name.replace('GALLON', 'gallon');
      }

      if (name.indexOf('BY EACH') > -1) {
        name = name.replace('BY EACH', 'by each');
      }

      if (name.indexOf('BY FLUID OZ') > -1) {
        name = name.replace('BY FLUID OZ', 'by fluid oz');
      } else if (name.indexOf('BY FL OZ') > -1) {
        name = name.replace('BY FL OZ', 'by fluid oz');
      } else if (name.indexOf('FL OZ') > -1) {
        name = name.replace('FL OZ', 'fluid oz');
      }

      if (subInfo.indexOf('ORG') > -1) {
        subInfo = subInfo.replace('ORG', 'organic');
      }

      if (subInfo.indexOf('GF') > -1) {
        subInfo = subInfo.replace('GF', 'gluten free');
      }

      if (subInfo.indexOf('RA') > -1) {
        subInfo = subInfo.replace('RA', '<a target=\'_blank\' href=\'http://regionalaccess.net/\'>Regional Access</a>');
      } 
      if (subInfo.indexOf('LFFC') > -1) {
        subInfo = subInfo.replace('LFFC', '<a target=\'_blank\' href=\'https://www.lancasterfarmfresh.com\'>Lancaster Farm Fresh Coop</a>');
      } 
      if (subInfo.indexOf('MYVT') > -1) {
        subInfo = subInfo.replace('MYVT', '<a target=\'_blank\' href=\'http://www.myersproduce.com\'>Myers Produce</a>');
      }
       if (subInfo.indexOf('FLNY') > -1) {
        subInfo = subInfo.replace('FLNY', '<a target=\'_blank\' href=\'http://www.ilovenyfarms.com/\'>Fingerlakes Farms</a>');
      }
       if (subInfo.indexOf('HVNY') > -1) {
        subInfo = subInfo.replace('HVNY', '<a target=\'_blank\' href=\'https://hv-harvest.com/\'>Hudson Valley Harvest New York</a>');
      }
       if (subInfo.indexOf('Stryker Farm') > -1) {
        subInfo = subInfo.replace('Stryker Farm', '<a target=\'_blank\' href=\'https://www.strykerfarm.com\'>Stryker Farm</a>');
      }
       if (subInfo.indexOf('Sunbeam') > -1) {
        subInfo = subInfo.replace('Sunbeam', '<a target=\'_blank\' href=\'https://sunbeamcandles.com\'>Sunbeam</a>');
      }
       if (subInfo.indexOf('Frontier') > -1) {
        subInfo = subInfo.replace('Frontier', '<a target=\'_blank\' href=\'https://www.frontiercoop.com\'>Frontier</a>');
      }
       if (subInfo.indexOf('Equal Exchange') > -1) {
        subInfo = subInfo.replace('Equal Exchange', '<a target=\'_blank\' href=\'http://equalexchange.coop\'>Equal Exchange</a>');
      }
       if (subInfo.indexOf('Bread Alone') > -1) {
        subInfo = subInfo.replace('Bread Alone', '<a target=\'_blank\' href=\'https://www.breadalone.com\'>Bread Alone</a>');
      }
      if (subInfo.indexOf('Inti') > -1) {
        subInfo = subInfo.replace('Inti', '<a target=\'_blank\' href=\'http://www.theintigroup.com\'>Inti</a>');
      }
      if (subInfo.indexOf('Hot Bread Kitchen') > -1) {
        subInfo = subInfo.replace('Hot Bread Kitchen', '<a target=\'_blank\' href=\'https://hotbreadkitchen.org\'>Hot Bread Kitchen</a>');
      }
      if (subInfo.indexOf('IPM') > -1) {
        subInfo = subInfo.replace('IPM', 'Integrated Pest Management');
      } 
      if (subInfo.indexOf('UNFI') > -1) {
        subInfo = subInfo.replace('UNFI', '<a target=\'_blank\' href=\'https://www.unfi.com/\'>United Natural Foods</a>');
      }
      if (subInfo.indexOf('WFN') > -1) {
        subInfo = subInfo.replace('WFN', '<a target=\'_blank\' href=\'https://wildernessfamilynaturals.com\'>Wildly Organic</a>');
      }
      if (subInfo.indexOf('STBL') > -1) {
        subInfo = subInfo.replace('STBL', 'sustainable');
      }
      if (subInfo.indexOf('ECO') > -1) {
        subInfo = subInfo.replace('ECO', 'eco grown');
      }
      if (subInfo.indexOf('GAP') > -1) {
        subInfo = subInfo.replace('GAP', 'gap certified');
      }if (subInfo.indexOf('IPM') > -1) {
        subInfo = subInfo.replace('IPM', 'integrated pest management');
      }
      if (subInfo.indexOf('BIO') > -1) {
        subInfo = subInfo.replace('BIO', 'bio dynamic');
      }
      if (subInfo.indexOf('FTNY') > -1) {
        subInfo = subInfo.replace('FTNY', 'Farms to Table NY');
      }
      if (subInfo.indexOf('FT') > -1) {
        subInfo = subInfo.replace('FT', 'fair trade');
      }

      // Set the subinfo and prices.
      o.find('itemname').html(name + '<subinfo>' + subInfo + '<subinfo>');
      o.find('itemprice.p1').html(memberPrice);
      o.find('itemprice.p2').html(nonMemberPrice);
    });

    // Check if there's a .category-item with query_name data that matches the query param...
    var queryParamCat = getQueryParamCat(queryParam);

    // If queryParamCat corresponds to an actual DOM element, 'click' it.
    // If there is no match (like a param typo), or the user has not provided a param, just 'click' the first
    // @author darren
    if (queryParamCat[0]) {
      // Select the category that reflects the query param
      categoryClick(queryParamCat);
    } else {
      // Select the first category as a default on load.
      categoryClick($('category').first());
    }
  });
}

// Called when the DOM is ready. Loads all categories from the database.
function loadCategories(queryParam) {
  $.post('./inventory_get_categories.php', {}, function(data) {
    var categories = $.parseJSON(data);
    $.each(categories, function(i, value) {
      var cat = $('<category>').appendTo($('left')).html(value.name);
      cat.attr('id', value.id);
      cat.attr('class', 'category-item');
      cat.attr('data-query_name', value.name.toLowerCase());
      cat.mousedown(function () {
        categoryClick($(this));
      });
    });

    loadFoodItems(queryParam);
  });
}

// get the value of the 'cat' query param to be passed to loadFoodItems()
// @author darren
function getParameterByName() {
  var url = window.location.href;
  var regex = new RegExp('[?]cat(=([^&#]*)|&|#|$)');
  var results = regex.exec(url);
  return !results || !results[2] ? null : decodeURIComponent(results[2].toLowerCase());
}

// add the event listener to the search input
$('#searchfield').keyup(function(event) {
  search(event.target.value);
});

$(document).ready(function() {
  var queryParam = getParameterByName('');

  // Load all the categories from the database and populate the
  // left sidebar with the returned data.
  // queryParam won't be used by loadCategories(), but will be passed on to loadFoodItems()
  loadCategories(queryParam);  
});
