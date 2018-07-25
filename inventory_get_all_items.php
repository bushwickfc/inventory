<?php
// Prints a list of products and their prices for the given category.
// Used for the inventory website.
// @author vera

include 'shared.php';
include 'aux_funcs.php';

$money_format_str = '%(n';

function get_all_items($con) {
    global $money_format_str, $member_markup, $nonmember_markup;

    $markups = array();
    $exempt_markups = array();
    $tax_markups = array();

    $markup = mysqli_query($con, "SELECT TAXES.id, TAXES.rate, TAXES.category "
    	. 'FROM TAXES WHERE '
    	. 'id = "bb155c6d-407b-47fc-8352-b9451d2d7c00" OR id = "cda2df45-baba-4eb1-810b-be1df2babb91" '
    	. 'OR id = "1a7f3c7d-179a-4466-8e8a-51ea17ac3d4e" OR id = "3a861f72-1eed-46ad-a2af-12cc76c43a97" ');

    // We're adding 1 to each rate to calculate the full price incl. tax and markup.
    while ($row = mysqli_fetch_array($markup)) {
    	$id = $row['id'];
    	if ($id == 'bb155c6d-407b-47fc-8352-b9451d2d7c00') {
    		$tax_markups['owner'] = $row['rate'] + 1;
    	} else if ($id == 'cda2df45-baba-4eb1-810b-be1df2babb91') {
			$tax_markups['guest'] = $row['rate'] + 1;
    	} else if ($id == '1a7f3c7d-179a-4466-8e8a-51ea17ac3d4e') {
    		$exempt_markups['guest'] = $row['rate'] + 1;
    	} else if ($id == '3a861f72-1eed-46ad-a2af-12cc76c43a97') {
    		$exempt_markups['owner'] = $row['rate'] + 1;
    	}
    }

    $markups['000'] = $exempt_markups;
    $markups['001'] = $tax_markups;

    // The array in which we collect all the items.
    $items = array();

    // Get all the products that are not a fee or discontinued.
    $res = mysqli_query($con, "SELECT PRODUCTS.name, PRODUCTS.pricebuy, PRODUCTS.category AS category_id, PRODUCTS.taxcat  "
        . 'FROM PRODUCTS INNER JOIN PRODUCTS_CAT ON PRODUCTS.id = PRODUCTS_CAT.product  '
        . 'WHERE PRODUCTS.category <> "031" AND PRODUCTS.category <> "393d6fad-b9dd-4ff2-8a4b-489145514e4d" ORDER BY PRODUCTS.name');

    setlocale(LC_MONETARY, 'en_US');
    
    while ($row = mysqli_fetch_array($res)) {
        // Sort out items that don't have a name, no point in showing them.
        if ($row['name'] == '') {
            continue;
        }

        $price = $row['pricebuy'];
		$member_price = money_format($money_format_str, $price * $markups[$row['taxcat']]['owner']);
	    $nonmember_price = money_format($money_format_str, $price * $markups[$row['taxcat']]['guest']);
        
        // Array representing one item of this category
        $item = array();
        $item['name'] = $row['name'];
        $item['member_price'] = $member_price;
        $item['nonmember_price'] = $nonmember_price; 
        $item['category_id'] = $row['category_id'];
        $items[] = $item;
    }

    // Print the result as json so the ajax query can use it as a return value.
    print json_encode($items);
}

$con = connect($hostname, $username, $password, $database);
get_all_items($con);

mysqli_close($con);
?>