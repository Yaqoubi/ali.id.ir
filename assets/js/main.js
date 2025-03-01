var KRAFT = KRAFT || {};

(function($) {

    // USE STRICT
    "use strict";


    KRAFT.header = {

        init: function() {

            KRAFT.header.menuItemTrigger();
            KRAFT.header.hamburgerTrigger();
            KRAFT.header.hamburgerMenuCloseTrigger();
            KRAFT.header.dropdownInvert();
            KRAFT.header.onePageScroll();
            KRAFT.header.customPageScroll();
            KRAFT.header.goToTop();
            KRAFT.header.initHeadsUp();

        },

        menuItemTrigger: function() {

            if (headerEl.hasClass('hamburger-side') || headerEl.hasClass('left-sidebar') || windowWidth < 991) {

                $('#top-menu').find('li.has-children > a').off('click');

                $('#top-menu').find('li.has-children > a').on('click', function(e) {

                    $(this).closest('li').siblings().find('ul.sub-menu').slideUp();
                    $(this).closest('li').siblings().removeClass('active');
                    $(this).closest('li').children('ul.sub-menu').slideToggle();
                    $(this).closest('li').toggleClass('active');

                    return false;
                });
            }

        },

        initHeadsUp: function() {

            if (headerEl.hasClass('sticky')) {

                setTimeout(() => {

                    headsup({
                        duration: 0.3,
                        easing: 'ease',
                        delay: 0
                    });

                }, 500);

            }

        },

        hamburgerTrigger: function() {

            if (hamburger_trigger.length > 0) {

                var page_overlay_capture = $('.page-click-capture');

                hamburger_menu_animation = new TimelineMax({
                    paused: true
                });

                hamburger_menu_animation.to(navigationEl, 0.8, {
                    ease: Expo.easeInOut,
                    right: "0%",
                    strictUnits: true,
                    onStart: function() {
                        page_overlay_capture.addClass('page-overlay');
                    },
                    onReverseComplete: function() {
                        page_overlay_capture.removeClass('page-overlay');
                    }
                });

                hamburger_menu_animation.reversed(true);

                hamburger_trigger.on('click', function() {

                    if (headerEl.hasClass('hamburger-side')) {

                        hamburger_menu_animation.restart();

                        page_overlay_capture.addClass('page-overlay');

                    } else {

                        navigationEl.toggleClass('display-menu');
                        $(this).toggleClass('open');
                    }

                    return false;

                });
            }
        },

        hamburgerMenuCloseTrigger: function() {

            if (hamburger_menu_close_trigger.length > 0) {

                var page_overlay_capture = $('.page-click-capture');

                hamburger_menu_close_trigger.on('click', function() {

                    page_overlay_capture.removeClass('page-overlay');

                    $('ul.sub-menu').slideUp();

                    hamburger_menu_animation.reverse();

                });

                $('.page-click-capture').on('click', function() {

                    navigationEl.removeClass('display-menu');
                    page_overlay_capture.removeClass('page-overlay');

                    $('ul.sub-menu').slideUp();

                    hamburger_menu_animation.reverse();

                });
            }
        },

        dropdownInvert: function() {

            if (!headerEl.hasClass('hamburger-side') && windowWidth > 991) {

                var standard_menu = $('#masthead.standard #top-menu');

                standard_menu.find('ul[class*=invert-dropdown]').removeClass('invert-dropdown');

                var subMenus = standard_menu.find('ul');

                subMenus.css('display', 'block');

                subMenus.each(function(index, element) {

                    var menuDropdown = $(element);
                    var windowWidth = $(window).width();

                    var dropdownOffset = menuDropdown.offset();
                    var dropdownWidth = menuDropdown.width();
                    var dropdownLeft = dropdownOffset.left;

                    if (windowWidth - (dropdownWidth + dropdownLeft) < 50) {
                        menuDropdown.addClass('invert-dropdown');
                    }

                });

                subMenus.css('display', '');

            }

        },

        onePageScroll: function() {


            $(navigationEl).find('ul').on('click', function(e) {

                if ($(e.target).is('a') && $(e.target).attr('href').indexOf('#') != -1) {

                    var element = $(navigationEl),
                        divAnchor = $(e.target).attr('href'),
                        divScrollToAnchor = divAnchor.substring(divAnchor.indexOf('#') + 1),
                        divScrollSpeed = element.attr('data-speed'),
                        divScrollEasing = element.attr('data-easing');

                    if (!divScrollSpeed) {
                        divScrollSpeed = 1250;
                    }
                    if (!divScrollEasing) {
                        divScrollEasing = 'easeInOutExpo';
                    }

                    if (divScrollToAnchor != '') {

                        element.find('li').removeClass('current');
                        element.find('a[href$="' + divScrollToAnchor + '"]').parent('li').addClass('current');

                        $('html,body').stop(true).animate({
                            'scrollTop': $('#' + divScrollToAnchor).offset().top
                        }, Number(divScrollSpeed), divScrollEasing);

                        if (windowWidth < 991) {

                            hamburger_trigger.toggleClass('open', false);
                            navigationEl.toggleClass('display-menu', false);

                        }
                    }

                    return false;

                }

            });

        },

        customPageScroll: function() {


            $('.custom-scroll, .custom-scroll a').on('click', function() {

                var divScrollToAnchor = $(this).attr('href'),
                    divScrollSpeed = $(this).attr('data-speed'),
                    divScrollEasing = $(this).attr('data-easing');

                if (!divScrollSpeed) {
                    divScrollSpeed = 1250;
                }
                if (!divScrollEasing) {
                    divScrollEasing = 'easeInOutExpo';
                }

                if ($(divScrollToAnchor).length > 0) {

                    $('html,body').stop(true).animate({
                        'scrollTop': $(divScrollToAnchor).offset().top
                    }, Number(divScrollSpeed), divScrollEasing);
                }

                return false;
            });

        },

        goToTop: function() {

            var elementScrollSpeed = goToTopBtn.attr('data-speed'),
                elementScrollEasing = goToTopBtn.attr('data-easing');

            if (!elementScrollSpeed) {
                elementScrollSpeed = 700;
            }
            if (!elementScrollEasing) {
                elementScrollEasing = 'easeOutQuad';
            }

            goToTopBtn.on('click', function() {
                $('body,html').stop(true).animate({
                    'scrollTop': 0
                }, Number(elementScrollSpeed), elementScrollEasing);
                return false;
            });
        },

        onePageCurrentSection: function() {

            var currentOnePageSection = '';
            var headerHeight = navigationEl.outerHeight();

            pageSection.each(function(index) {

                var h = $(this).offset().top;
                var y = $(window).scrollTop();
                var offsetScroll = headerHeight;

                if ($(this).attr('id') != undefined &&
                    y + offsetScroll >= h && y < h + $(this).height() &&
                    $(this).attr('id') != currentOnePageSection) {

                    currentOnePageSection = $(this).attr('id');
                }

            });

            return currentOnePageSection;
        },

        onepageScroller: function() {

            var currentOnePageSection = KRAFT.header.onePageCurrentSection();

            if (currentOnePageSection !== '') {

                navigationEl.find('li').removeClass('current');
                navigationEl.find('a[href$="#' + currentOnePageSection + '"]').parent('li').addClass('current');

            }

        },

    };

    KRAFT.slider = {

        init: function() {

            sliderContainer.each(function() {

                KRAFT.slider.initializeSlider(this);

            });

        },

        initializeSlider: function(sliderContainer) {

            var kraftSwiperArgs = $(sliderContainer);

            var kraftSwiper = new Swiper(sliderContainer, {

                // Optional parameters                                      
                init: false,

                autoHeight: true,

                slidesPerView: (kraftSwiperArgs.data('slides-per-view') == null) ? 1 : kraftSwiperArgs.data('slides-per-view'),
                spaceBetween: (kraftSwiperArgs.data('space-between') == null) ? 0 : kraftSwiperArgs.data('space-between'),
                centeredSlides: (kraftSwiperArgs.data('centered-slides') == null) ? false : kraftSwiperArgs.data('centered-slides'),
                freeMode: (kraftSwiperArgs.data('free-mode') == null) ? false : kraftSwiperArgs.data('free-mode'),
                grabCursor: (kraftSwiperArgs.data('grab-cursor') == null) ? false : kraftSwiperArgs.data('grab-cursor'),
                mousewheel: (kraftSwiperArgs.data('mouse-wheel') == null) ? false : kraftSwiperArgs.data('mouse-wheel'),
                loop: (kraftSwiperArgs.data('loop') == null) ? true : kraftSwiperArgs.data('loop'),
                effect: (kraftSwiperArgs.data('effect') == null) ? 'slide' : kraftSwiperArgs.data('effect'),

                autoplay: {
                    delay: (kraftSwiperArgs.data('autoplay-delay') == null) ? 5000 : kraftSwiperArgs.data('autoplay-delay'),
                    disableOnInteraction: (kraftSwiperArgs.data('disable-on-interaction') == null) ? true : kraftSwiperArgs.data('disable-on-interaction'),
                },

                // If we need pagination
                pagination: {
                    el: '.swiper-pagination',
                    type: (kraftSwiperArgs.data('pagination-type') == null) ? 'bullets' : kraftSwiperArgs.data('pagination-type'),
                    clickable: true,
                },

                // Navigation arrows
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },

                breakpointsInverse: true,

                // Responsive breakpoints
                breakpoints: {

                    // when window width is >= 0px
                    1024: {
                        slidesPerView: (kraftSwiperArgs.data('slides-per-view') == null) ? 1 : kraftSwiperArgs.data('slides-per-view'),
                        spaceBetween: (kraftSwiperArgs.data('space-between') == null) ? 0 : kraftSwiperArgs.data('space-between'),
                    },
                    // when window width is >= 480px
                    768: {
                        slidesPerView: (kraftSwiperArgs.data('tablet-slide-per-view') == null) ? 1 : kraftSwiperArgs.data('tablet-slide-per-view'),
                        spaceBetween: (kraftSwiperArgs.data('space-between') == null) ? 0 : kraftSwiperArgs.data('space-between'),
                    },
                    // when window width is >= 768px
                    640: {
                        slidesPerView: (kraftSwiperArgs.data('mobile-slide-per-view') == null) ? 1 : kraftSwiperArgs.data('mobile-slide-per-view'),
                        spaceBetween: (kraftSwiperArgs.data('space-between') == null) ? 0 : kraftSwiperArgs.data('space-between'),
                    },
                    // when window width is >= 960px
                    320: {
                        slidesPerView: (kraftSwiperArgs.data('mobile-slide-per-view') == null) ? 1 : kraftSwiperArgs.data('mobile-slide-per-view'),
                        spaceBetween: (kraftSwiperArgs.data('space-between') == null) ? 0 : kraftSwiperArgs.data('space-between'),
                    }
                },

            });

            kraftSwiper.on('init', function() {

                //kraftSwiper.lazy.loadInSlide( 1 );            

            });

            // init Swiper
            kraftSwiper.init();

        },

    };

    KRAFT.portfolio = {

        init: function() {

            portfolioContainers.each(function() {

                KRAFT.portfolio.initializePortfolio(this);

            });

            var portfolioContainerGrid = $('#portfolio-container-grid');

            if (portfolioContainerGrid.length && portfolioContainerGrid.data('displaytype') == 'scroll-fadeIn') {

                KRAFT.portfolio.portfolioItemDisplayTypeFadeIn(portfolioContainerGrid);

            }

            if (portfolioContainerGrid.length && portfolioContainerGrid.data('displaytype') == 'scroll-fadeInUp') {

                KRAFT.portfolio.portfolioItemDisplayTypeFadeInUp(portfolioContainerGrid);

            }

            if (portfolioContainerGrid.length && portfolioContainerGrid.data('captionanimation') == 'tilt') {

                KRAFT.portfolio.portfolioItemCaptionAnimateTilt(portfolioContainerGrid);
            }


            portfolioSliderContainers.each(function() {

                KRAFT.portfolio.initializePortfolioSlider(this);

            });

        },

        initializePortfolio: function(portfolioContainer) {

            var portfolioGrid = $(portfolioContainer);

            var cubeportfolio_options = {
                filters: '#filters-container,[id^=filters-container-subcategory]',
                layoutMode: (portfolioGrid.data('layoutmode') == null) ? 'grid' : portfolioGrid.data('layoutmode'),
                sortToPreventGaps: true,
                mediaQueries: [{
                    width: 1150,
                    cols: (portfolioGrid.data('large-desktop') == null) ? 4 : portfolioGrid.data('large-desktop')
                }, {
                    width: 800,
                    cols: (portfolioGrid.data('tablet-landscape') == null) ? 3 : portfolioGrid.data('tablet-landscape')
                }, {
                    width: 750,
                    cols: (portfolioGrid.data('tablet-portrait') == null) ? 2 : portfolioGrid.data('tablet-portrait')
                }, {
                    width: 700,
                    cols: (portfolioGrid.data('mobile') == null) ? 1 : portfolioGrid.data('mobile')
                }],
                defaultFilter: portfolioGrid.data('defaultfilter'),
                animationType: portfolioGrid.data('animationtype'),
                gapHorizontal: (portfolioGrid.data('gaphorizontal') == null) ? 0 : portfolioGrid.data('gaphorizontal'),
                gapVertical: (portfolioGrid.data('gapvertical') == null) ? 0 : portfolioGrid.data('gapvertical'),
                gridAdjustment: 'responsive',
                caption: (portfolioGrid.data('captionanimation') == null) ? 'fadeIn' : portfolioGrid.data('captionanimation'),
                displayType: (portfolioGrid.data('displaytype') == null) ? 'fadeIn' : portfolioGrid.data('displaytype'),
                displayTypeSpeed: 100,
                // lightbox
                lightboxDelegate: '.cbp-lightbox',
                lightboxGallery: true,
                lightboxTitleSrc: 'data-title',
                lightboxCounter: '<div class="cbp-popup-lightbox-counter">{{current}} از {{total}}</div>',
                plugins: {
                    loadMore: {
                        element: '#more-projects',
                        action: portfolioGrid.data('loadmoreaction'),
                        loadItems: portfolioGrid.data('loadnoofitems'),
                    }
                },
            };

            // Portfolio 
            portfolioGrid.cubeportfolio(cubeportfolio_options);

            portfolioGrid.on('lazyLoad.cbp', function(event, el) {

                var dataSrcSet = el.getAttribute('data-cbp-srcset');
                var dataSizes = el.getAttribute('data-sizes');

                if (dataSrcSet != null) {
                    el.srcset = dataSrcSet;
                    el.removeAttribute('data-cbp-srcset');
                }

                if (dataSizes != null) {
                    el.sizes = dataSizes;
                    el.removeAttribute('data-sizes');
                }

            });

            portfolioGrid.on('onAfterLoadMore.cbp', function() {

                if ($('.cbp-l-loadMore-link').hasClass('cbp-l-loadMore-stop')) {
                    $('.cbp-l-loadMore-noMoreLoading').html(portfolioGrid.data('button-text'));
                }

            });

        },


        initializePortfolioSlider: function(portfolioSliderContainer) {

            var portfolioSlider = $(portfolioSliderContainer);

            var cubeportfolio_options = {

                layoutMode: 'slider',
                drag: true,
                auto: true,
                autoTimeout: 5000,
                autoPauseOnHover: true,
                showNavigation: false,
                showPagination: true,
                rewindNav: false,
                scrollByPage: false,
                gridAdjustment: 'responsive',
                mediaQueries: [{
                    width: 960,
                    cols: 3,
                }, {
                    width: 768,
                    cols: 3,
                }, {
                    width: 480,
                    cols: 2,
                }, {
                    width: 0,
                    cols: 1,
                }],
                gapHorizontal: 30,
                gapVertical: 30,
                caption: '',
                displayType: 'default',
                displayTypeSpeed: 100,

                // lightbox
                lightboxDelegate: '.cbp-lightbox',
                lightboxGallery: true,
                lightboxTitleSrc: 'data-title',
                lightboxCounter: '<div class="cbp-popup-lightbox-counter">{{current}} از {{total}}</div>',

            };

            // Portfolio Slider
            portfolioSlider.cubeportfolio(cubeportfolio_options);

        },


        portfolioItemDisplayTypeFadeIn: function(portfolioContainer) {

            var portfolioItems = portfolioContainer.find('.cbp-item');

            var portfolioAnimationsController = new ScrollMagic.Controller();

            portfolioItems.each(function() {

                var portfolioItem = this;
                var fadein_tween;

                fadein_tween = TweenLite.from(portfolioItem, 0.5, {
                    ease: Sine.easeOut,
                    autoAlpha: 0,
                    clearProps: "visibility,opacity,transform",
                    onComplete: function() {
                        fadein_tween.kill();
                    }
                });

                new ScrollMagic.Scene({
                        triggerElement: portfolioItem,
                        triggerHook: "1",
                    }).setTween(fadein_tween)
                    .addTo(portfolioAnimationsController);
            });

        },

        portfolioItemDisplayTypeFadeInUp: function(portfolioContainer) {

            var portfolioItems = portfolioContainer.find('.cbp-item');

            var portfolioAnimationsController = new ScrollMagic.Controller();

            portfolioItems.each(function() {

                var portfolioItem = this;
                var fadein_tween;

                fadein_tween = TweenLite.from(portfolioItem, 0.5, {
                    ease: Sine.easeOut,
                    autoAlpha: 0,
                    y: 200,
                    clearProps: "visibility,opacity,transform",
                    onComplete: function() {
                        fadein_tween.kill();
                    }
                });

                new ScrollMagic.Scene({
                        triggerElement: portfolioItem,
                        triggerHook: "1",
                    }).setTween(fadein_tween)
                    .addTo(portfolioAnimationsController);
            });

        },

        portfolioItemCaptionAnimateTilt: function(portfolioContainer) {

            var portfolioItems = portfolioContainer.find('.cbp-item .cbp-caption-defaultWrap');

            portfolioItems.each(function() {

                $(this).tilt({
                    glare: true,
                    maxGlare: .3
                })

            });

        },

    };

    KRAFT.widget = {

        init: function() {

            KRAFT.widget.stickySidebar();

            KRAFT.widget.imageComparison();

            KRAFT.widget.initializeContactForm();

            KRAFT.widget.initializeMultiScroll();

            if (typeof(google) !== 'undefined') {

                googleMap.each(function() {
                    KRAFT.widget.initializeMap(this);
                });
            }

        },

        stickySidebar: function() {

            if ($('.single-portfolio .right-sidebar').length) {

                var top_offset = 65;

                $('.single-portfolio .right-sidebar .entry-header').stick_in_parent({
                    offset_top: top_offset
                });
            }

            if ($('.single-portfolio .left-sidebar').length) {

                var top_offset = 65;

                $('.single-portfolio .left-sidebar .entry-header').stick_in_parent({
                    offset_top: top_offset
                });
            }

        },

        imageComparison: function() {

            imageComparisonEl.each(function() {
                new Cocoen(this);
            });

        },


        initializeMap: function(google_map) {

            var latitude = $(google_map).data('latitude');
            var longitude = $(google_map).data('longitude');
            var zoom = $(google_map).data('zoom');
            var map_marker_img = $(google_map).data('mapmarker');

            var map_style = '[{"featureType":"administrative","elementType":"all","stylers":[{"saturation":"-100"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","elementType":"all","stylers":[{"saturation":-100},{"lightness":"50"},{"visibility":"simplified"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":"-100"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"all","stylers":[{"lightness":"30"}]},{"featureType":"road.local","elementType":"all","stylers":[{"lightness":"40"}]},{"featureType":"transit","elementType":"all","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]},{"featureType":"water","elementType":"labels","stylers":[{"lightness":-25},{"saturation":-100}]}]';

            var map_options = {
                center: new google.maps.LatLng(latitude, longitude),
                zoom: zoom,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                scrollwheel: false,
                mapTypeControl: false,
                panControl: false,
                scaleControl: false,
                streetViewControl: false,
                zoomControl: false
            };

            var map = new google.maps.Map(google_map, map_options);

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(latitude, longitude),
                map: map,
                icon: map_marker_img
            });

            map.setOptions({
                styles: JSON.parse(map_style.toString())
            });

        },

        initializeContactForm: function() {

            var contactForm = $('#contact-form');

            contactForm.on('submit', function(event) {

                var action_url = contactForm.attr('action');
                var form_process = contactForm.find('.form-process');

                var name_error = contactForm.find('.kraftcf-form-control-wrap.name span.kraftcf-not-valid-tip');
                var email_error = contactForm.find('.kraftcf-form-control-wrap.email span.kraftcf-not-valid-tip');
                var message_error = contactForm.find('.kraftcf-form-control-wrap.message span.kraftcf-not-valid-tip');

                var contact_success = contactForm.find('.kraftcf-response-output.kraftcf-mail-sent-ok');
                var contact_failed = contactForm.find('.kraftcf-response-output.kraftcf-validation-errors');

                form_process.fadeIn();

                name_error.removeClass('validation-error');
                email_error.removeClass('validation-error');
                message_error.removeClass('validation-error');

                contact_failed.removeClass('validation-error');
                contact_success.removeClass('validated');

                // get the form data            
                var formData = {
                    'name': contactForm.find('input[name=name]').val(),
                    'email': contactForm.find('input[name=email]').val(),
                    'subject': contactForm.find('input[name=subject]').val(),
                    'message': contactForm.find('textarea[name=message]').val()
                };

                // process the form
                $.ajax({
                        type: 'POST',
                        url: action_url,
                        data: formData,
                        dataType: 'json',
                        encode: true
                    })

                    // using the done promise callback
                    .done(function(data) {
                        console.log(data);

                        // here we will handle errors and validation messages
                        if (!data.success) {

                            // handle errors for name
                            if (data.errors.name) {
                                name_error.toggleClass('validation-error');
                            }

                            // handle errors for email
                            if (data.errors.email) {
                                email_error.toggleClass('validation-error');
                            }

                            // handle errors for message
                            if (data.errors.message) {
                                message_error.toggleClass('validation-error');
                            }

                            // mail
                            if (data.errors.mail_error) {
                                contact_failed.toggleClass('validation-error');
                            }
                        } else {
                            contact_success.toggleClass('validated');
                        }

                        form_process.fadeOut();

                    })
                    .fail(function(data) {
                        console.log(data);


                        form_process.fadeOut();
                        contact_failed.toggleClass('validation-error');

                    });

                event.preventDefault();

            });

        },

        initializeMultiScroll: function() {

            var portfolio_split_slider = $('#portfolio-split-slider');

            if (portfolio_split_slider.length > 0) {

                portfolio_split_slider.multiscroll({

                    scrollingSpeed: 700,
                    easing: "easeInOutQuart",
                    navigation: true,
                    useAnchorsOnLoad: false,

                    // Custom selectors
                    sectionSelector: '.kraft-ms-section',
                    leftSelector: '.kraft-ms-left',
                    rightSelector: '.kraft-ms-right',

                });
            }

        },

    };

    KRAFT.documentOnResize = {

        init: function() {

            windowWidth = $(window).width();

            KRAFT.header.menuItemTrigger();
            KRAFT.header.initHeadsUp();
            KRAFT.header.dropdownInvert();

        }

    };


    KRAFT.documentOnReady = {

        init: function() {

            KRAFT.header.init();

            KRAFT.slider.init();

            KRAFT.widget.init();

            KRAFT.documentOnReady.windowscroll();

        },

        windowscroll: function() {

            $(window).on('scroll', function() {

                if (headerEl.hasClass('sticky')) {
                    KRAFT.header.onepageScroller();
                }

                if ($(window).scrollTop() > 0) {
                    goToTopBtn.addClass('active');
                } else {
                    goToTopBtn.removeClass('active');
                }

            });
        }

    };

    KRAFT.documentOnLoad = {

        init: function() {

            KRAFT.portfolio.init();
        },
    };


    var headerEl = $('#masthead.site-header');
    var navigationEl = $('#site-navigation');
    var hamburger_trigger = $('#ham-trigger-wrap');
    var hamburger_menu_close_trigger = $('#hamburger-menu-close-trigger');
    var pageSection = $('.vc_row');
    var goToTopBtn = $('#gotoTop');
    var sliderContainer = $('.swiper-container');
    var portfolioContainers = $('[id^=portfolio-container]');
    var portfolioSliderContainers = $('[id^=portfolio-slider-container]');
    var imageComparisonEl = $('.cocoen.image-comparison');
    var windowWidth = $(window).width();
    var googleMap = $('[id^=googleMap]');
    var hamburger_menu_animation;


    $(document).ready(KRAFT.documentOnReady.init);
    $(window).load(KRAFT.documentOnLoad.init);
    $(window).on('resize', KRAFT.documentOnResize.init);


})(jQuery);