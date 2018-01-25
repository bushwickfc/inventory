<?php

// Prints a list of products and their prices for the given category.
// Used for the inventory website.
// @author vera

include 'shared.php';
include 'aux_funcs.php';

$money_format_str = '%(n';
$member_markup = 1.3;
$nonmember_markup = 1.85;

function get_all_items($con) {
    global $money_format_str, $member_markup, $nonmember_markup;

    // The array in which we collect all the items.
	$items = array();

    // Get all the products that are not a fee or discontinued.
	$res = mysqli_query($con, "SELECT PRODUCTS.name, PRODUCTS.pricebuy, PRODUCTS.category AS category_id  "
		. "FROM PRODUCTS INNER JOIN PRODUCTS_CAT ON PRODUCTS.id = PRODUCTS_CAT.product  "
		. "WHERE PRODUCTS.category <> '031' AND PRODUCTS.category <> '393d6fad-b9dd-4ff2-8a4b-489145514e4d' ");

    setlocale(LC_MONETARY, 'en_US');
    
	while ($row = mysqli_fetch_array($res)) {
		// Sort out items that don't have a name, no point in showing them.
		if ($row['name'] == "") {
			continue;
		}

        $member_price = money_format($money_format_str, $row["pricebuy"] * $member_markup);
		$nonmember_price = money_format($money_format_str, $row["pricebuy"] * $nonmember_markup);
        
        // Array representing one item of this category
		$item = array();
		$item['name'] = $row["name"];
		$item['member_price'] = $member_price;
		$item['nonmember_price'] = $nonmember_price; 
        $item['category_id'] = $row["category_id"];
		$items[] = $item;
	}

    // Print the result as json so the ajax query can use it as a return value.
    print json_encode($items);
}

$con = connect($hostname, $username, $password, $database);
get_all_items($con);

mysqli_close($con);
?>