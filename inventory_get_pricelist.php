<?php

// Prints a list of products and their prices for the given category.
// Used for the inventory website.
// @author vera

include 'shared.php';
include 'aux_funcs.php';

$money_format_str = '%(n';
$member_markup = 1.3;
$nonmember_markup = 1.85;

function process_category_pricelist($con, $categories) {
    global $money_format_str, $member_markup, $nonmember_markup;

    // The array in which we collect all the items.
	$pricelist = array();

	foreach ($categories as $cat) {
		// Get the name and the id for each category we're requesting.
		// NOTE: at the moment this is only one at a time.
        $q = "SELECT id, name FROM CATEGORIES where id='$cat'";
		$res = mysqli_query($con, $q);
		while ($row = mysqli_fetch_array($res)) {
			$category_name = $row["name"];
			// Remove the "00" from the produce category names.
        	if (substr($category_name, 0, 1) == "00") {
        		$category_name = substr($category_name, 2);
        	}

			$category_id = $row["id"];

            // Query all the products associated with the given category.
			$res = mysqli_query($con, "SELECT PRODUCTS.name, PRODUCTS.pricebuy "
				. "FROM PRODUCTS "
				. "INNER JOIN PRODUCTS_CAT ON PRODUCTS.id=PRODUCTS_CAT.product "
				. "WHERE PRODUCTS.category='$category_id' "
				. "ORDER BY PRODUCTS.name");

		    setlocale(LC_MONETARY, 'en_US');
            
            // Array for all the items in this category
		    $category_items = array();
			while ($row = mysqli_fetch_array($res)) {
		        $member_price = money_format($money_format_str, 
		            $row["pricebuy"] * $member_markup);

				$nonmember_price = money_format($money_format_str, 
		            $row["pricebuy"] * $nonmember_markup);
                
                // Array representing one item of this category
				$item = array();
				$item['name'] = $row["name"];
				$item['member_price'] = $member_price;
				$item['nonmember_price'] = $nonmember_price; 
				$category_items[] = $item;
			}

			$category = array();
			$category["category"] = $category_name;
			$category["items"] = $category_items;
			$pricelist[] = $category;
		}
	}

    // Print the result as json so the ajax query can use it as a return value.
    print json_encode($pricelist);
}

// Get the requested category id from the POST array, connect to the db and run the query.
if (is_array($_POST["category"])) {
	$categories = array();
	foreach ($_POST["category"] as $cat) {
        $categories[] = $cat;
	}
	$con = connect($hostname, $username, $password, $database);
	process_category_pricelist($con, $categories);
}

mysqli_close($con);
?>