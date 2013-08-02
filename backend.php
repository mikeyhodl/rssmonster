<?php

//include
include 'config.php';
include 'functions.php';

if(isset($_POST['sort'])){ $sort = htmlspecialchars($_POST['sort']); } else { $sort = NULL; }
if(isset($_POST['articlelist'])){ $articlelist = htmlspecialchars($_POST['articlelist']); } else { $articlelist = NULL; }

$array = get_json('{"jsonrpc": "2.0", "request": "get-articles", "sort": "' . $_POST['sort'] . '", "article_id": "' . $_POST['articlelist'] . '"}');

if (!empty($array) && $array != "no-results") {
    foreach ($array as $row) {

    echo "<div id=\"block\">";

		if (!empty($row)) {

			echo "<div class='article' id=$row[id]>";

			if ($row['star_ind'] == '1') {
				echo "<img class='item-star star' id=$row[id] src='images/star_selected.png'>";
			} else {
				echo "<img class='item-star unstar' id=$row[id] src='images/star_unselected.png'>";
			}

			echo "<h4 class='heading' id=$row[id]><a href=\"$row[url]\" target=\"_blank\">$row[subject]</a></h4>";
			
			if (!empty($row['author'])) {
				echo "<div class='feedname'>$row[feed_name] by $row[author] | $row[publish_date]</div>";
			} else {
				echo "<div class='feedname'>$row[feed_name] | $row[publish_date]</div>";
			}

			echo "<hr>";
			//show complete content block
			echo "<div class='page-content'>$row[content]</div>";
			//show less content block with no urls and only up to 250 characters
			echo "<div class='less-content'>";
			$lesscontent = strip_tags($row['content']);
			$lesscontent = preg_replace('/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i', '', $lesscontent);
			$lesscontent = substr($lesscontent, 0, 250);
			echo $lesscontent;
			echo "</div>";
			
			echo "</div>";
		}
	echo "</div>";
	}
}

?>
