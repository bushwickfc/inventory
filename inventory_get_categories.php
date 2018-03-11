<?php
// Prints a list of all the categories.
// This is used for the inventory database.
// @author vera

include 'shared.php';
include 'aux_funcs.php';

function process_all_categories($con) {
    $res = mysqli_query($con, 'SELECT id, name FROM CATEGORIES ORDER BY name');
    $categories = array();
    while ($row = mysqli_fetch_array($res)) {
        $category = array();
        # These aren't real categories; I wasn't sure it was OK to just delete 
        # them from the DB, hence the following hack: (Tal)
        if ($row['name'] == 'Fees' || $row['name'] == 'ZZZDiscontinued') {
            continue;
        }
        
        $name = $row['name'];
        // Remove the '00' from the produce category names.
        if (substr($name, 0, 1) == '00') {
            $name = substr($name, 2);
        }

        $category['id'] = $row['id'];
        $category['name'] = $name;
        $categories[] = $category;
    }

    print json_encode($categories);
}

$con = connect($hostname, $username, $password, $database);
process_all_categories($con);
mysqli_close($con);
?>