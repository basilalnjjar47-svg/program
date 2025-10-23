const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
// Render ستقوم بتعيين المنفذ تلقائياً، هذا السطر يضمن التوافق
const port = process.env.PORT || 3000;

// هذا هو المسار الصحيح لملف البيانات
const testimonialsFilePath = path.join(__dirname, 'testimonials.json');

// Middlewares (برمجيات وسيطة)
app.use(cors()); // للسماح بالطلبات من واجهة الموقع
app.use(express.json()); // لتحليل البيانات القادمة بصيغة JSON
app.use(express.urlencoded({ extended: true })); // لتحليل البيانات من نموذج HTML

// 1. نقطة النهاية (API) لجلب كل آراء العملاء
app.get('/api/testimonials', (req, res) => {
    fs.readFile(testimonialsFilePath, 'utf8', (err, data) => {
        if (err) {
            // رسالة خطأ أوضح إذا لم يجد الملف
            console.error("خطأ: لا يمكن العثور على ملف 'testimonials.json' داخل مجلد 'server'. تأكد من وجود الملف.", err);
            return res.status(500).send('خطأ في قراءة بيانات آراء العملاء.');
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseError) {
            console.error("خطأ: ملف 'testimonials.json' يحتوي على صيغة JSON غير صالحة.", parseError);
            res.status(500).send('خطأ في تحليل بيانات آراء العملاء.');
        }
    });
});

// 2. نقطة النهاية (API) لإضافة رأي عميل جديد
app.post('/api/testimonials', (req, res) => {
    const newTestimonial = {
        name: req.body.name,
        message: req.body.message
    };

    // التحقق من أن البيانات ليست فارغة
    if (!newTestimonial.name || !newTestimonial.message) {
        return res.status(400).send('الاسم والرسالة مطلوبان.');
    }

    fs.readFile(testimonialsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("خطأ في قراءة الملف للحفظ:", err);
            return res.status(500).send('خطأ في قراءة البيانات.');
        }
        
        const testimonials = JSON.parse(data);
        testimonials.push(newTestimonial);

        fs.writeFile(testimonialsFilePath, JSON.stringify(testimonials, null, 2), (err) => {
            if (err) {
                console.error("خطأ في كتابة الملف:", err);
                return res.status(500).send('خطأ في حفظ البيانات.');
            }
            // بعد الحفظ بنجاح، يتم توجيه المستخدم إلى الصفحة الرئيسية عند قسم الآراء
            // هذا هو التعديل الذي طلبته لإعادة التوجيه للصفحة الرئيسية
            res.redirect('/index.html#testimonials');
        });
    });
});

app.listen(port, () => {
    console.log(`السيرفر يعمل على http://localhost:${port}`);
});
