$(function(){
    // ساختار اصلی
    const $wrapper  = $('#wrapper');
    const $post     = $('#PostBox');
    const $gridC    = $('#ImageBox');
    // استایل داینامیک PostBox
    $post.css({
        width:           '1080px',
        height:          '1080px',
        backgroundColor: 'gray',
        transformOrigin: 'top left'
    });
    $gridC.css({
        position:       'absolute',
        width:          '1080px',
        height:         '1080px',
        top:            '0px',
        left:           '0px'
    });
    // تابع اسکِیل
    function scalePostBox() {
        const wrapperWidth = $wrapper.width();
        const postWidth = $post.width();
        const postHeight = $post.height();
        // Calculate scale factor based on width (to fit horizontally)
        const scaleFactor = wrapperWidth / postWidth;
        // Apply the scaling
        $post.css('transform', `scale(${scaleFactor})`);
        // Set wrapper height to scaled height of the post
        $wrapper.height(postHeight * scaleFactor);
    }
    $(window).on('load resize', scalePostBox);
    // دانلود
    $('#downloadBtn').on('click', ()=>{
        $post.css('transform','scale(1)');
        html2canvas($post[0], {
            scale: 1
        }).then(canvas=>{
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url; a.download = 'postbox.png'; a.click();
            scalePostBox();
        });
    });








    const maxPhotos = 4;
    let photoCount = 0;
    let photoFiles = [];
    let imageData = []; // Will store our image data for the grid

    // Handle file selection
    $('#photo-upload').on('change', function(e) {
        const files = e.target.files;

        if (files.length > 0) {
            // Check if adding these files would exceed the maximum
            if (photoCount + files.length > maxPhotos) {
                alert(`You can only upload a maximum of ${maxPhotos} photos. You already have ${photoCount}.`);
                return;
            }

            // Process each selected file
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();

                    reader.onload = function(e) {
                        const photoId = Date.now() + Math.floor(Math.random() * 1000);
                        const photoUrl = e.target.result;

                        photoFiles.push({
                            id: photoId,
                            file: file,
                            url: photoUrl
                        });

                        // Create thumbnail
                        const thumbnailHtml = `
                          <div class="col-md-3 col-sm-6 thumbnail-container" data-photo-id="${photoId}">
                            <img src="${photoUrl}" class="thumbnail" alt="Selected photo">
                            <div class="delete-btn">
                              <i class="bi bi-x"></i>
                            </div>
                          </div>
                        `;

                        $('#photo-previews').append(thumbnailHtml);
                        photoCount++;

                        // Disable the add button if max photos reached
                        if (photoCount >= maxPhotos) {
                            $('#add-photo-btn').addClass('disabled');
                        }

                        // Reset imageData completely when adding new photos
                        imageData = [];

                        // Update the image grid with new photos
                        updateImageGrid();
                    };

                    reader.readAsDataURL(file);
                }
            });
        }

        // Clear the input to allow selecting the same file again
        $(this).val('');
    });

    // Handle delete photo
    $(document).on('click', '.delete-btn', function() {
        const container = $(this).closest('.thumbnail-container');
        const photoId = Number(container.data('photo-id')); // Convert to number to ensure proper comparison

        // Remove from array
        photoFiles = photoFiles.filter(photo => photo.id !== photoId);

        // Remove from DOM
        container.remove();
        photoCount = photoFiles.length; // Recalculate based on actual array length

        // Re-enable the add button if below max photos
        if (photoCount < maxPhotos) {
            $('#add-photo-btn').removeClass('disabled');
        }

        // Always reset imageData on deletions to ensure proper rebuilding
        imageData = [];

        // Update the image grid with remaining photos
        updateImageGrid();
    });

    /**
     * Rearrange images in the grid based on new order
     * @param {Array} newOrder - Array of photo IDs in the desired order
     */
    function rearrangeImages(newOrder) {
        // Validate the input
        if (!Array.isArray(newOrder) || newOrder.length !== photoFiles.length) {
            console.error('Invalid new order array');
            return false;
        }

        // Check if all IDs in newOrder exist in photoFiles
        const allIdsExist = newOrder.every(id => photoFiles.some(photo => photo.id === id));
        if (!allIdsExist) {
            console.error('Some photo IDs in the new order do not exist');
            return false;
        }

        // Create a new sorted array based on the provided order
        const sortedPhotos = newOrder.map(id => {
            return photoFiles.find(photo => photo.id === id);
        });

        // Update the photoFiles array with the new order
        photoFiles = sortedPhotos;

        // Reset imageData to force rebuild with new order
        imageData = [];

        // Update the image grid with the new order
        updateImageGrid();

        // Also update the thumbnails order
        const $container = $('#photo-previews');

        // Rearrange thumbnails to match the new order
        newOrder.forEach(id => {
            const $thumb = $container.find(`.thumbnail-container[data-photo-id="${id}"]`);
            $container.append($thumb);
        });

        return true;
    }

    /**
     * Change the layout of images in the grid
     * @param {String} layoutType - The desired layout type ('default', 'split', 'featured', 'grid')
     */
    function changeImageLayout(layoutType) {
        if (photoFiles.length === 0) return false;

        // Reset imageData to start fresh
        imageData = [];

        switch (layoutType) {
            case 'default':
                // Use the default layout based on number of photos
                // imageData will be built in updateImageGrid()
                break;

            case 'split':
                // For 2 images: 50/50 split in one row
                // For 3-4 images: 50/50 top row, rest in bottom row
                if (photoFiles.length === 2) {
                    imageData = [[
                        {src: photoFiles[0].url},
                        {src: photoFiles[1].url}
                    ]];
                } else if (photoFiles.length === 3) {
                    imageData = [
                        [{src: photoFiles[0].url}, {src: photoFiles[1].url}],
                        [{src: photoFiles[2].url, colspan: 2}]
                    ];
                } else if (photoFiles.length === 4) {
                    imageData = [
                        [{src: photoFiles[0].url}, {src: photoFiles[1].url}],
                        [{src: photoFiles[2].url}, {src: photoFiles[3].url}]
                    ];
                } else if (photoFiles.length === 1) {
                    imageData = [[{src: photoFiles[0].url, colspan: 2}]];
                }
                break;

            case 'featured':
                // Feature the first image larger than others
                if (photoFiles.length === 2) {
                    imageData = [
                        [{src: photoFiles[0].url, colspan: 2}],
                        [{src: photoFiles[1].url, colspan: 2}]
                    ];
                } else if (photoFiles.length === 3) {
                    imageData = [
                        [{src: photoFiles[0].url, colspan: 2}],
                        [{src: photoFiles[1].url}, {src: photoFiles[2].url}]
                    ];
                } else if (photoFiles.length === 4) {
                    imageData = [
                        [{src: photoFiles[0].url, colspan: 2}],
                        [{src: photoFiles[1].url}, {src: photoFiles[2].url}, {src: photoFiles[3].url}]
                    ];
                } else if (photoFiles.length === 1) {
                    imageData = [[{src: photoFiles[0].url, colspan: 2}]];
                }
                break;

            case 'grid':
                // Even grid for all images
                if (photoFiles.length === 2) {
                    imageData = [[
                        {src: photoFiles[0].url},
                        {src: photoFiles[1].url}
                    ]];
                } else if (photoFiles.length === 3) {
                    // For 3 images: 1 on top, 2 on bottom
                    imageData = [
                        [{src: photoFiles[0].url, colspan: 2}],
                        [{src: photoFiles[1].url}, {src: photoFiles[2].url}]
                    ];
                } else if (photoFiles.length === 4) {
                    // For 4 images: 2x2 grid
                    imageData = [
                        [{src: photoFiles[0].url}, {src: photoFiles[1].url}],
                        [{src: photoFiles[2].url}, {src: photoFiles[3].url}]
                    ];
                } else if (photoFiles.length === 1) {
                    imageData = [[{src: photoFiles[0].url, colspan: 2}]];
                }
                break;

            case 'custom':
                // You can define custom layouts here
                break;

            default:
                console.error('Unknown layout type');
                return false;
        }

        updateImageGrid();
        return true;
    }

    /**
     * Move a specific image to a different position
     * @param {Number} photoId - ID of the photo to move
     * @param {Number} newPosition - New position index (0-based)
     */
    function moveImage(photoId, newPosition) {
        // Find the current position of the photo
        const currentIndex = photoFiles.findIndex(photo => photo.id === photoId);

        if (currentIndex === -1) {
            console.error('Photo ID not found');
            return false;
        }

        if (newPosition < 0 || newPosition >= photoFiles.length) {
            console.error('Invalid new position');
            return false;
        }

        // Create a new order array
        const newOrder = photoFiles.map(photo => photo.id);

        // Remove the item from its current position
        newOrder.splice(currentIndex, 1);

        // Insert the item at the new position
        newOrder.splice(newPosition, 0, photoId);

        // Call the rearrange function
        return rearrangeImages(newOrder);
    }

    /**
     * Make a specific image the featured (first) image
     * @param {Number} photoId - ID of the photo to feature
     */
    function setFeaturedImage(photoId) {
        // Find the current position of the photo
        const currentIndex = photoFiles.findIndex(photo => photo.id === photoId);

        if (currentIndex === -1) {
            console.error('Photo ID not found');
            return false;
        }

        // If already featured, no change needed
        if (currentIndex === 0) return true;

        // Move the image to the first position
        return moveImage(photoId, 0);
    }

    // Function to update the image grid based on selected photos
    function updateImageGrid() {
        // Reset the grid container
        const $gridC = $('#ImageBox');
        $gridC.empty();

        // Skip if no photos
        if (photoFiles.length === 0) return;

        // Create imageData structure based on selected photos if it's empty
        if (imageData.length === 0) {
            if (photoFiles.length === 1) {
                // One photo: full width, full height
                imageData = [[{src: photoFiles[0].url, colspan: 2}]];
            }
            else if (photoFiles.length === 2) {
                // Two photos: side by side in one row
                imageData = [[
                    {src: photoFiles[0].url},
                    {src: photoFiles[1].url}
                ]];
            }
            else if (photoFiles.length === 3) {
                // Three photos: first one full width, other two side by side
                imageData = [
                    [{src: photoFiles[0].url, colspan: 2}],
                    [{src: photoFiles[1].url}, {src: photoFiles[2].url}]
                ];
            }
            else if (photoFiles.length === 4) {
                // Four photos: 2x2 grid
                imageData = [
                    [{src: photoFiles[0].url}, {src: photoFiles[1].url}],
                    [{src: photoFiles[2].url}, {src: photoFiles[3].url}]
                ];
            }
        }

        // Log the current state for debugging
        console.log("photoFiles: ", photoFiles);
        console.log("imageData: ", imageData);

        // The rest of your grid building code
        let rows = imageData.length;
        let cols = 0;
        imageData[0].forEach(c => cols += (c.colspan || 1));
        const rowH = 100 / rows, unit = 12 / cols;

        const $grid = $('<div>')
            .addClass('container-fluid p-0')
            .css({ width: `100%`, height: `100%` })
            .appendTo($gridC);

        imageData.forEach(row => {
            const $r = $('<div>').addClass('row g-0').css('height', rowH + '%');
            row.forEach(cell => {
                const span = cell.colspan || 1;
                const cu = Math.round(unit * span);
                const $c = $('<div>')
                    .addClass(`col-${cu} p-0 position-relative overflow-hidden`)
                    .css('height', '100%');

                // عکس را position:absolute می‌کنیم؛ sizing بعد از لود
                const $img = $('<img alt="">').attr('src', cell.src)
                    .css({ position: 'absolute', cursor: 'grab' });

                $c.append($img);
                $r.append($c);
            });
            $grid.append($r);
        });

        // برای هر عکس: پس از لود، نسبت‌ها را چک کن و سایز و موقعیت بده
        $('#ImageBox img').each(function() {
            const imgEl = this;
            const cell = imgEl.parentElement;
            const $img = $(imgEl);

            // جلوگیری از درگ پیش‌فرض مرورگر
            imgEl.addEventListener('dragstart', e => e.preventDefault());

            function adjust() {
                const cw = cell.clientWidth,
                    ch = cell.clientHeight;
                const iw = imgEl.naturalWidth,
                    ih = imgEl.naturalHeight;

                if (!cw || !ch || !iw || !ih) return;

                const cellRatio = cw / ch;
                const imgRatio = iw / ih;

                if (cellRatio < imgRatio) {
                    // سلول نسبتاً عریض‌تر؛ ارتفاع را پر کن
                    $img.css({
                        width: 'auto',
                        height: '100%'
                    });
                } else {
                    // سلول نسبتاً بلندتر؛ عرض را پر کن
                    $img.css({
                        width: '100%',
                        height: 'auto'
                    });
                }

                // سایز حقیقی عکس
                const dw = $img.width(),
                    dh = $img.height();

                // مرکز کردن
                const offsetX = (cw - dw) / 2;
                const offsetY = (ch - dh) / 2;

                $img.css({
                    top: offsetY + 'px',
                    left: offsetX + 'px'
                });

                // فعال‌سازی panzoom - make sure panzoom is defined
                if (typeof panzoom === 'function') {
                    panzoom(imgEl, {
                        bounds: true,
                        boundsPadding: 0,
                        maxZoom: 5,
                        minZoom: 0.5,
                        pinchAndZoom: true
                    });
                }
            }

            if (imgEl.complete && imgEl.naturalWidth > 0) {
                adjust();
            } else {
                imgEl.addEventListener('load', adjust);
            }
        });
    }

    // Expose functions to global scope for external use
    window.imageManager = {
        rearrangeImages: rearrangeImages,
        changeImageLayout: changeImageLayout,
        moveImage: moveImage,
        setFeaturedImage: setFeaturedImage,
        getPhotos: function() {
            return [...photoFiles]; // Return a copy of the photo array
        },
        getImageData: function() {
            return JSON.parse(JSON.stringify(imageData)); // Return a deep copy of imageData
        }
    };






    // Enhanced text elements with gesture-based resizing ONLY (no moving)
    $('.post-text').each(function() {
        const $text = $(this);
        let initialTouchDistance = 0;
        let isResizing = false;
        let baseFontSize = parseInt($text.css('font-size')) || 30;

        // Style the text element (removed cursor:move)
        $text.css({
            'position': 'relative',
            // 'padding': '10px',
            // 'background-color': 'rgba(255, 255, 255, 0.8)',
            // 'border': '2px solid #8b0fb4',
            // 'border-radius': '5px',
            'user-select': 'none',
            'z-index': '2',
            'font-size': baseFontSize + 'px',
            // 'width': $text.attr('width') + 'px',
            'box-sizing': 'border-box'
        });

        // Handle touch start events for resizing only
        $text.on('touchstart', function(e) {
            // Check for multi-touch (pinch gesture)
            if (e.originalEvent.touches && e.originalEvent.touches.length >= 2) {
                e.preventDefault();
                isResizing = true;
                initialTouchDistance = getTouchDistance(
                    e.originalEvent.touches[0],
                    e.originalEvent.touches[1]
                );
            }
        });

        // Handle touch move events for resizing only
        $(document).on('touchmove', function(e) {
            if (isResizing && e.originalEvent.touches && e.originalEvent.touches.length >= 2) {
                e.preventDefault();
                const currentDistance = getTouchDistance(
                    e.originalEvent.touches[0],
                    e.originalEvent.touches[1]
                );

                const scale = currentDistance / initialTouchDistance;
                const newSize = Math.max(8, Math.min(72, baseFontSize * scale));
                $text.css('font-size', newSize + 'px');
            }
        });

        // Handle end events
        $(document).on('touchend', function() {
            if (isResizing) {
                baseFontSize = parseInt($text.css('font-size'));
                isResizing = false;
            }
        });

        // Mouse wheel for font size adjustment
        $text.on('wheel', function(e) {
            e.preventDefault();
            const delta = e.originalEvent.deltaY > 0 ? -1 : 1;
            const newSize = Math.max(8, Math.min(72, baseFontSize + delta));
            $text.css('font-size', newSize + 'px');
            baseFontSize = newSize;
        });

        // Helper function to calculate distance between two touch points
        function getTouchDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
    });

// New script to enable moving for .movable elements
    $('.movable').each(function() {
        const $element = $(this);
        let isDragging = false;
        let offsetX, offsetY;
        let startX, startY;

        // Style movable elements
        $element.css({
            'position': 'absolute',
            'cursor': 'move',
            'touch-action': 'none',
            'z-index': '1'
        });

        // Handle mouse/touch start
        $element.on('mousedown touchstart', function(e) {
            e.preventDefault();
            isDragging = true;

            const event = e.type === 'touchstart' ? e.originalEvent.touches[0] : e;
            const rect = this.getBoundingClientRect();

            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;
            startX = event.clientX;
            startY = event.clientY;

            // Bring to front
            // $('.movable').css('z-index', '3');
            // $element.css('z-index', '3');
        });

        // Handle movement
        $(document).on('mousemove touchmove', function(e) {
            if (!isDragging) return;
            e.preventDefault();

            const event = e.type === 'touchmove' ?
                (e.originalEvent.touches ? e.originalEvent.touches[0] : e) : e;

            // Only drag if movement exceeds threshold
            if (Math.abs(event.clientX - startX) > 5 || Math.abs(event.clientY - startY) > 5) {
                const wrapperRect = $wrapper[0].getBoundingClientRect();
                const scale = parseFloat($post.css('transform').split('(')[1].split(')')[0]);

                let newX = (event.clientX - wrapperRect.left - offsetX) / scale;
                let newY = (event.clientY - wrapperRect.top - offsetY) / scale;

                // Constrain within wrapper
                newX = Math.max(0, Math.min(newX, $post.width() - $element.outerWidth()));
                newY = Math.max(0, Math.min(newY, $post.height() - $element.outerHeight()));

                $element.css({
                    left: newX + 'px',
                    top: newY + 'px'
                });
            }
        });

        // Handle end
        $(document).on('mouseup touchend', function() {
            isDragging = false;
        });
    });

    $(document).ready(function() {
        // انتخاب رزولوشن پست
        // $('#resolution-options').on('change', function() {
        //     // دریافت مقدار value انتخاب شده
        //     const selectedValue = $(this).val();
        //     $('#PostBox').css({
        //         width:      selectedValue.split(/x/i)[0] + 'px',
        //         height:     selectedValue.split(/x/i)[1] + 'px',
        //     });
        //     scalePostBox()
        // });
        // $('#title').on('change', function() {
        //     // دریافت مقدار value انتخاب شده
        //     const title = $(this).val();
        //     $('#PostBox').css({
        //         width:      selectedValue.split(/x/i)[0] + 'px',
        //         height:     selectedValue.split(/x/i)[1] + 'px',
        //     });
        //     scalePostBox()
        // });

        // بارگذاری لیست استایل ها
        function createRadioButton(value, text) {
            return $('<label>', {
                'class': 'btn btn-outline-primary'
            }).append(
                $('<input>', {
                    type: 'radio',
                    name: 'styles',
                    autocomplete: 'off',
                    value: value
                }),
                ' ' + text
            );
        }
        const styles = $('[id^="style-"]');
        if(styles.length > 0) {
            styles.each(function() {
                const $this = $(this);
                $('#post-templates').append(
                    createRadioButton($this.attr('id'), $this.attr('name'))
                );
            });
        }
        // اعمال استایل انتخاب شده
        $('input[type="radio"][name="styles"]').change(function() {
            const selectedValue = $(this).val();
            styles.each(function(index, element) {
                const shouldHide = $(element).attr('id') !== selectedValue;
                $(element).toggleClass('d-none', shouldHide);
                // انتخاب رزولوشن پست
                if(!shouldHide) {
                    const selectedValue = $(element).attr("resolution");
                    $('#PostBox').css({
                        width:      selectedValue.split(/x/i)[0] + 'px',
                        height:     selectedValue.split(/x/i)[1] + 'px',
                    });
                    $('#ImageBox').css({
                        height: $(element).attr("IB-height") + 'px',
                        width:  $(element).attr("IB-width") + 'px',
                        right:  $(element).attr("IB-right") + 'px',
                        top:    $(element).attr("IB-top") + 'px'
                    });
                    scalePostBox()
                }

            });
        });

        // Listen for input changes (works for typing, pasting, etc.)
        $('#title').on('input', function() {
            const val = $(this).val().trim();
            $('.title').toggleClass('d-none', !val).html(val.replace(/\n/g, '<br>'));
        });
        $('#description').on('input', function() {
            const val = $(this).val().trim();
            $('.description').toggleClass('d-none', !val).html(val.replace(/\n/g, '<br>'));
        });
        $('#category').on('input', function() {
            const val = $(this).val().trim();
            $('.category-text').toggleClass('d-none', !val).html(val.replace(/\n/g, '<br>'));
        });

        const aiResponse = $('#aiResponse');
        // Generative AI usage
        $('#askAI').click(async function () {
            // نمایش وضعیت در حال ارسال
            aiResponse.text('در حال ارسال درخواست به هوش مصنوعی...');
            const urlParams = new URLSearchParams(window.location.search);
            const aiToken = urlParams.get('ai-token');

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${aiToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "deepseek/deepseek-chat-v3-0324:free",
                        messages: [
                            {
                                role: "system",
                                content: [
                                    {
                                        type: "text",
                                        "text": "شما نقش یک خبرنگار حرفه‌ای را دارید و باید فقط **یک خبر رسمی** بر اساس متن ارسالی کاربر تولید کنید.\n\n🟨 پاسخ شما **باید فقط شامل یک شیء JSON باشد** و نباید هیچ متن یا کاراکتر اضافی قبل یا بعد از آن بنویسید.\n\nساختار خبر باید شامل سه بخش زیر باشد:\n\n1. **\"category\"**: \n  - اگر خبر شامل **نقل قول از یک فرد** بود، مقدار این فیلد فقط باید **نام گوینده** باشد (مثال: «استاندار مازندران:»).\n  - در غیر این صورت، **موضوع خبر را فقط در قالب یک تا چهار کلمه** بنویسید (مثال: «فرهنگی» یا «توسعه شهری»).\n  - ⛔ **محدودیت: حداکثر ۴ کلمه**.\n\n2. **\"title\"**: \n  - اگر خبر نقل قول است، **خود جمله نقل‌قول شده** را به عنوان تیتر وارد کنید.\n  - در غیر این صورت، یک تیتر رسمی و دقیق از موضوع بنویسید.\n  - ⛔ **محدودیت: حداکثر ۱۱ کلمه**.\n\n3. **\"description\"**: \n  - توضیحی رسمی، خلاصه و دقیق درباره موضوع خبر بنویسید.\n  - ⛔ **محدودیت: حداکثر ۴۰ کلمه**.\n\n🔹 نکات مهم:\n- «استاندار» همیشه به «استاندار مازندران» اشاره دارد (دکتر یونسی).\n- متن‌ها باید کاملاً **رسمی و حرفه‌ای** نوشته شوند.\n- فقط خروجی **خالص JSON** ارسال شود. از اضافه کردن توضیح، متن اضافی یا علائم دیگر خودداری کنید.\n\n📦 ساختار خروجی دقیقاً باید به شکل زیر باشد:\n{\n  \"category\": \"...\",\n  \"title\": \"...\",\n  \"description\": \"...\"\n}"
                                    }
                                ]
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: $('#askAI-description').val()
                                    }
                                ]
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`خطا از سرور: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                const message = data.choices?.[0]?.message?.content;

                if (message) {
                    const parsedMessage = JSON.parse(message.replace(/^```json|```$/g, '').trim());
                    $('#title').val(parsedMessage.title).trigger('input');
                    $('#description').html(parsedMessage.description.replace(/\n/g, '<br>')).trigger('input');
                    $('#category').val(parsedMessage.category).trigger('input');
                    aiResponse.text('');
                } else {
                    aiResponse.text('پاسخی از سمت هوش مصنوعی دریافت نشد.');
                }
            } catch (error) {
                aiResponse.text(`خطا: ${error.message}`);
            }
        });
    });


});





