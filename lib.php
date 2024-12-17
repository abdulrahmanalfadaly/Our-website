<?php
function get_site_url() {
    return BASE_URL;
}

function asset_url($path) {
    return ASSETS_PATH . '/' . $path;
}
?>
