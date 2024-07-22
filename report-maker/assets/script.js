sampleData = {
    'data' : {
        'studentName' : 'محمدحسین میرزایی',
        'month' : 'اردیبهشت',
        'grade' : 'ششم',
        'province' : 'مازندران',
        'city' : 'جویبار',
        'teacherName'  : 'خانم سیدی',
        'managerName' : 'علی یعقوبی',
        'schoolName' : 'شهید قائمی',
    },
};
function newReport(data) {
    const gradeLessons = {
        'اول' : ['قرآن', 'فارسی', 'ریاضی', 'علوم', 'هنر', 'ورزش', 'شایستگی'],
        'دوم' : ['شایستگی', 'هدیه‌آسمانی', 'ورزش', 'هنر', 'علوم', 'ریاضی', 'فارسی', 'قرآن'],
        'سوم' : ['شایستگی', 'هدیه‌آسمانی', 'ورزش', 'هنر', 'علوم', 'ریاضی', 'فارسی', 'قرآن', 'مطالعات‌اجتماعی'],
        'چهارم' : ['شایستگی', 'هدیه‌آسمانی', 'ورزش', 'هنر', 'علوم', 'ریاضی', 'فارسی', 'قرآن', 'مطالعات‌اجتماعی'],
        'پنجم' : ['شایستگی', 'هدیه‌آسمانی', 'ورزش', 'هنر', 'علوم', 'ریاضی', 'فارسی', 'قرآن', 'مطالعات‌اجتماعی'],
        'ششم' : ['شایستگی', 'هدیه‌آسمانی', 'ورزش', 'هنر', 'علوم', 'ریاضی', 'فارسی', 'قرآن', 'مطالعات‌اجتماعی', 'تفکر و پژوهش', 'کار و فناوری']
    }
    const reportLayout = document.getElementById("reportExample");
    let newReport = reportLayout.cloneNode(true);
    newReport.id = "studentReport-" + getRandomInt(10000, 99999).toString();
    newReport.className = "single-report-table";
    Object.entries(data.data).forEach(([key, value]) => {
        newReport.querySelector("#" + key).innerHTML = value;
    });
    gradeLessons[data['data']['grade']].forEach((value, index) => {
        let i = index + 1;
        newReport.querySelector("#report").innerHTML += `<tr><td>${i}</td><td>${value}</td><td><span onclick="changeScore(this)" class="selection-cursor">خیلی خوب</span></td><!--<td><span onclick="changeProgress(this)" class="selection-cursor progress-emoji">طبیعی</span></td>--><td contenteditable="true"></td></tr>`;
    });
    if(document.getElementById('public-message').value === '') {
        newReport.querySelector("#publicMessageBox").style.display = 'none';
    }
    var iframe = document.getElementById('reports-iframe');
    if (iframe) {
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        var reportsDiv = iframeDoc.getElementById('reports');
        if (reportsDiv) {
            reportsDiv.appendChild(newReport);
            // reportsDiv.appendChild(document.createElement("hr"));
        }
    }
}



function getRandomInt(min, max) {
    return Math.random() * (max - min) + min;
}

document.getElementById('uploadForm').addEventListener('submit', function(event) {
    if(isChrome() === true) {
        event.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (file) {
            document.getElementById("download").style.display = "block";
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                let i = 0;
                var iframe = document.getElementById('reports-iframe');
                if (iframe) {
                    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    var reportsDiv = iframeDoc.getElementById('reports');
                    reportsDiv.innerHTML = '';
                }
                    jsonData.forEach(record => {
                    if(document.getElementById("selectGrade").value === record['پایه']) {
                        createSingleReport(record);
                        adjustIframeHeight();

                        i++;
                    }
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('لطفا فایل اکسل لیست دانش‌آموزان مدرسه را انتخاب کنید');
        }
    } else {
        alert("این برنامه فقط در مرورگر Google Chrome قابل اجراست.");
    }
});

function createSingleReport(row) {
    let sampleData = {
        'data': {
            'studentName': row['نام '] + " " + row['نام خانوادگي'],
            'month': document.getElementById('month-name').value,
            'grade': row['پایه'],
            'province': document.getElementById('province-name').value,
            'city': document.getElementById('city-name').value,
            'teacherName': document.getElementById('teacher-name').value,
            'managerName': document.getElementById('manager-name').value,
            'schoolName': document.getElementById('school-name').value,
            'publicMessage': document.getElementById('public-message').value
        },
    };
    newReport(sampleData);
}

document.getElementById('download').addEventListener('click', function() {
    var iframe = document.getElementById('reports-iframe');
    if (iframe) {
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        var reportsDiv = iframeDoc.getElementById('print-button');
        if (reportsDiv) {
            reportsDiv.click();
        }
    }
});




function isChrome() {
    return true;
    var userAgent = navigator.userAgent;
    return userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1 && userAgent.indexOf('OPR') === -1;
}


function adjustIframeHeight() {
    var iframe = document.getElementById('reports-iframe');
    if (iframe) {
            var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            var iframeHeight = iframeDocument.body.scrollHeight;
            console.log("iframe height:\t " + iframeHeight.toString());
            iframe.style.height = iframeHeight+40 + 'px';
    } else {
        console.log("No Iframe!");
    }
}

