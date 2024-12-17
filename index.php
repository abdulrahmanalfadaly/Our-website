<?php
// Include the configuration and library files
require_once('config.php');
require_once('lib.php');

// Set the page title
$pagetitle = "Taleem";
?>
<!doctype html>
<html class="no-js" lang="zxx">
<head>
    <?php include('templates/head.php'); ?>
</head>
<body>
    <?php include('templates/home/pre-loader.php'); ?>
    <?php include('templates/home/back-to-top.php'); ?>
    <?php include('templates/home/search.php'); ?>
    <?php include('templates/header.php'); ?>
    <?php include('templates/home/offcanvas.php'); ?>

    <main>
        <?php include('templates/home/hero.php'); ?>
        <?php include('templates/home/service.php'); ?> 
        <?php include('templates/home/filter-program.php'); ?>
        <?php include('templates/home/about.php'); ?>
        <?php include('templates/home/counter.php'); ?>
        <?php include('templates/home/event.php'); ?>
        <?php include('templates/home/testimonial.php'); ?>
        <?php include('templates/home/blog.php'); ?>
        <?php include('templates/home/instagram.php'); ?>
        <?php include('templates/home/cta.php'); ?>
    </main>

    <?php include('templates/footer.php'); ?>
   <!-- JS here -->
   <?php include('templates/js.php'); ?>

</body>
</html>
