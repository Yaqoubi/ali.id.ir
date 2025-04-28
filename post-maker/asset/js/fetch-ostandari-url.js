$(document).ready(function() {
    $('#fetch-ostandari-url').on('click', function() {
        const url = $('#ostandari-url').val();
        const proxy = 'https://api.allorigins.win/get?url=';
        const ostandari_url_response = $('#ostandari-url-response');
        // آپدیت متن به حالت اولیه
        ostandari_url_response.text('شروع فرآیند دریافت محتوا...');

        $.ajax({
            url: proxy + encodeURIComponent(url),
            method: 'GET',
            success: function(response) {
                ostandari_url_response.text('✅ دریافت پاسخ از سرور');

                if(response.contents) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.contents, 'text/html');
                    // استخراج اطلاعات و نمایش در کنسول
                    const metaData = {
                        articleTag:     $(doc).find('p.pre-title').text().trim() || 'یافت نشد',
                        ogTitle:        $(doc).find('article.blog-post h1').text().trim().replace(/\n/g, '') || 'یافت نشد',
                        ogImage:        $(doc).find('meta[property="og:image"]').attr('content').replace('www.demoportal.jcotest.ir/', 'ostan-mz.ir') || 'یافت نشد',
                        ogDesc:         $(doc).find('div.summery p').text().trim().replace(/\n/g, '') || 'یافت نشد',
                        contentNews:    $(doc).find('div.content-news p').text().trim() || 'یافت نشد'
                    };

                    $('#title').val(metaData.ogTitle).trigger('input');
                    $('#description').html(metaData.ogDesc).trigger('input');
                    $('#category').val(metaData.articleTag).trigger('input');
                    $('#askAI-description').val(
                        metaData.articleTag + "\n" +
                        metaData.ogTitle + "\n" +
                        metaData.ogDesc + "\n" +
                        metaData.contentNews
                    ).trigger('input');
                    addImageByUrl(metaData.ogImage);

                    ostandari_url_response.text('✅ فرآیند با موفقیت تکمیل شد');
                } else {
                    ostandari_url_response.text('❌ خطا: پاسخ سرور فاقد محتوا است');
                }
            },
            error: function(xhr, status, error) {
                ostandari_url_response.text(`❌ خطا: ${error}`);
            }
        });
    });
});



(async function($) {
    /**
     * اضافه کردن عکس با URL به لیست عکس‌ها با تلاش مجدد در صورت خطا
     * @param {string} photoUrl - آدرس تصویر
     */
    window.addImageByUrl = async function(photoUrl) {
        const maxPhotos = 4;
        const maxRetries = 3; // حداکثر دفعات تلاش
        const retryDelay = 1000; // زمان بین تلاش‌ها (به میلی‌ثانیه)

        const currentCount = window.imageManager.getPhotos().length;
        if (currentCount >= maxPhotos) {
            alert(`حداکثر ${maxPhotos} عکس قابل آپلود است. شما اکنون ${currentCount} عکس دارید.`);
            return;
        }

        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(photoUrl)}`;

        let attempt = 0;
        let blob = null;

        while (attempt < maxRetries) {
            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`خطا در دریافت تصویر: ${response.status}`);
                blob = await response.blob();
                break; // اگر موفق شدیم، از حلقه خارج شو
            } catch (err) {
                attempt++;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay)); // صبر کن
                } else {
                    alert('خطا در افزودن تصویر از طریق URL:\n' + err.message);
                    return;
                }
            }
        }

        // اگر blob با موفقیت دریافت شد، ادامه بده
        try {
            const urlParts = photoUrl.split('/');
            let fileName = urlParts[urlParts.length - 1].split('?')[0];
            if (!fileName) fileName = 'image.jpg';

            const file = new File([blob], fileName, { type: blob.type });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const input = document.getElementById('photo-upload');
            input.files = dataTransfer.files;

            $(input).trigger('change');
        } catch (err) {
            alert('خطا در پردازش تصویر:\n' + err.message);
        }
    };
})(jQuery);
