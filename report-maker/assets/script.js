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
    event.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file && file.type === 'application/json') {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                document.getElementById("download").style.display = "block";
                document.getElementById("download-json").style.display = "block";
                const jsonData = JSON.parse(e.target.result);
                var iframe = document.getElementById('reports-iframe');
                if (iframe) {
                    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    var reportsDiv = iframeDoc.getElementById('reports');
                    reportsDiv.innerHTML = '';
                }
                jsonData.forEach(student => {
                   if(document.getElementById("selectGrade").value === 'همه' || document.getElementById("selectGrade").value === student['grade']) {
                       createSingleReport(student);
                       adjustIframeHeight();
                       console.log(student['name']);
                   }
                });
            } catch (error) {
                alert(error + 'خطایی در خواندن JSON رخ داد.');
            }
        };

        reader.onerror = function() {
            alert('خطایی در خواندن فایل رخ داد.');
        };
        reader.readAsText(file);
    } else {
        alert('لطفا فایل JSON اطلاعات را انتخاب کنید!')
    }
});


function createSingleReport(row) {
    let sampleData = {
        'data': {
            'studentName': row['name'],
            'month': document.getElementById('month-name').value,
            'grade': row['grade'],
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

function download_json(){
    var iframe = document.getElementById('reports-iframe');
    if (iframe) {
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const reports = iframeDoc.querySelectorAll('.single-report-table');
        const data = [];
        reports.forEach(report => {
            if(report.querySelectorAll('.print-checkbox')[0].querySelectorAll('input')[0].checked) {
                const name = report.querySelectorAll('.student-name')[0].textContent;
                const grade = report.querySelectorAll('.student-grade')[0].textContent;
                data.push({"code": "0", "name": name, "grade": grade });
            }
        });
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'studentData.json';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);    }
}

function downloadSampleJson() {
    const jsonData = [
        {
            "code": "0",
            "name": "علی عظیمی",
            "grade": "اول"
        },
        {
            "code": "0",
            "name": "امیر آرام",
            "grade": "اول"
        },
        {
            "code": "0",
            "name": "ابراهیم حامدی",
            "grade": "دوم"
        },
        {
            "code": "0",
            "name": "محمد اصفهانی",
            "grade": "دوم"
        },
        {
            "code": "0",
            "name": "داریوش اقبالی",
            "grade": "سوم"
        },
        {
            "code": "0",
            "name": "امید سلطانی",
            "grade": "سوم"
        },
        {
            "code": "0",
            "name": "پویا پورجلیل",
            "grade": "چهارم"
        },
        {
            "code": "0",
            "name": "جمشید مقدم",
            "grade": "چهارم"
        },
        {
            "code": "0",
            "name": "حمید حامی",
            "grade": "پنجم"
        },
        {
            "code": "0",
            "name": "حبیب محبیان",
            "grade": "پنجم"
        },
        {
            "code": "0",
            "name": "ناصر عبداللهی",
            "grade": "ششم"
        },
        {
            "code": "0",
            "name": "محمد معتمدی",
            "grade": "ششم"
        }
    ];
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.download = "student-sample.json";
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
